
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
  private isUnlocked: boolean = false;

  private getContext(): AudioContext {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.context = new AudioContextClass({ latencyHint: 'interactive' });
    }
    return this.context;
  }

  /**
   * 앱 초기화 시 호출하여 글로벌 언락 리스너를 등록합니다.
   * 사용자가 화면을 터치하는 순간 오디오 시스템을 깨웁니다.
   */
  public init() {
    const unlockHandler = () => {
      this.unlock();
      ['touchstart', 'touchend', 'click', 'keydown'].forEach(event => {
        window.removeEventListener(event, unlockHandler);
      });
    };

    ['touchstart', 'touchend', 'click', 'keydown'].forEach(event => {
      window.addEventListener(event, unlockHandler, { passive: true, once: true });
    });
  }

  /**
   * iOS의 오디오 차단을 해제합니다. 
   * 반드시 사용자의 인터랙션 이벤트 핸들러 내부에서 호출되어야 합니다.
   */
  public async unlock() {
    if (this.isUnlocked) return;
    
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.error('AudioContext resume failed', e);
      }
    }
    
    // 무음 버퍼를 짧게 재생하여 시스템에 오디오 사용을 알립니다 (iOS용 필수 트릭)
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      this.isUnlocked = true;
      console.log('Audio unlocked');
    } catch (e) {
      console.error('Audio unlock failed', e);
    }
  }

  public async preloadAll() {
    console.log('알람 음원 사전 로드 중...');
    const urls = Object.values(ALARM_URLS);
    try {
      // 오디오 컨텍스트가 없어도 디코딩을 위해 임시로 생성할 수 있지만,
      // 여기서는 getContext()를 통해 메인 컨텍스트를 사용합니다.
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
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const ctx = this.getContext();
      
      // decodeAudioData는 콜백 방식과 프로미스 방식을 모두 지원하지만
      // iOS 구버전 호환성을 위해 프로미스로 감싸는 것이 안전할 수 있습니다.
      // 여기서는 최신 표준인 await를 사용하되 에러 핸들링을 강화합니다.
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.bufferCache.set(url, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.warn('MP3 로드 또는 디코딩 실패, 기본 비프음으로 대체합니다:', url, error);
      return null;
    }
  }

  private async playBuffer(buffer: AudioBuffer) {
    const ctx = this.getContext();
    
    // 재생 직전 상태 확인 및 재개 (iOS 호환성 강화)
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.error('Resume failed during play', e);
      }
    }
    
    try {
      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();
      
      source.buffer = buffer;
      gainNode.gain.setValueAtTime(1.0, ctx.currentTime); // 볼륨을 1.0으로 설정
      
      source.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start(0);
    } catch (e) {
      console.error('Play buffer failed', e);
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

  private async playFallbackBeep(freq: number, duration: number) {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') await ctx.resume();
    
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error('Fallback beep failed', e);
    }
  }
}

export const audioService = new AudioService();
