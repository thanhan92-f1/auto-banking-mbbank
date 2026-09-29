export interface CaptchaConfig {
  width: number;
  height: number;
  vocab: string;
}

export interface CaptchaSolveResult {
  text: string;
  durationMs: number;
  success: boolean;
  error?: string;
}
