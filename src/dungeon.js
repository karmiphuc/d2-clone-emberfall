import * as T from "three";
import { DEN_ROOMS, denWalkable } from "./game/den.js";
import { scenery } from "./scenery.js";

export function createDungeon() {
  const root = new T.Group();
  root.visible = false;
  const map = new T.TextureLoader().load(
    new URL("../public/art/camp-soil.webp", import.meta.url).href,
  );
  map.colorSpace = T.SRGBColorSpace;
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.repeat.set(8, 6);
  const floor = new T.Mesh(
    new T.PlaneGeometry(38, 30),
    new T.MeshStandardMaterial({ map, color: "#c3c6bf", roughness: 1 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.04;
  root.add(floor);
  // Solid rock outside the connected footprint. The low foreground rim keeps
  // actors readable while the painted northern walls give the cave depth.
  const rock = new T.MeshStandardMaterial({ color: "#171c1d", roughness: 1 });
  const geometry = new T.BoxGeometry(1, 0.42, 1);
  const outside = [];
  for (let x = -19.5; x < 20; x++)
    for (let z = -15.5; z < 16; z++)
      if (!denWalkable(x, z)) outside.push([x, z]);
  const walls = new T.InstancedMesh(geometry, rock, outside.length);
  const dummy = new T.Object3D();
  outside.forEach(([x, z], i) => {
    dummy.position.set(x, 0.12, z);
    dummy.updateMatrix();
    walls.setMatrixAt(i, dummy.matrix);
  });
  root.add(walls);
  for (let x = -18; x <= 17; x += 3)
    for (let z = -14; z <= 14; z += 3) {
      if (
        denWalkable(x, z) ||
        ![
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ].some(([dx, dz]) => denWalkable(x + dx * 2.5, z + dz * 2.5))
      )
        continue;
      const cliff = scenery(root, "cave", 0, x, z, 4.4, 3.7, 0.12);
      cliff.material.color.set("#a6adb0");
      cliff.userData.occluder = true;
    }
  for (const [x, z] of [
    [-15, 5],
    [-9, 11],
    [3, 9],
    [11, 2],
    [1, -11],
    [11, -11],
  ]) {
    scenery(root, "cave", 3, x, z, 1.8, 2.2, 0.1);
  }
  const flames = [];
  const flameMap = new T.TextureLoader().load(
    new URL("../public/art/flame.webp", import.meta.url).href,
  );
  flameMap.colorSpace = T.SRGBColorSpace;
  for (const [x, z] of [
    [-15, 8],
    [-3, 6],
    [4, 2],
    [8, -7],
  ]) {
    const pedestal = new T.Mesh(
      new T.CylinderGeometry(0.25, 0.38, 0.8, 8),
      new T.MeshStandardMaterial({ color: "#494437", roughness: 1 }),
    );
    pedestal.position.set(x, 0.4, z);
    root.add(pedestal);
    const flame = new T.Sprite(
      new T.SpriteMaterial({
        map: flameMap,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    flame.position.set(x, 1.15, z);
    flame.scale.set(0.9, 1.25, 1);
    root.add(flame);
    flames.push(flame);
    const light = new T.PointLight("#df9852", 14, 9, 2);
    light.position.set(x, 2, z);
    root.add(light);
  }
  scenery(root, "cave", 1, -15, 11, 4.5, 4.3, 0.1);
  scenery(root, "cave", 2, 3, -12, 3.2, 3, 0.1);
  return {
    root,
    rooms: DEN_ROOMS,
    update(time) {
      flames.forEach(
        (f, i) => (f.scale.y = 1.2 + Math.sin(time * 7 + i) * 0.08),
      );
    },
  };
}
