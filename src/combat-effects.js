import * as T from "three";

const CELLS = {
  slash: 0,
  impact: 1,
  frost: 2,
  heal: 3,
  ward: 4,
  fire: 5,
  shadow: 6,
  holy: 7,
};
// Original painted effects share one atlas. A bounded pool prevents volleys and
// repeat hunts from allocating an unbounded number of materials or draw calls.
export function createCombatEffects(scene) {
  const maps = [];
  const up = new T.Vector3(0, 1, 0);
  const atlas = new T.TextureLoader().load(
    new URL("../public/art/combat-effects.webp", import.meta.url).href,
    () => maps.forEach((map) => (map.needsUpdate = true)),
  );
  atlas.colorSpace = T.SRGBColorSpace;
  atlas.minFilter = T.LinearFilter;
  atlas.generateMipmaps = false;
  for (let i = 0; i < 8; i++) {
    const map = atlas.clone();
    map.repeat.set(0.25, 0.5);
    map.offset.set((i % 4) / 4, i < 4 ? 0.5 : 0);
    maps.push(map);
  }
  const root = new T.Group();
  root.name = "combat-effects";
  scene.add(root);
  const pool = [];
  function spawn(kind, position, options = {}) {
    let effect = pool.find((e) => !e.node.visible);
    if (!effect) {
      if (pool.length >= 64) return null;
      const material = new T.SpriteMaterial({
        transparent: true,
        depthWrite: false,
        toneMapped: false,
        blending: T.AdditiveBlending,
      });
      const node = new T.Sprite(material);
      node.renderOrder = 3;
      root.add(node);
      effect = { node };
      pool.push(effect);
    }
    const { node } = effect;
    Object.assign(effect, {
      kind,
      age: 0,
      duration: options.duration ?? 0.45,
      size: options.size ?? 2,
      rise: options.rise ?? 0.3,
      opacity: options.opacity ?? 0.8,
      follow: options.follow,
      from: position.clone(),
      to: options.to?.clone(),
      rotation: options.rotation ?? 0,
    });
    node.material.map = maps[CELLS[kind] ?? 1];
    node.material.color.set(options.color ?? 0xffffff);
    node.material.rotation = effect.rotation;
    node.material.opacity = effect.opacity;
    node.position.copy(position);
    node.scale.setScalar(effect.size * 0.65);
    node.visible = true;
    node.userData.kind = kind;
    return effect;
  }
  return {
    root,
    spawn,
    get activeCount() {
      return pool.filter((e) => e.node.visible).length;
    },
    get allocatedCount() {
      return pool.length;
    },
    clear() {
      pool.forEach((e) => (e.node.visible = false));
    },
    update(dt, reduced = false) {
      for (const e of pool) {
        if (!e.node.visible) continue;
        e.age += dt;
        const t = e.age / e.duration;
        if (t >= 1) {
          e.node.visible = false;
          continue;
        }
        if (e.follow)
          e.node.position.copy(e.follow.position).addScaledVector(up, 0.5);
        else if (e.to) e.node.position.lerpVectors(e.from, e.to, t);
        else e.node.position.copy(e.from).addScaledVector(up, e.rise * t);
        const scale = e.to
          ? e.size
          : e.size * (0.65 + Math.min(1, t * 5) * 0.35 + t * 0.15);
        e.node.scale.setScalar(scale);
        e.node.material.opacity =
          e.opacity * Math.min(1, (1 - t) * 3) * (reduced ? 0.45 : 1);
      }
    },
  };
}
