/**
 * Chuyển đổi số tiền thành chữ tiếng Việt
 */
export function numberToVietnameseWords(num: number): string {
  if (num === 0) return 'không';

  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  function readGroup(group: number): string {
    const hundred = Math.floor(group / 100);
    const ten = Math.floor((group % 100) / 10);
    const unit = group % 10;
    let res = '';

    if (hundred > 0) {
      res += digits[hundred] + ' trăm ';
    }

    if (ten > 1) {
      res += digits[ten] + ' mươi ';
      if (unit === 1) res += 'mốt ';
      else if (unit === 5) res += 'lăm ';
      else if (unit > 0) res += digits[unit] + ' ';
    } else if (ten === 1) {
      res += 'mười ';
      if (unit === 5) res += 'lăm ';
      else if (unit > 0) res += digits[unit] + ' ';
    } else if (hundred > 0 && unit > 0) {
      res += 'lẻ ' + digits[unit] + ' ';
    } else if (unit > 0) {
      res += digits[unit] + ' ';
    }

    return res.trim();
  }

  let temp = Math.abs(num);
  const groups: number[] = [];

  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  let result = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    const grp = groups[i];
    if (grp > 0) {
      const read = readGroup(grp);
      result += read + ' ' + units[i] + ' ';
    }
  }

  return result.trim();
}

/**
 * Phát âm thanh chuông "Ting Ting" ngân vang báo hiệu thanh toán thành công (Web Audio API)
 */
export function playSuccessChime(): Promise<void> {
  return new Promise((resolve) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        resolve();
        return;
      }

      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Nốt thứ nhất (587.33 Hz - D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Nốt thứ hai ngân vang hơn (880 Hz - A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.4, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.65);

      setTimeout(() => {
        ctx.close().catch(() => {});
        resolve();
      }, 650);
    } catch {
      resolve();
    }
  });
}

/**
 * Đọc thông báo giọng nói: Đọc số tiền và mô tả đơn hàng
 */
export function speakText(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Dừng câu nói trước nếu có

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.95; // Tốc độ vừa phải, dễ nghe
      utterance.pitch = 1.05;

      // Tìm giọng đọc tiếng Việt nếu có
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find((v) => v.lang.includes('vi') || v.name.toLowerCase().includes('vietnam'));
      if (viVoice) {
        utterance.voice = viVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    } catch {
      resolve();
    }
  });
}

/**
 * Phát chuông thông báo và đọc to: Số tiền + Mô tả đơn hàng
 * Mô phỏng Loa thông báo chuyển khoản thông minh (SoundBox)
 */
export async function announcePaymentSuccess(amount: number, description: string): Promise<void> {
  // 1. Phát tiếng chuông Ting Ting ngân vang
  await playSuccessChime();

  // 2. Định dạng câu nói tiếng Việt tự nhiên
  const words = numberToVietnameseWords(amount);
  const cleanDesc = description ? description.replace(/[#_]/g, ' ') : '';
  const message = `Thanh toán thành công ${words} đồng. Mô tả đơn hàng: ${cleanDesc}`;

  // 3. Đọc to bằng Web Speech API
  await speakText(message);
}
