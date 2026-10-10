import { MOOR_REGIONS } from "./game/moor.js";
import * as T from "three";
import { scenery, scatterGrass, scatterShrubs } from "./scenery.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export function createWilderness(groundMaterial, oakTexture) {
  const root = new T.Group();
  root.visible = false;
  const materials = new Map();
  const material = (color) => {
    if (!materials.has(color))
      materials.set(
        color,
        new T.MeshStandardMaterial({ color, roughness: 0.96 }),
      );
    return materials.get(color);
  };
  function add(geometry, color, x, y, z) {
    const m = new T.Mesh(geometry, material(color));
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
    return m;
  }
  let seed = 933;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const ground = new T.Mesh(
    new T.PlaneGeometry(116, 100),
    groundMaterial.clone(),
  );
  const moorTexture = new T.TextureLoader().load(
    new URL("../public/art/earth.webp", import.meta.url).href,
  );
  moorTexture.colorSpace = T.SRGBColorSpace;
  moorTexture.wrapS = moorTexture.wrapT = T.RepeatWrapping;
  moorTexture.repeat.set(17, 15);
  moorTexture.anisotropy = 8;
  ground.material.map = moorTexture;
  ground.material.color.set("#e4e7df");
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.03;
  ground.receiveShadow = true;
  root.add(ground);
  // A ruined road, roadside graves, broken arches and an abandoned fire circle.
  for (let i = 0; i < 18; i++) {
    const x = -13 + i * 1.5,
      z = 7 - Math.sin(i * 0.22) * 8;
    scenery(root, "details", 1, x, z, 2.8, 1.8, 0.5);
  }
  const obstacles = [];
  for (const [x, z, w, d] of [
    [-14, -7, 2, 4],
    [-10, -11, 3, 2],
    [15, 3, 2, 3],
    [8, 10, 3, 2],
    [0, 11, 3, 2],
  ]) {
    scenery(
      root,
      "moor",
      0,
      x,
      z,
      Math.max(w, d) * 1.4,
      Math.max(w, d) * 1.1,
      0.25,
    );
    obstacles.push({ x, z, w, d });
  }
  for (let i = 0; i < 150; i++) {
    let x = (random() - 0.5) * 104,
      z = (random() - 0.5) * 88;
    if (Math.abs(x) < 20 && Math.abs(z) < 16) continue;
    if (MOOR_REGIONS.some((r) => Math.hypot(x - r.x, z - r.z) < 7)) continue;
    const h = 3 + random() * 4;
    if (i % 3 !== 0) scenery(root, "moor", 3, x, z, h * 1.1, h * 1.2);
    if (i % 3 === 0 && oakTexture) {
      const tree = new T.Sprite(
        new T.SpriteMaterial({
          map: oakTexture,
          color: "#7b8465",
          alphaTest: 0.15,
          depthWrite: true,
        }),
      );
      tree.userData.occluder = true;
      tree.center.set(0.58, 0.04);
      tree.position.set(x, 0, z);
      tree.scale.set(6, 6.3, 1);
      root.add(tree);
    }
  }
  for (const [x, z] of [
    [-12, -7],
    [-11, -9],
    [-8, -10],
    [14, -10],
    [14, -8],
    [12, -12],
  ]) {
    scenery(root, "moor", 1, x, z, 1.6, 1.7);
  }
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2;
    add(
      new T.DodecahedronGeometry(0.3),
      "#6f7568",
      10 + Math.cos(a) * 2.2,
      0.2,
      -10 + Math.sin(a) * 2.2,
    );
  }
  for (const x of [-3, 2]) {
    add(new T.BoxGeometry(0.9, 2.6, 1), "#777b6d", x, 1.3, -12);
    for (let k = 0; k < 3; k++)
      add(new T.BoxGeometry(1.1, 0.14, 1.1), "#8b8b77", x, 0.4 + k * 0.8, -12);
  }
  const arch = add(new T.BoxGeometry(5.8, 0.6, 1.2), "#777b6d", -0.5, 2.8, -12);
  arch.rotation.z = 0.06;
  const portalMap = new T.TextureLoader().load(
    new URL("../public/art/combat-effects.webp", import.meta.url).href,
  );
  portalMap.colorSpace = T.SRGBColorSpace;
  portalMap.repeat.set(0.25, 0.5);
  portalMap.offset.set(0, 0);
  const portal = new T.Sprite(
    new T.SpriteMaterial({
      map: portalMap,
      color: "#72d9ff",
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      blending: T.AdditiveBlending,
      opacity: 0.7,
    }),
  );
  portal.position.set(-15, 1.5, 10);
  portal.scale.set(2.7, 3.5, 1);
  root.add(portal);
  const base = scenery(root, "services", 0, -15, 10, 3.4, 2.8, 0.3);
  scatterGrass(root, 1500, random, false, { width: 106, depth: 90 });
  const shrubs = Array.from({ length: 350 }, () => ({
    x: (random() - 0.5) * 100,
    z: (random() - 0.5) * 82,
    size: 0.65 + random() * 1.1,
  }));
  scatterShrubs(
    root,
    shrubs.filter(
      (p) => !MOOR_REGIONS.some((r) => Math.hypot(p.x - r.x, p.z - r.z) < 4),
    ),
  );
  // Branching worn roads connect recognisable destinations, with open fighting clearings.
  const roadTexture = moorTexture.clone();
  roadTexture.repeat.set(1, 6);
  const mask = document.createElement("canvas");
  mask.width = mask.height = 64;
  const context = mask.getContext("2d"),
    pixels = context.createImageData(64, 64);
  for (let y = 0; y < 64; y++)
    for (let x = 0; x < 64; x++) {
      const edge = Math.max(0, 1 - Math.abs(x - 31.5) / 31.5);
      const value = Math.round(
          Math.min(1, edge * 2) * (0.7 + random() * 0.3) * 255,
        ),
        k = (y * 64 + x) * 4;
      pixels.data[k] = pixels.data[k + 1] = pixels.data[k + 2] = value;
      pixels.data[k + 3] = 255;
    }
  context.putImageData(pixels, 0, 0);
  const roadMask = new T.CanvasTexture(mask);
  roadMask.wrapT = T.RepeatWrapping;
  roadMask.repeat.y = 6;
  const roadMaterial = new T.MeshBasicMaterial({
    map: roadTexture,
    alphaMap: roadMask,
    color: "#a3987b",
    transparent: true,
    opacity: 0.48,
    depthWrite: false,
  });
  const roadParts = [];
  const edges = MOOR_REGIONS.map((r, i) => [
    r,
    MOOR_REGIONS[(i + 1) % MOOR_REGIONS.length],
  ]);
  edges.push(
    [{ x: -15, z: 10 }, MOOR_REGIONS[0]],
    [{ x: -15, z: 10 }, MOOR_REGIONS[9]],
    [{ x: 15, z: -10 }, MOOR_REGIONS[6]],
    [{ x: 15, z: -10 }, MOOR_REGIONS[4]],
  );
  for (const [a, b] of edges) {
    const length = Math.hypot(b.x - a.x, b.z - a.z);
    const strip = new T.Mesh(new T.PlaneGeometry(2.6, length), roadMaterial);
    strip.rotation.set(-Math.PI / 2, 0, Math.atan2(b.x - a.x, b.z - a.z));
    strip.position.set((a.x + b.x) / 2, 0.005, (a.z + b.z) / 2);
    strip.updateMatrix();
    roadParts.push(strip.geometry.clone().applyMatrix4(strip.matrix));
    strip.geometry.dispose();
  }
  const roads = new T.Mesh(mergeGeometries(roadParts), roadMaterial);
  root.add(roads);
  roadParts.forEach((g) => g.dispose());
  for (const r of MOOR_REGIONS) {
    if (r.kind === "graves") {
      for (let i = 0; i < 8; i++)
        scenery(
          root,
          "moor",
          1,
          r.x - 4 + (i % 4) * 2.6,
          r.z - 5 + Math.floor(i / 4) * 9,
          1.5,
          1.7,
        );
    } else if (r.kind === "camp") {
      scenery(root, "moor", 2, r.x - 5, r.z, 3.8, 3.1, 0.2);
      scenery(
        root,
        "tents",
        r.id === "northcamp" ? 1 : 2,
        r.x + 5,
        r.z - 3,
        5,
        4,
      );
      obstacles.push({ x: r.x + 5, z: r.z - 3, w: 2.4, d: 1.8 });
      for (let i = 0; i < 9; i++) {
        const a = (i * Math.PI * 2) / 9;
        add(
          new T.DodecahedronGeometry(0.32),
          "#766751",
          r.x + Math.cos(a) * 1.2,
          0.18,
          r.z + Math.sin(a) * 1.2,
        );
      }
      add(new T.ConeGeometry(0.65, 0.45, 7), "#4b3528", r.x, 0.2, r.z);
      scenery(root, "details", 0, r.x, r.z + 0.3, 2, 1.5);
    } else if (r.kind === "ruins") {
      for (const offset of [-5, 5]) {
        scenery(root, "moor", 0, r.x + offset, r.z - 3, 4, 3.5, 0.25);
        obstacles.push({ x: r.x + offset, z: r.z - 3, w: 1.8, d: 2 });
      }
      for (let i = 0; i < 6; i++) {
        const wall = add(
          new T.BoxGeometry(1.4, 0.7, 0.65),
          "#777b6d",
          r.x - 4 + i * 1.6,
          0.35,
          r.z - 6,
        );
        wall.rotation.y = (random() - 0.5) * 0.3;
      }
    } else if (r.kind === "wagon") {
      scenery(root, "moor", 2, r.x - 4, r.z - 3, 4.8, 4, 0.2);
      scenery(root, "moor", 2, r.x + 4, r.z + 3, 3.8, 3.2, 0.2);
      scenery(root, "details", 1, r.x, r.z, 3.5, 2.2, 0.5);
    } else {
      for (const offset of [-6, 6])
        scenery(root, "moor", 3, r.x + offset, r.z - 4, 5.5, 5.8);
    }
  }
  // Dense outer treelines frame the enlarged playable rectangle.
  for (let i = 0; i < 90; i++) {
    const side = i % 4;
    const x =
      side < 2
        ? (side ? 45 : -45) + (random() - 0.5) * 4
        : (random() - 0.5) * 90;
    const z =
      side >= 2
        ? (side === 2 ? -37 : 37) + (random() - 0.5) * 4
        : (random() - 0.5) * 74;
    scenery(root, "moor", 3, x, z, 5 + random() * 2, 5 + random() * 2);
  }
  // Low dry-stone field boundaries frame the route without blocking the combat path.
  for (let i = 0; i < 35; i++) {
    const x = -18 + i * 0.92;
    for (let layer = 0; layer < 2; layer++) {
      const b = add(
        new T.DodecahedronGeometry(0.42, 0),
        i % 2 ? "#6b6b55" : "#79745d",
        x + (layer ? 0.25 : 0),
        0.18 + layer * 0.32,
        -14,
      );
      b.scale.set(1.15, 0.55, 0.7);
      b.rotation.y = random();
    }
  }
  // Broken timber and ironwork replace the placeholder wagon.
  scenery(root, "moor", 2, -17, 7, 4, 3.4, 0.2);
  // Scattered ground clutter gives the Moor its desolate, inhabited history.
  for (let i = 0; i < 650; i++) {
    const x = (random() - 0.5) * 86,
      z = (random() - 0.5) * 70;
    const r = add(
      new T.DodecahedronGeometry(0.07 + random() * 0.12, 0),
      "#85806a",
      x,
      0.025,
      z,
    );
    r.scale.y = 0.35;
  }
  root.updateMatrixWorld(true);
  for (const m of materials.values()) {
    const items = root.children.filter(
      (o) => o.isMesh && !o.isInstancedMesh && o.material === m,
    );
    if (!items.length) continue;
    const geometries = items.map((o) => {
      const g = o.geometry.clone().applyMatrix4(o.matrixWorld);
      return g.index ? g.toNonIndexed() : g;
    });
    const merged = mergeGeometries(geometries);
    const result = new T.Mesh(merged, m);
    result.castShadow = true;
    result.receiveShadow = true;
    root.add(result);
    items.forEach((o) => o.removeFromParent());
    geometries.forEach((g) => g.dispose());
  }
  return { root, obstacles, portal, base };
}
