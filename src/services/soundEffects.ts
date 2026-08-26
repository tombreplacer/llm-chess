/**
 * Процедурные звуковые эффекты для шахмат через Web Audio API
 */
class SoundEffects {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    try {
      this.isMuted = localStorage.getItem('llm_chess_muted') === 'true';
    } catch {
      this.isMuted = false;
    }
  }

  private getAudioContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    try {
      localStorage.setItem('llm_chess_muted', String(muted));
    } catch {}
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('llm_chess_muted', String(this.isMuted));
    } catch {}
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Звук обычного хода (деревянный стук)
   */
  public playMove(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }

  /**
   * Звук взятия фигуры (более резкий и плотный удар)
   */
  public playCapture(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Первый удар
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(450, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.12);
    gain1.gain.setValueAtTime(0.35, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Второй резонирующий щелчок
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(180, ctx.currentTime + 0.02);
    osc2.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.15);
    gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.12);
    osc2.start(ctx.currentTime + 0.02);
    osc2.stop(ctx.currentTime + 0.15);
  }

  /**
   * Звук шаха (тревожный двойной тон)
   */
  public playCheck(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const freqs = [587.33, 783.99]; // D5, G5
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.18);
    });
  }

  /**
   * Звук ошибки / нелегального хода / retry
   */
  public playRetry(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }

  /**
   * Победный аккорд
   */
  public playVictory(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const chord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });
  }
}

export const sounds = new SoundEffects();
