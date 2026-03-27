type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

let _ctx: AudioContext | null = null;

/** Call once on any user interaction to unlock audio on mobile */
export function prewarmAudio() {
  try {
    if (_ctx) return;
    const Ctor = window.AudioContext || (window as AudioWindow).webkitAudioContext;
    if (!Ctor) return;
    _ctx = new Ctor();
    // iOS requires a silent buffer to unlock the context
    if (_ctx.state === "suspended") {
      const buf = _ctx.createBuffer(1, 1, 22050);
      const src = _ctx.createBufferSource();
      src.buffer = buf;
      src.connect(_ctx.destination);
      src.start(0);
      _ctx.resume().catch(() => {});
    }
  } catch {
    // ignore
  }
}

export function playNotificationSound() {
  try {
    const Ctor = window.AudioContext || (window as AudioWindow).webkitAudioContext;
    if (!Ctor) return;
    const ctx = _ctx ?? new Ctor();
    if (!_ctx) _ctx = ctx;

    const resume = ctx.state === "suspended" ? ctx.resume() : Promise.resolve();
    resume.then(() => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }).catch(() => {});
  } catch {
    // silencioso se AudioContext não disponível
  }
}
