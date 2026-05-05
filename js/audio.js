// ===== AUDIO ENGINE - Web Audio API synthesized sounds =====
const AudioEngine = (() => {
  let ctx = null, musicGain = null, sfxGain = null;
  let musicEnabled = true, sfxEnabled = true;
  let bgPlaying = false;
  let bgMusic = null;

  function init() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    musicGain = ctx.createGain(); musicGain.gain.value = 0.12; musicGain.connect(ctx.destination);
    sfxGain = ctx.createGain(); sfxGain.gain.value = 0.25; sfxGain.connect(ctx.destination);
  }

  function initBgMusic() {
    if (bgMusic) return;
    bgMusic = new Audio('assets/bg-music.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
  }

  function playNote(freq, duration, type = 'sine', gainNode = sfxGain, vol = 0.3, delay = 0) {
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0, ctx.currentTime + delay);
    g.gain.linearRampToValueAtTime(vol, ctx.currentTime + delay + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    o.connect(g); g.connect(gainNode);
    o.start(ctx.currentTime + delay); o.stop(ctx.currentTime + delay + duration);
  }

  function playNoise(duration, gainNode = sfxGain, vol = 0.15) {
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = buffer;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    src.connect(g); g.connect(gainNode);
    src.start(); src.stop(ctx.currentTime + duration);
  }

  return {
    init,
    diceRoll() {
      if (!sfxEnabled) return; init();
      for (let i = 0; i < 6; i++) playNoise(0.06, sfxGain, 0.08 + Math.random() * 0.05);
      playNote(300, 0.08, 'triangle', sfxGain, 0.15, 0);
      playNote(400, 0.08, 'triangle', sfxGain, 0.15, 0.06);
      playNote(350, 0.1, 'triangle', sfxGain, 0.2, 0.12);
    },
    tokenMove() {
      if (!sfxEnabled) return; init();
      playNote(500, 0.08, 'sine', sfxGain, 0.15);
    },
    tokenEnter() {
      if (!sfxEnabled) return; init();
      playNote(400, 0.1, 'sine', sfxGain, 0.2);
      playNote(600, 0.15, 'sine', sfxGain, 0.2, 0.1);
    },
    capture() {
      if (!sfxEnabled) return; init();
      playNote(200, 0.15, 'sawtooth', sfxGain, 0.2);
      playNote(150, 0.2, 'sawtooth', sfxGain, 0.15, 0.1);
      playNoise(0.15, sfxGain, 0.12);
    },
    tokenHome() {
      if (!sfxEnabled) return; init();
      [523, 659, 784, 1047].forEach((f, i) => playNote(f, 0.2, 'sine', sfxGain, 0.2, i * 0.12));
    },
    win() {
      if (!sfxEnabled) return; init();
      const notes = [523, 659, 784, 1047, 784, 1047, 1319];
      notes.forEach((f, i) => playNote(f, 0.25, 'sine', sfxGain, 0.25, i * 0.15));
    },
    click() {
      if (!sfxEnabled) return; init();
      playNote(800, 0.05, 'sine', sfxGain, 0.1);
    },
    startMusic() {
      if (!musicEnabled || bgPlaying) return;
      initBgMusic();
      bgPlaying = true;
      bgMusic.play().catch(() => {});
    },
    stopMusic() {
      bgPlaying = false;
      if (bgMusic) { bgMusic.pause(); bgMusic.currentTime = 0; }
    },
    toggleMusic(on) {
      musicEnabled = on;
      if (!on) { this.stopMusic(); }
      else { this.startMusic(); }
    },
    toggleSfx(on) { sfxEnabled = on; },
    get musicOn() { return musicEnabled; },
    get sfxOn() { return sfxEnabled; }
  };
})();
