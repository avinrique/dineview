// Short two-tone alert for new orders / waiter calls, synthesized with Web
// Audio so there's no sound file to ship. Browsers only allow audio after the
// user has interacted with the page, so the first alert may be silent.
let ctx: AudioContext | null = null;

export function playChime() {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    [880, 1318.5].forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.16;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch {
    // Audio unavailable
  }
}
