// Short synthesized cues complement the original artwork without fetching
// audio assets. They only run inside the player's explicitly enabled context.
export function createCombatAudio(context) {
  const noise = context.createBuffer(
    1,
    Math.ceil(context.sampleRate * 0.22),
    context.sampleRate,
  );
  const samples = noise.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  let next = 0;
  return (event) => {
    if (context.state !== "running" || context.currentTime < next) return;
    if (!["swing", "hit", "heal", "special", "guard"].includes(event.type))
      return;
    const now = context.currentTime;
    next = now + 0.07;
    const magic = ["heal", "special", "guard"].includes(event.type);
    const gain = context.createGain();
    gain.gain.setValueAtTime(magic ? 0.045 : 0.065, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (magic ? 0.3 : 0.12));
    gain.connect(context.destination);
    if (magic) {
      const tone = context.createOscillator();
      tone.type = "sine";
      tone.frequency.setValueAtTime(event.type === "heal" ? 660 : 440, now);
      tone.frequency.exponentialRampToValueAtTime(880, now + 0.25);
      tone.connect(gain);
      tone.start(now);
      tone.stop(now + 0.32);
      tone.onended = () => {
        tone.disconnect();
        gain.disconnect();
      };
    } else {
      const source = context.createBufferSource(),
        filter = context.createBiquadFilter();
      source.buffer = noise;
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(event.type === "hit" ? 750 : 1600, now);
      filter.frequency.exponentialRampToValueAtTime(220, now + 0.12);
      filter.Q.value = event.type === "hit" ? 1.3 : 0.6;
      source.connect(filter).connect(gain);
      source.start(now);
      source.stop(now + 0.15);
      source.onended = () => {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
    }
  };
}
