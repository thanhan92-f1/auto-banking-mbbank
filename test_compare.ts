import * as ort from 'onnxruntime-node';
import sharp from 'sharp';
import fs from 'fs';
import { load } from 'js-yaml';
import * as playwright from 'playwright';

async function testCaptchaDecoding() {
  console.log('1. Getting live Captcha from MBBank...');
  const browser = await playwright.chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox']
  });
  const page = await browser.newPage();
  let captchaBase64 = '';
  page.on('response', async (res) => {
    if (res.url().includes('getCaptchaImage')) {
      try {
        const json = await res.json();
        if (json.imageString) captchaBase64 = json.imageString;
      } catch (e) {}
    }
  });

  await page.goto('https://online.mbbank.com.vn/pl/login', { waitUntil: 'networkidle', timeout: 20000 });
  for (let i = 0; i < 20 && !captchaBase64; i++) {
    await page.waitForTimeout(500);
  }
  await browser.close();

  if (!captchaBase64) {
    console.error('Failed to get captcha');
    return;
  }
  console.log('Got captcha base64, length:', captchaBase64.length);

  // Save image for inspection
  fs.writeFileSync('test_captcha.png', Buffer.from(captchaBase64, 'base64'));

  // Load ONNX Model & Vocab
  const modelPath = 'model/mbbank/model.onnx';
  const config = load(fs.readFileSync('model/mbbank/configs.yaml', 'utf8')) as any;
  const vocab = config.vocab;
  const session = await ort.InferenceSession.create(modelPath, { executionProviders: ['cpu'] });

  const imageBuffer = Buffer.from(captchaBase64, 'base64');

  // Cách 1: Hiện tại trong solver.ts (RGB, chia cho 255.0)
  {
    const { data } = await sharp(imageBuffer)
      .resize(160, 50, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const float32Data = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      float32Data[i] = data[i] / 255.0;
    }
    const tensor = new ort.Tensor('float32', float32Data, [1, 50, 160, 3]);
    const output = await session.run({ [session.inputNames[0]]: tensor });
    const outputData = output[session.outputNames[0]].data as Float32Array;
    const text = decodeCTC(outputData, vocab);
    console.log('CÁCH 1 (RGB, chia 255.0 - hiện tại):', `"${text}"`);
  }

  // Cách 2: BGR, KHÔNG chia 255.0 (Giống OpenCV cv2.imdecode trong Python)
  {
    const { data } = await sharp(imageBuffer)
      .resize(160, 50, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // data đang là RGB RGB RGB...
    // Đổi sang BGR và giữ nguyên [0.0, 255.0]
    const float32Data = new Float32Array(data.length);
    for (let i = 0; i < data.length; i += 3) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      float32Data[i] = b;     // B
      float32Data[i + 1] = g; // G
      float32Data[i + 2] = r; // R
    }
    const tensor = new ort.Tensor('float32', float32Data, [1, 50, 160, 3]);
    const output = await session.run({ [session.inputNames[0]]: tensor });
    const outputData = output[session.outputNames[0]].data as Float32Array;
    const text = decodeCTC(outputData, vocab);
    console.log('CÁCH 2 (BGR, KHÔNG chia 255.0 - giống OpenCV):', `"${text}"`);
  }

  // Cách 3: RGB, KHÔNG chia 255.0
  {
    const { data } = await sharp(imageBuffer)
      .resize(160, 50, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const float32Data = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      float32Data[i] = data[i];
    }
    const tensor = new ort.Tensor('float32', float32Data, [1, 50, 160, 3]);
    const output = await session.run({ [session.inputNames[0]]: tensor });
    const outputData = output[session.outputNames[0]].data as Float32Array;
    const text = decodeCTC(outputData, vocab);
    console.log('CÁCH 3 (RGB, KHÔNG chia 255.0):', `"${text}"`);
  }

  // Cách 4: BGR, CÓ chia 255.0
  {
    const { data } = await sharp(imageBuffer)
      .resize(160, 50, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const float32Data = new Float32Array(data.length);
    for (let i = 0; i < data.length; i += 3) {
      float32Data[i] = data[i + 2] / 255.0; // B
      float32Data[i + 1] = data[i + 1] / 255.0; // G
      float32Data[i + 2] = data[i] / 255.0; // R
    }
    const tensor = new ort.Tensor('float32', float32Data, [1, 50, 160, 3]);
    const output = await session.run({ [session.inputNames[0]]: tensor });
    const outputData = output[session.outputNames[0]].data as Float32Array;
    const text = decodeCTC(outputData, vocab);
    console.log('CÁCH 4 (BGR, CÓ chia 255.0):', `"${text}"`);
  }
}

function decodeCTC(outputData: Float32Array, vocab: string): string {
  const timesteps = 40;
  const numClasses = vocab.length + 1;
  const argmaxList: number[] = [];

  for (let t = 0; t < timesteps; t++) {
    let maxIdx = 0;
    let maxVal = -Infinity;
    for (let c = 0; c < numClasses; c++) {
      const val = outputData[t * numClasses + c];
      if (val > maxVal) {
        maxVal = val;
        maxIdx = c;
      }
    }
    argmaxList.push(maxIdx);
  }

  const grouped: number[] = [];
  for (let i = 0; i < argmaxList.length; i++) {
    if (i === 0 || argmaxList[i] !== argmaxList[i - 1]) {
      grouped.push(argmaxList[i]);
    }
  }

  let result = '';
  for (const idx of grouped) {
    if (idx < vocab.length) {
      result += vocab[idx];
    }
  }
  return result;
}

testCaptchaDecoding().catch(console.error);
