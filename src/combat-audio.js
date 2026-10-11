// Original procedural foley: release and contact are separate cues. No audio
// is created until the player enables sound. A shared mix and voice ceiling
// keep a four-person fight from getting louder with every additional enemy.
export function createCombatAudio(context) {
  const master = context.createGain();
  master.gain.value = 0.7;
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -20;
  compressor.knee.value = 12;
  compressor.ratio.value = 5;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.15;
  master.connect(compressor).connect(context.destination);
  const noise = context.createBuffer(
    1,
    Math.ceil(context.sampleRate * 0.6),
    context.sampleRate,
  );
  const samples = noise.getChannelData(0);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
  const active = new Set(),
    gates = new Map(),
    actions = new Set();
  function layer(now, cue, pan, volume) {
    if (active.size >= 24) return;
    const [kind, frequency, endFrequency, duration, amplitude, delay = 0] = cue;
    const start = now + delay;
    const source =
      kind === "noise"
        ? context.createBufferSource()
        : context.createOscillator();
    const gain = context.createGain(),
      filter = context.createBiquadFilter(),
      panner = context.createStereoPanner();
    if (kind === "noise") source.buffer = noise;
    else {
      source.type = kind;
      source.frequency.setValueAtTime(frequency, start);
      source.frequency.exponentialRampToValueAtTime(
        endFrequency,
        start + duration,
      );
    }
    filter.type = kind === "noise" ? "bandpass" : "lowpass";
    filter.frequency.setValueAtTime(kind === "noise" ? frequency : 3000, start);
    if (kind === "noise")
      filter.frequency.exponentialRampToValueAtTime(
        endFrequency,
        start + duration,
      );
    filter.Q.value = kind === "noise" ? 0.7 : 0.4;
    panner.pan.value = pan;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(amplitude * volume, start + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter).connect(gain).connect(panner).connect(master);
    active.add(source);
    source.onended = () => {
      active.delete(source);
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
      panner.disconnect();
    };
    source.start(start);
    source.stop(start + duration + 0.01);
  }
  const play = (event) => {
    if (context.state !== "running" || event.volume === 0) return false;
    let cues;
    const ranged = ["Ilyra", "Eira", "Soren"].includes(event.id);
    if (
      (event.type === "swing" && !ranged) ||
      (event.type === "enemyAttack" && !event.ranged)
    ) {
      const weight =
        event.heavy ||
        event.cleave ||
        event.weapon === "mace" ||
        event.weapon === "axe";
      cues = [["noise", weight ? 950 : 2100, 350, weight ? 0.19 : 0.13, 0.12]];
    } else if (event.type === "projectile") {
      // A volley releases three projectiles but the bow is drawn just once.
      const key = `${event.id}:${event.actionId}`;
      if (event.actionId != null && actions.has(key)) return false;
      if (event.actionId != null) {
        actions.add(key);
        if (actions.size > 64) actions.delete(actions.values().next().value);
      }
      cues =
        event.id === "Ilyra"
          ? [
              ["noise", 3300, 1000, 0.1, 0.1],
              ["triangle", 180, 85, 0.09, 0.045],
            ]
          : event.hostile
            ? [
                ["noise", 800, 2200, 0.22, 0.085],
                ["sine", 130, 65, 0.2, 0.07],
              ]
            : [
                ["noise", 3600, 1800, 0.16, 0.04],
                [
                  "sine",
                  event.healing ? 520 : event.id === "Soren" ? 960 : 640,
                  320,
                  0.24,
                  0.045,
                ],
              ];
    } else if (event.type === "hit") {
      const magical = ["Soren", "Eira"].includes(event.source);
      cues = magical
        ? [
            ["noise", 2600, 800, 0.13, 0.085],
            ["sine", event.source === "Soren" ? 1100 : 700, 350, 0.18, 0.025],
          ]
        : [
            [
              "noise",
              event.heavy ? 500 : 1100,
              180,
              0.13,
              event.heavy ? 0.18 : 0.13,
            ],
            [
              "sine",
              event.heavy ? 105 : 155,
              48,
              event.heavy ? 0.23 : 0.12,
              event.heavy ? 0.19 : 0.1,
            ],
            ["triangle", 1900, 740, 0.065, 0.022],
          ];
    } else if (event.type === "heal") {
      cues = [
        ["sine", 523, 659, 0.35, 0.035],
        ["sine", 784, 1046, 0.4, 0.023, 0.06],
      ];
    } else if (event.type === "guard") {
      cues = [
        ["noise", 1300, 400, 0.15, 0.075],
        ["triangle", 240, 120, 0.22, 0.05],
      ];
    } else if (event.type === "kill") {
      cues = [
        ["noise", event.boss ? 450 : 650, 120, event.boss ? 0.5 : 0.25, 0.085],
        ["sine", event.boss ? 95 : 125, 40, event.boss ? 0.5 : 0.22, 0.085],
      ];
    } else return false;
    const now = context.currentTime;
    const key = event.type;
    if (now < (gates.get(key) ?? -1)) return false;
    gates.set(
      key,
      now +
        (event.type === "hit" ? 0.025 : event.type === "kill" ? 0.06 : 0.035),
    );
    const volume = Math.max(0, Math.min(1, event.volume ?? 1));
    const pan = Math.max(-0.65, Math.min(0.65, event.pan ?? 0));
    if (active.size + cues.length > 24) return false;
    for (const cue of cues) layer(now, cue, pan, volume);
    return true;
  };
  // Muting clears transient voices so resuming never replays a frozen impact.
  play.clear = () => {
    for (const source of active) source.stop();
    active.clear();
    gates.clear();
    actions.clear();
  };
  return play;
}
