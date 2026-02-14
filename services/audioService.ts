
/**
 * [알람 음원 설정 가이드]
 * 1. 깃허브: https://raw.githubusercontent.com/사용자/레포/main/파일.mp3 (권장)
 * 2. 원드라이브: 직링크 변환 도구를 통해 얻은 'Direct Download' 주소만 가능
 * 3. 구글 드라이브: 직링크 변환 도구를 통해 얻은 주소만 가능
 */

// 현재 모든 알람에 사용 중인 주소입니다.
const ALARM_URL = 'https://raw.githubusercontent.com/kjmreich-art/CPXX/main/ipsil.mp3';

const ALARM_URLS = {
  READING_START: ALARM_URL,
  ROOM_ENTRY: ALARM_URL,
  TWO_MIN_WARNING: ALARM_URL,
  CONSULT_END: ALARM_URL
};

class AudioService {
  private context: AudioContext | null = null;
  private bufferCache: Map<string, AudioBuffer> = new Map();

  private async initContext() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
    return this.context;
  }

  public async preloadAll() {
    console.log('오디오 사전 로드 시작...');
    try {
      const urls = Array.from(new Set(Object.values(ALARM_URLS)));
      await Promise.all(urls.map(url => this.loadSound(url)));
      console.log('모든 오디오 로드 완료');
    } catch (e) {
      console.warn('일부 오디오 로드 실패 (네트워크 또는 CORS 문제)');
    }
  }

  private async loadSound(url: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url)!;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        // 원드라이브 등 외부 서버의 경우 CORS 정책에 따라 차단될 수 있음
        mode: 'cors', 
      });

      if (!response.ok) {
        throw new Error(`HTTP 에러: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const ctx = await this.initContext();
      
      const audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
        ctx.decodeAudioData(arrayBuffer, resolve, reject);
      });

      this.bufferCache.set(url, audioBuffer);
      return audioBuffer;
    } catch (error: any) {
      console.error('오디오 로드 실패:', url, error.message);
      return null;
    }
  }

  private async playBuffer(buffer: AudioBuffer) {
    try {
      const ctx = await this.initContext();
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      
      source.buffer = buffer;
      gainNode.gain.setValueAtTime(0.8, ctx.currentTime);
      
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(0);
    } catch (e) {
      console.error('재생 중 오류 발생:', e);
    }
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

  private playFallbackBeep(freq: number, duration: number) {
    // 오디오 파일 로드에 실패했을 때를 대비한 기본 비프음
    if (!this.context) return;
    try {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.frequency.setValueAtTime(freq, this.context.currentTime);
      gain.gain.setValueAtTime(0.1, this.context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, this.context.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.context.destination);
      osc.start();
      osc.stop(this.context.currentTime + duration);
    } catch (e) {}
  }
}

export const audioService = new AudioService();
