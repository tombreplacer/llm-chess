import type { GrandmasterStyle, TtsConfig } from '../types/chess';

export class SpeechService {
  private voices: SpeechSynthesisVoice[] = [];
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.initVoices();
        };
      }
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voices = window.speechSynthesis.getVoices();
    this.isInitialized = true;
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (!this.isInitialized && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
    }
    return this.voices;
  }

  public getDefaultVoice(): SpeechSynthesisVoice | null {
    const voices = this.getVoices();
    if (voices.length === 0) return null;

    // Ищем русский голос
    const ruVoice = voices.find(v => v.lang.startsWith('ru') || v.lang.includes('RU'));
    if (ruVoice) return ruVoice;

    // Иначе системный default или первый доступный
    const defaultVoice = voices.find(v => v.default);
    return defaultVoice || voices[0] || null;
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public speak(
    text: string,
    config: TtsConfig,
    style?: GrandmasterStyle
  ) {
    if (!config.enabled || !text.trim()) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    this.stop();

    // Очищаем текст от технической разметки если попалась
    const cleanText = text
      .replace(/<[^>]+>/g, '')
      .replace(/[#*`_]/g, '')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Выбираем голос
    const voices = this.getVoices();
    if (config.voiceURI) {
      const selectedVoice = voices.find(v => v.voiceURI === config.voiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else {
      const def = this.getDefaultVoice();
      if (def) utterance.voice = def;
    }

    let finalPitch = config.pitch;
    let finalRate = config.rate;

    // Персональная тонкая настройка под стиль гроссмейстера
    if (style === 'nikolaich') {
      finalPitch = Math.max(0.6, config.pitch * 0.82); // грубый, басовитый дворовый голос
      finalRate = Math.min(1.4, config.rate * 1.05);
    } else if (style === 'karpov') {
      finalPitch = Math.min(1.3, config.pitch * 1.02);
      finalRate = Math.max(0.7, config.rate * 0.92); // спокойный, размеренный тон
    } else if (style === 'kasparov' || style === 'tal') {
      finalRate = Math.min(1.5, config.rate * 1.12); // энергичный, эмоциональный
      finalPitch = Math.min(1.4, config.pitch * 1.08);
    } else if (style === 'troll') {
      finalPitch = Math.min(1.5, config.pitch * 1.15); // язвительный тон
    }

    utterance.pitch = Math.max(0.5, Math.min(2.0, finalPitch));
    utterance.rate = Math.max(0.5, Math.min(2.0, finalRate));
    utterance.volume = Math.max(0, Math.min(1.0, config.volume));

    window.speechSynthesis.speak(utterance);
  }
}

export const speechService = new SpeechService();
