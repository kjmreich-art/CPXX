
/**
 * [알람 음원 설정]
 * 깃허브의 raw.githubusercontent.com 도메인을 사용하여 CORS 에러를 방지하고
 * 브라우저가 직접 MP3 데이터를 가져올 수 있도록 설정합니다.
 */
const ALARM_URLS = {
  READING_START: 'https://raw.githubusercontent.com/kjmreich-art/mus/main/sanghwang.mp3', // 1. 상황숙지 (0s)
  ROOM_ENTRY: 'https://raw.githubusercontent.com/kjmreich-art/mus/main/ipsil.mp3',         // 2. 입실 (1m)
  TWO_MIN_WARNING: 'https://raw.githubusercontent.com/kjmreich-art/mus/main/2min.mp3',    // 3. 2분전
  CONSULT_END: 'https://raw.githubusercontent.com/kjmreich-art/mus/main/end.mp3'          // 4. 종료
};

class AudioService {
  private context: AudioContext | null = null;
  private bufferCache: Map<string, AudioBuffer> = new Map();

  private async getContext() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.context;
  }

  /**
   * iOS의 오디오 차단을 해제합니다. 
   * 반드시 사용자의 '클릭' 이벤트 핸들러 내부에서 호출되어야 합니다.
   */
  public async unlock() {
    const ctx = await this.getContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    // 무음 버퍼를 짧게 재생하여 시스템에 오디오 사용을 알립니다 (iOS용 트릭)
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  }

  public async preloadAll() {
    console.log('알람 음원 사전 로드 중...');
    const urls = Object.values(ALARM_URLS);
    try {
      await Promise.all(urls.map(url => this.loadSound(url)));
      console.log('모든 음원 로드 완료');
    } catch (e) {
      console.warn('일부 음원 로드 실패');
    }
  }

  private async loadSound(url: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }

    try {
      const response = await fetch(url, { mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const ctx = await this.getContext();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.bufferCache.set(url, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.warn('MP3 로드 실패, 기본 비프음으로 대체합니다:', url);
      return null;
    }
  }

  private async playBuffer(buffer: AudioBuffer) {
    const ctx = await this.getContext();
    // 재생 직전 상태 확인 및 재개 (iOS 호환성 강화)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    
    source.buffer = buffer;
    gainNode.gain.setValueAtTime(0.8, ctx.currentTime);
    
    source.connect(gainNode);
    gainNode.connect(ctx.destination);
    source.start(0);
  }

  public async playReadingStart() {
    const buffer = await this.loadSound(ALARM_URLS.READING_START);
    if (buffer) this.playBuffer(buffer);
    else this.playFallbackBeep(440, 0.5); 
  }

  public async playRoomEntry() {
    const buffer = await this.loadSound(ALARM_URLS.ROOM_ENTRY);
    if (buffer) this.playBuffer(buffer);
    else this.playFallbackBeep(660, 0.4);
  }

  public async playTwoMinWarning() {
    const buffer = await this.loadSound(ALARM_URLS.TWO_MIN_WARNING);
    if (buffer) this.playBuffer(buffer);
    else this.playFallbackBeep(520, 0.8);
  }

  public async playConsultEnd() {
    const buffer = await this.loadSound(ALARM_URLS.CONSULT_END);
    if (buffer) this.playBuffer(buffer);
    else this.playFallbackBeep(880, 1.2);
  }

  private async playFallbackBeep(freq: number, duration: number) {
    const ctx = await this.getContext();
    if (ctx.state === 'suspended') await ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }
}

export const audioService = new AudioService();
