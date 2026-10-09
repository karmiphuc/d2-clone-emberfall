import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export function createWilderness(groundMaterial) {
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
  ground.material.color.set("#adb4a4");
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.03;
  ground.receiveShadow = true;
  root.add(ground);
  // A ruined road, roadside graves, broken arches and an abandoned fire circle.
  for (let i = 0; i < 95; i++) {
    let x = -13 + i * 0.28,
      z = 7 - Math.sin(i * 0.04) * 8;
    const o = add(
      new T.BoxGeometry(0.55, 0.06, 0.45),
      "#77796a",
      x + (random() - 0.5) * 1.5,
      0.01,
      z + (random() - 0.5) * 2,
    );
    o.rotation.y = random() * 2;
  }
  const obstacles = [];
  for (const [x, z, w, d] of [
    [-14, -7, 2, 4],
    [-10, -11, 3, 2],
    [15, 3, 2, 3],
    [8, 10, 3, 2],
    [0, 11, 3, 2],
  ]) {
    const o = add(new T.DodecahedronGeometry(1, 0), "#676e68", x, 0.7, z);
    o.scale.set(w / 2, 1.5, d / 2);
    obstacles.push({ x, z, w, d });
  }
  for (let i = 0; i < 70; i++) {
    let x = (random() - 0.5) * 58,
      z = (random() - 0.5) * 48;
    if (Math.abs(x) < 20 && Math.abs(z) < 16) continue;
    const h = 3 + random() * 4;
    add(new T.CylinderGeometry(0.12, 0.4, h, 6), "#464b44", x, h / 2, z);
    for (let j = 0; j < 3; j++) {
      const branch = add(
        new T.CylinderGeometry(0.04, 0.12, 1.8, 5),
        "#464b44",
        x + (j % 2 ? -0.5 : 0.5),
        h * 0.6 + j * 0.5,
        z,
      );
      branch.rotation.z = j % 2 ? 0.7 : -0.7;
    }
    if (i % 3 === 0)
      for (let k = 0; k < 3; k++) {
        const tree = add(
          new T.ConeGeometry(2 - k * 0.4, 2.8, 6),
          "#344a3d",
          x,
          2.8 + k * 1.3,
          z,
        );
        tree.rotation.y = random();
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
    const grave = add(new T.BoxGeometry(0.55, 1.1, 0.2), "#777e73", x, 0.5, z);
    grave.rotation.z = (random() - 0.5) * 0.3;
    add(new T.BoxGeometry(0.95, 0.17, 0.22), "#777e73", x, 0.72, z);
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
  const grass = new T.InstancedMesh(
    new T.ConeGeometry(0.09, 0.35, 3),
    material("#6a7255"),
    1000,
  );
  const dummy = new T.Object3D();
  for (let i = 0; i < 1000; i++) {
    dummy.position.set((random() - 0.5) * 43, 0.1, (random() - 0.5) * 34);
    dummy.rotation.y = random() * 6;
    dummy.scale.setScalar(0.5 + random());
    dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix);
  }
  root.add(grass);
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
