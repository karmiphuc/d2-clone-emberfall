import * as T from "three";

const urls = {
  services: new URL("../public/art/camp-services.webp", import.meta.url).href,
  details: new URL("../public/art/ground-details.webp", import.meta.url).href,
  tents: new URL("../public/art/camp-tents.webp", import.meta.url).href,
  moor: new URL("../public/art/moor-props.webp", import.meta.url).href,
};
const atlases = new Map();
function cellTexture(sheet, cell) {
  let entry = atlases.get(sheet);
  if (!entry) {
    entry = { maps: [], ready: false };
    entry.texture = new T.TextureLoader().load(urls[sheet], () => {
      entry.ready = true;
      entry.maps.forEach((map) => (map.needsUpdate = true));
      entry.maps.length = 0;
    });
    entry.texture.colorSpace = T.SRGBColorSpace;
    entry.texture.minFilter = T.LinearFilter;
    entry.texture.generateMipmaps = false;
    atlases.set(sheet, entry);
  }
  const map = entry.texture.clone();
  map.repeat.set(0.5, 0.5);
  map.offset.set((cell % 2) * 0.5, 0.5 - Math.floor(cell / 2) * 0.5);
  if (entry.ready) map.needsUpdate = true;
  else entry.maps.push(map);
  return map;
}
export function scenery(
  parent,
  sheet,
  cell,
  x,
  z,
  width,
  height,
  anchor = 0.1,
) {
  const map = cellTexture(sheet, cell);
  const sprite = new T.Sprite(
    new T.SpriteMaterial({
      map,
      color: sheet === "moor" ? "#acb7b8" : "#bcc1c0",
      alphaTest: 0.25,
      depthWrite: true,
      toneMapped: false,
    }),
  );
  // The baseline must stay above the ground plane. Move the footprint's
  // front edge along the ground instead of sinking the billboard into it.
  const front = (Math.max(0, anchor - 0.1) * height) / 0.572;
  sprite.position.set(x + front * 0.581, 0.015, z + front * 0.814);
  sprite.center.set(0.5, 0.1);
  sprite.scale.set(width, height, 1);
  sprite.userData.scenery = sheet;
  sprite.userData.occluder = height > 3;
  parent.add(sprite);
  return sprite;
}

// Fade only foreground props overlapping the hero, preserving readable combat
// while leaving their collision footprints and pathfinding intact.
const focus = new T.Vector3(),
  position = new T.Vector3(),
  cameraSpace = new T.Vector3();
export function updateSceneryVisibility(props, hero, camera, dt) {
  focus
    .copy(hero.position)
    .addScaledVector(T.Object3D.DEFAULT_UP, 1)
    .project(camera);
  const heroDepth = cameraSpace
    .copy(hero.position)
    .applyMatrix4(camera.matrixWorldInverse).z;
  const viewW = camera.right - camera.left,
    viewH = camera.top - camera.bottom;
  for (const sprite of props) {
    if (!sprite.userData.occluder) continue;
    sprite.getWorldPosition(position);
    const depth = cameraSpace
      .copy(position)
      .applyMatrix4(camera.matrixWorldInverse).z;
    position.project(camera);
    const w = sprite.scale.x / viewW,
      h = sprite.scale.y / viewH;
    const overlaps =
      depth > heroDepth &&
      Math.abs(focus.x - position.x) < w * 0.8 &&
      focus.y > position.y - h * sprite.center.y * 2 &&
      focus.y < position.y + h * (1 - sprite.center.y) * 2;
    sprite.material.opacity = T.MathUtils.lerp(
      sprite.material.opacity,
      overlaps ? 0.3 : 1,
      Math.min(1, dt * 9),
    );
    sprite.material.depthWrite = sprite.material.opacity > 0.95;
  }
}

// The camera keeps a fixed isometric angle, so these textured grass billboards
// can be instanced in one draw call instead of hundreds of individual sprites.
export function scatterGrass(parent, count, random, camp = false) {
  const geometry = new T.PlaneGeometry(1.5, 0.9);
  geometry.translate(0, 0.36, 0);
  const material = new T.MeshBasicMaterial({
    map: cellTexture("details", 2),
    color: camp ? "#899278" : "#6f9389",
    transparent: true,
    alphaTest: 0.3,
    depthWrite: true,
    toneMapped: false,
  });
  const grass = new T.InstancedMesh(geometry, material, count);
  const dummy = new T.Object3D();
  dummy.quaternion.setFromRotationMatrix(
    new T.Matrix4().lookAt(
      new T.Vector3(30, 36, 42),
      new T.Vector3(),
      T.Object3D.DEFAULT_UP,
    ),
  );
  for (let i = 0; i < count; i++) {
    let x = (random() - 0.5) * 45,
      z = (random() - 0.5) * 34;
    if (
      camp &&
      ((Math.abs(x) < 15 && Math.abs(z) < 10 && random() < 0.9) ||
        Math.hypot(x, z) < 7)
    )
      x += Math.sign(x || 1) * 14;
    dummy.position.set(x, 0.02, z);
    dummy.scale.setScalar(0.6 + random() * 0.7);
    dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix);
  }
  parent.add(grass);
  return grass;
}
