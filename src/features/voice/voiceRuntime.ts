export interface SpeechRecognitionConstructor {
  new(): unknown;
}

export interface SpeechRuntimeWindow {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
  SpeechSynthesisUtterance?: new (text: string) => unknown;
  speechSynthesis?: unknown;
}

export interface SpeechRuntimeNavigator {
  language?: string;
  mediaDevices?: {
    getUserMedia?: unknown;
  };
}

export interface SpeechInputSupport {
  supported: boolean;
  reason: 'ok' | 'microphone-unavailable' | 'speech-recognition-unavailable';
}

export const RECORDING_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/wav',
  'audio/ogg;codecs=opus',
];

export function pickRecordingMimeTypeFromSupport(isTypeSupported?: (mimeType: string) => boolean): string {
  if (typeof isTypeSupported !== 'function') return '';
  return RECORDING_MIME_CANDIDATES.find((type) => {
    try {
      return Boolean(isTypeSupported(type));
    } catch {
      return false;
    }
  }) ?? '';
}

export function audioFileNameForMimeType(mimeType: string): string {
  const normalized = mimeType.toLowerCase();
  if (normalized.includes('mp4')) return 'recording.m4a';
  if (normalized.includes('ogg')) return 'recording.ogg';
  if (normalized.includes('wav')) return 'recording.wav';
  if (normalized.includes('mpeg') || normalized.includes('mp3')) return 'recording.mp3';
  return 'recording.webm';
}

export function getSpeechRecognitionConstructor(win: SpeechRuntimeWindow): SpeechRecognitionConstructor | null {
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

export function getSystemSpeechInputSupport(
  win: SpeechRuntimeWindow,
  nav: SpeechRuntimeNavigator,
): SpeechInputSupport {
  if (typeof nav.mediaDevices?.getUserMedia !== 'function') {
    return { supported: false, reason: 'microphone-unavailable' };
  }
  if (!getSpeechRecognitionConstructor(win)) {
    return { supported: false, reason: 'speech-recognition-unavailable' };
  }
  return { supported: true, reason: 'ok' };
}

export function canUseSystemSpeechOutput(win: SpeechRuntimeWindow): boolean {
  return Boolean(win.speechSynthesis && win.SpeechSynthesisUtterance);
}

export function resolveVoiceLanguage(configuredLanguage: string | undefined, navigatorLanguage: string | undefined): string {
  const configured = String(configuredLanguage || '').trim();
  if (configured && configured !== 'system') return configured;
  return navigatorLanguage || 'zh-CN';
}
