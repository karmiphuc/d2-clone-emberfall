import * as T from "three";
import { scenery, scatterGrass } from "./scenery.js";
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
    new T.PlaneGeometry(80, 80),
    groundMaterial.clone(),
  );
  ground.material.color.set("#939b77");
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
  for (let i = 0; i < 70; i++) {
    let x = (random() - 0.5) * 58,
      z = (random() - 0.5) * 48;
    if (Math.abs(x) < 20 && Math.abs(z) < 16) continue;
    if (x + z > 22) continue;
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
  const portal = new T.Mesh(
    new T.TorusGeometry(1.15, 0.07, 6, 32),
    new T.MeshBasicMaterial({ color: "#b5dada" }),
  );
  portal.position.set(-15, 1.3, 10);
  root.add(portal);
  const base = add(
    new T.CylinderGeometry(1.7, 1.9, 0.12, 12),
    "#667d72",
    -15,
    0.04,
    10,
  );
  scatterGrass(root, 230, random);
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
  for (let i = 0; i < 85; i++) {
    const x = (random() - 0.5) * 37,
      z = (random() - 0.5) * 28;
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
