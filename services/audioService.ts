
class AudioService {
  private context: AudioContext | null = null;

  private initContext() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
  }

  public playBeep(frequency: number = 440, duration: number = 0.5, type: OscillatorType = 'sine') {
    this.initContext();
    if (!this.context) return;

    const oscillator = this.context.createOscillator();
    const gainNode = this.context.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.context.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.00001, this.context.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.context.destination);

    oscillator.start();
    oscillator.stop(this.context.currentTime + duration);
  }

  public playDoubleBeep() {
    this.playBeep(440, 0.2);
    setTimeout(() => this.playBeep(880, 0.4), 250);
  }

  public playTripleBeep() {
    this.playBeep(523.25, 0.15);
    setTimeout(() => this.playBeep(523.25, 0.15), 200);
    setTimeout(() => this.playBeep(523.25, 0.15), 400);
  }
}

export const audioService = new AudioService();
