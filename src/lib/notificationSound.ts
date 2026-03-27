type AudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

export function playNotificationSound() {
  try {
    const AudioContextConstructor =
      window.AudioContext || (window as AudioWindow).webkitAudioContext;

    if (!AudioContextConstructor) return;

    const ctx = new AudioContextConstructor();
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
  } catch {
    // silencioso se AudioContext não disponível
  }
}
