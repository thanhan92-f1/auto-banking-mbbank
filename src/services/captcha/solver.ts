import * as ort from 'onnxruntime-node';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { load } from 'js-yaml';
import { CaptchaSolveResult } from '@/types/captcha';

interface CaptchaConfigYaml {
  height: number;
  width: number;
  vocab: string;
}

class CaptchaSolverService {
  private session: ort.InferenceSession | null = null;
  private vocab: string = '';
  private targetWidth: number = 160;
  private targetHeight: number = 50;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    // Lazy init khi có request đầu tiên
  }

  /**
   * Khởi tạo Inference Session và load config
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const modelDir = path.join(process.cwd(), 'model', 'mbbank');
        const configPath = path.join(modelDir, 'configs.yaml');
        const modelPath = path.join(modelDir, 'model.onnx');

        if (!fs.existsSync(modelPath)) {
          throw new Error(`Model file not found at: ${modelPath}`);
        }
        if (!fs.existsSync(configPath)) {
          throw new Error(`Config file not found at: ${configPath}`);
        }

        // Đọc cấu hình vocab và kích thước
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = load(configContent) as CaptchaConfigYaml;

        this.vocab = config.vocab || '';
        this.targetWidth = config.width || 160;
        this.targetHeight = config.height || 50;

        // Khởi tạo ONNX Session với CPU provider
        this.session = await ort.InferenceSession.create(modelPath, {
          executionProviders: ['cpu'],
          graphOptimizationLevel: 'all',
        });

        this.isInitialized = true;
        console.log(`[CaptchaSolver] Khởi tạo thành công model ONNX MBBank (Vocab: ${this.vocab.length} ký tự).`);
      } catch (err: any) {
        console.error('[CaptchaSolver] Khởi tạo thất bại:', err);
        throw err;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  /**
   * Giải captcha từ Buffer hoặc Base64
   */
  public async solve(imageInput: Buffer | string): Promise<CaptchaSolveResult> {
    const startTime = Date.now();
    try {
      await this.init();

      if (!this.session) {
        throw new Error('Inference session is not available.');
      }

      // Xử lý base64 nếu có tiền tố data:image
      let imageBuffer: Buffer;
      if (typeof imageInput === 'string') {
        const cleanBase64 = imageInput.replace(/^data:image\/\w+;base64,/, '').trim();
        imageBuffer = Buffer.from(cleanBase64, 'base64');
      } else {
        imageBuffer = imageInput;
      }

      // Sử dụng Sharp để resize về đúng kích thước (160x50) và trích xuất raw RGB
      const { data, info } = await sharp(imageBuffer)
        .resize(this.targetWidth, this.targetHeight, { fit: 'fill' })
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Chuyển sang định dạng BGR và giữ nguyên thang đo [0.0, 255.0]
      // Khớp chính xác 100% với cv2.imdecode(IMREAD_COLOR) của OpenCV khi train model
      const totalPixels = info.width * info.height * info.channels;
      const float32Data = new Float32Array(totalPixels);
      for (let i = 0; i < totalPixels; i += 3) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        float32Data[i] = b;     // Kênh B
        float32Data[i + 1] = g; // Kênh G
        float32Data[i + 2] = r; // Kênh R
      }

      // Tạo tensor đầu vào
      const inputTensor = new ort.Tensor('float32', float32Data, [1, info.height, info.width, info.channels]);
      const inputName = this.session.inputNames[0];

      // Chạy suy luận ONNX
      const outputMap = await this.session.run({ [inputName]: inputTensor });
      const outputName = this.session.outputNames[0];
      const outputTensor = outputMap[outputName];

      // Output shape: [1, sequence_length, num_classes] (ví dụ: [1, 40, 64])
      const [batch, seqLen, numClasses] = outputTensor.dims;
      const outputData = outputTensor.data as Float32Array;

      // CTC Greedy Decoding
      const text = this.ctcGreedyDecode(outputData, seqLen, numClasses);
      const durationMs = Date.now() - startTime;

      return {
        text,
        durationMs,
        success: true,
      };
    } catch (err: any) {
      return {
        text: '',
        durationMs: Date.now() - startTime,
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * CTC Greedy Decoder: Tìm argmax -> Gom cụm liên tiếp -> Lọc bỏ blank token
   */
  private ctcGreedyDecode(data: Float32Array, seqLen: number, numClasses: number): string {
    const blankIdx = this.vocab.length; // Index của ký tự blank là len(vocab)
    const rawIndices: number[] = [];

    // Tìm argmax tại mỗi timestep
    for (let t = 0; t < seqLen; t++) {
      let maxVal = -Infinity;
      let maxIdx = -1;
      const offset = t * numClasses;

      for (let c = 0; c < numClasses; c++) {
        const val = data[offset + c];
        if (val > maxVal) {
          maxVal = val;
          maxIdx = c;
        }
      }
      rawIndices.push(maxIdx);
    }

    // Gom các index liên tiếp giống nhau (itertools.groupby)
    const grouped: number[] = [];
    for (let i = 0; i < rawIndices.length; i++) {
      if (i === 0 || rawIndices[i] !== rawIndices[i - 1]) {
        grouped.push(rawIndices[i]);
      }
    }

    // Loại bỏ blank token và chuyển thành ký tự
    let result = '';
    for (const idx of grouped) {
      if (idx < this.vocab.length) {
        result += this.vocab[idx];
      }
    }

    return result;
  }
}

// Export singleton instance
export const captchaSolver = new CaptchaSolverService();
