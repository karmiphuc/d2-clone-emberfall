import * as T from "three";
import { createWilderness } from "./wilderness.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export function createWorld(canvas) {
  const scene = new T.Scene();
  scene.background = new T.Color("#283b3e");
  scene.fog = new T.FogExp2("#293c3e", 0.013);
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  let zoom = 27;
  const camera = new T.OrthographicCamera();
  camera.position.set(30, 36, 42);
  camera.lookAt(0, 0, 0);
  function resize() {
    const a = innerWidth / innerHeight;
    const viewHeight = Math.max(zoom, 34 / a);
    camera.left = (-viewHeight * a) / 2;
    camera.right = (viewHeight * a) / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
    camera.near = 0.1;
    camera.far = 180;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }
  resize();
  window.addEventListener("resize", resize);
  canvas.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      zoom = T.MathUtils.clamp(zoom + e.deltaY * 0.015, 19, 43);
      resize();
    },
    { passive: false },
  );
  scene.add(new T.HemisphereLight("#b6ced0", "#49493a", 2.1));
  const sun = new T.DirectionalLight("#edc792", 2.6);
  sun.position.set(-16, 28, -15);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -30,
    right: 30,
    top: 30,
    bottom: -30,
    near: 1,
    far: 85,
  });
  sun.shadow.bias = -0.001;
  sun.shadow.normalBias = 0.06;
  scene.add(sun);
  const materialCache = new Map();
  const mat = (color, more = {}) => {
    const key = color + JSON.stringify(more);
    if (!materialCache.has(key))
      materialCache.set(
        key,
        new T.MeshStandardMaterial({ color, roughness: 0.93, ...more }),
      );
    return materialCache.get(key);
  };
  const wood = mat("#544635"),
    darkwood = mat("#342f27"),
    bark = mat("#4c4940"),
    stone = mat("#69706a"),
    metal = mat("#55646a", { metalness: 0.65, roughness: 0.5 }),
    rope = mat("#9a8663"),
    gold = mat("#a38b58", { metalness: 0.4 }),
    black = mat("#1a2425");
  function mesh(geo, m, x = 0, y = 0, z = 0, parent = scene) {
    const o = new T.Mesh(geo, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  function box(w, h, d, m, x, y, z, p = scene) {
    return mesh(new T.BoxGeometry(w, h, d), m, x, y, z, p);
  }
  function cyl(r1, r2, h, m, x, y, z, p = scene, n = 8) {
    return mesh(new T.CylinderGeometry(r1, r2, h, n), m, x, y, z, p);
  }
  function beam(a, b, r, m, p = scene) {
    const d = new T.Vector3().subVectors(b, a),
      o = cyl(r, r, d.length(), m, 0, 0, 0, p, 6);
    o.position.copy(a).add(b).multiplyScalar(0.5);
    o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
    return o;
  }
  const v = (x, y, z) => new T.Vector3(x, y, z);
  let seed = 74;
  function rand() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  // Procedural material: soil grain, worn paths and sparse moss on a shared ground map.
  const tex = document.createElement("canvas");
  tex.width = tex.height = 1024;
  const c = tex.getContext("2d");
  c.fillStyle = "#535746";
  c.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 95000; i++) {
    const n = rand();
    c.fillStyle = n < 0.3 ? "#383f3444" : n < 0.65 ? "#8e876444" : "#63715755";
    c.fillRect(rand() * 1024, rand() * 1024, rand() * 3 + 1, rand() * 3 + 1);
  }
  function path(points, width) {
    c.strokeStyle = "#8b806355";
    c.lineWidth = width;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.beginPath();
    points.forEach(([x, z], i) =>
      i
        ? c.lineTo(512 + x * 12.8, 512 + z * 12.8)
        : c.moveTo(512 + x * 12.8, 512 + z * 12.8),
    );
    c.stroke();
  }
  path(
    [
      [0, 15],
      [0, 4],
      [-4, -4],
      [-8, -8],
    ],
    62,
  );
  path(
    [
      [-15, 0],
      [1, 3],
      [20, 0],
    ],
    60,
  );
  path(
    [
      [0, 4],
      [9, 8],
    ],
    40,
  );
  path(
    [
      [0, 3],
      [8, -9],
    ],
    45,
  );
  const texture = new T.CanvasTexture(tex);
  texture.colorSpace = T.SRGBColorSpace;
  texture.anisotropy = 8;
  const ground = mesh(
    new T.PlaneGeometry(80, 80),
    mat("#ffffff", { map: texture }),
    0,
    -0.025,
    0,
  );
  ground.rotation.x = -Math.PI / 2;
  ground.castShadow = false;
  const obstacles = [];
  function obstacle(x, z, w, d) {
    obstacles.push({ x, z, w, d });
  }
  function rock(x, z, s = 1) {
    const o = mesh(new T.DodecahedronGeometry(s, 0), stone, x, s * 0.3, z);
    o.scale.set(1, 0.6, 0.8);
    o.rotation.set(rand(), rand() * 6, rand());
    return o;
  }
  // A broken palisade follows the edge of the camp, leaving the eastern road open.
  for (let x = -19; x <= 19; x += 0.7) {
    for (const z of [-15, 15]) {
      if (z === 15 && x > 6 && x < 11) continue;
      const h = 2 + rand() * 0.55;
      cyl(0.2, 0.28, h, wood, x, h / 2, z);
      mesh(new T.ConeGeometry(0.2, 0.5, 5), wood, x, h + 0.2, z);
    }
  }
  for (let z = -14.5; z <= 14.5; z += 0.7) {
    for (const x of [-19, 19]) {
      if (x === 19 && Math.abs(z) < 3) continue;
      const h = 2 + rand() * 0.55;
      cyl(0.2, 0.27, h, wood, x, h / 2, z);
      mesh(new T.ConeGeometry(0.2, 0.45, 5), wood, x, h + 0.15, z);
    }
  }
  obstacle(0, -15, 39, 1);
  obstacle(-19, 0, 1, 31);
  obstacle(0, 15, 39, 1);
  obstacle(19, -9, 1, 12);
  obstacle(19, 9, 1, 12);
  for (let i = 0; i < 75; i++) {
    const x = (rand() - 0.5) * 66,
      z = (rand() - 0.5) * 57;
    if (Math.abs(x) < 21 && Math.abs(z) < 17) continue;
    tree(x, z, 1 + rand() * 1.1);
  }
  function tree(x, z, s) {
    cyl(0.2 * s, 0.48 * s, 4 * s, bark, x, 2 * s, z);
    for (let k = 0; k < 4; k++) {
      const p = mesh(
        new T.ConeGeometry((2.3 - k * 0.35) * s, 3 * s, 7),
        mat(["#304b42", "#3a5749", "#3d5a4b", "#486354"][k]),
        x,
        (3 + k * 1.25) * s,
        z,
      );
      p.rotation.y = rand();
    }
    if (rand() > 0.5) rock(x + 1, z, 0.6 * s);
  }
  // Canvas tents, timber frames, stitched seams and rope guy lines.
  function tent(x, z, w, d, color, rot = 0) {
    const g = new T.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    scene.add(g);
    const fabric = mat(color, { side: T.DoubleSide });
    const h = w * 0.66;
    const geo = new T.BufferGeometry();
    geo.setAttribute(
      "position",
      new T.Float32BufferAttribute(
        [
          -w / 2,
          0.15,
          -d / 2,
          0,
          h,
          -d / 2,
          -w / 2,
          0.15,
          d / 2,
          0,
          h,
          -d / 2,
          0,
          h,
          d / 2,
          -w / 2,
          0.15,
          d / 2,
          0,
          h,
          -d / 2,
          w / 2,
          0.15,
          -d / 2,
          w / 2,
          0.15,
          d / 2,
          0,
          h,
          -d / 2,
          w / 2,
          0.15,
          d / 2,
          0,
          h,
          d / 2,
        ],
        3,
      ),
    );
    geo.computeVertexNormals();
    mesh(geo, fabric, 0, 0, 0, g);
    const back = new T.BufferGeometry();
    back.setAttribute(
      "position",
      new T.Float32BufferAttribute(
        [-w / 2, 0.15, -d / 2, w / 2, 0.15, -d / 2, 0, h, -d / 2],
        3,
      ),
    );
    back.computeVertexNormals();
    mesh(back, fabric, 0, 0, 0, g);
    for (const side of [-1, 1]) {
      const curtain = new T.BufferGeometry();
      curtain.setAttribute(
        "position",
        new T.Float32BufferAttribute(
          [
            (side * w) / 2,
            0.15,
            d / 2,
            0,
            h,
            d / 2,
            side * 0.65,
            0.15,
            d / 2 + 0.1,
          ],
          3,
        ),
      );
      curtain.computeVertexNormals();
      mesh(curtain, fabric, 0, 0, 0, g);
      cyl(0.09, 0.12, h + 0.3, wood, 0, h / 2, (side * d) / 2, g);
      for (const zz of [-d / 2, d / 2]) {
        beam(
          v((side * w) / 2, 0.25, zz),
          v(side * (w / 2 + 1.05), 0.1, zz + 0.6),
          0.025,
          rope,
          g,
        );
        cyl(0.06, 0.08, 0.5, wood, side * (w / 2 + 1.05), 0.12, zz + 0.6, g);
      }
    }
    beam(v(0, h, -d / 2 - 0.3), v(0, h, d / 2 + 0.3), 0.1, wood, g);
    for (let zz = -d / 2 + 0.6; zz < d / 2; zz += 0.85) {
      beam(v(-w / 2, 0.18, zz), v(0, h + 0.015, zz), 0.013, rope, g);
      beam(v(0, h + 0.015, zz), v(w / 2, 0.18, zz), 0.013, rope, g);
    }
    box(w * 0.6, 0.1, d * 0.8, mat("#504936"), 0, 0.03, 0, g);
    obstacle(x, z, rot ? d : w, rot ? w : d);
    return g;
  }
  tent(-11, -8, 5.2, 5.6, "#786480", 0.1);
  tent(8, -9, 5.8, 5.5, "#9f8a62", -0.12);
  tent(-12, 7, 5.2, 5, "#78816d", 0.25);
  tent(10, 9, 4.8, 5, "#8e7156", -0.15);
  tent(-4, -12, 3.4, 3, "#68716a", 0);
  function crate(x, z, s = 1) {
    const g = new T.Group();
    g.position.set(x, s / 2, z);
    scene.add(g);
    box(s, s, s, wood, 0, 0, 0, g);
    for (let k of [-0.4, 0.4]) {
      box(s + 0.03, 0.09, s + 0.03, darkwood, 0, k * s, 0, g);
      box(0.09, s + 0.03, s + 0.03, darkwood, k * s, 0, 0, g);
    }
    beam(
      v(-s * 0.4, -s * 0.4, s * 0.51),
      v(s * 0.4, s * 0.4, s * 0.51),
      0.045,
      rope,
      g,
    );
    g.rotation.y = rand() * 0.4;
    obstacle(x, z, s, s);
  }
  function barrel(x, z) {
    cyl(0.46, 0.42, 1.1, wood, x, 0.55, z, scene, 12);
    for (let y of [0.15, 0.85]) {
      const r = mesh(new T.TorusGeometry(0.455, 0.038, 4, 12), metal, x, y, z);
      r.rotation.x = Math.PI / 2;
    }
    cyl(0.4, 0.4, 0.035, darkwood, x, 1.11, z);
    obstacle(x, z, 0.8, 0.8);
  }
  for (const p of [
    [-15, -4],
    [-15, -5.2],
    [-7, -11],
    [11, -10],
    [12, -10],
    [13, 8],
    [-10, 11],
  ])
    crate(...p, 0.8 + rand() * 0.4);
  for (const p of [
    [-8, -7],
    [-15, 4],
    [-14, 4],
    [11, -6],
    [12, -6],
    [8, 12],
  ])
    barrel(...p);
  // Blacksmith work area, glowing forge and weapon rack.
  box(2.6, 0.75, 1.7, stone, 10, 0.38, -4);
  box(2.1, 0.13, 1.3, black, 10, 0.82, -4);
  const coal = mat("#df6a22", { emissive: "#d0440c", emissiveIntensity: 1.3 });
  for (let i = 0; i < 18; i++)
    mesh(
      new T.DodecahedronGeometry(0.16),
      coal,
      9.2 + rand() * 1.6,
      0.93,
      -4.5 + rand(),
    );
  box(0.5, 0.9, 0.6, darkwood, 7, 0.45, -4);
  box(1.2, 0.25, 0.55, metal, 7, 1, -4);
  const horn = mesh(new T.ConeGeometry(0.25, 0.7, 4), metal, 7.8, 1, -4);
  horn.rotation.z = -Math.PI / 2;
  obstacle(9, -4, 4.5, 2);
  const forgeLight = new T.PointLight("#ff873b", 11, 7, 2);
  forgeLight.position.set(10, 1.4, -4);
  scene.add(forgeLight);
  beam(v(-15, 0, 8), v(-15, 2.5, 8), 0.09, wood);
  beam(v(-11, 0, 8), v(-11, 2.5, 8), 0.09, wood);
  beam(v(-15, 2.2, 8), v(-11, 2.2, 8), 0.09, wood);
  for (let x = -14.5; x < -11; x += 0.7) {
    beam(v(x, 0.1, 8), v(x, 2.8, 8), 0.035, wood);
    mesh(new T.ConeGeometry(0.13, 0.5, 4), metal, x, 2.8, 8);
  }
  // Wagon, crates and shared ironbound chest.
  box(2.8, 0.2, 1.5, wood, 12, 0.8, 4.5);
  for (const x of [10.8, 13.2])
    for (const z of [3.65, 5.35]) {
      const wheel = mesh(
        new T.TorusGeometry(0.55, 0.09, 5, 12),
        darkwood,
        x,
        0.55,
        z,
      );
      for (let a = 0; a < 3; a++) {
        const b = box(0.07, 1.05, 0.06, wood, x, 0.55, z);
        b.rotation.z = (a * Math.PI) / 3;
      }
      wheel.castShadow = true;
    }
  for (let z of [3.8, 5.2])
    for (let h of [1.1, 1.45]) box(2.8, 0.25, 0.12, wood, 12, h, z);
  obstacle(12, 4.5, 3.4, 2.5);
  const chest = new T.Group();
  chest.position.set(8, 0.1, 5);
  scene.add(chest);
  box(1.7, 0.8, 1, wood, 0, 0.4, 0, chest);
  const lid = cyl(0.5, 0.5, 1.7, wood, 0, 0.85, 0, chest, 8);
  lid.rotation.z = Math.PI / 2;
  lid.scale.z = 0.8;
  for (let x of [-0.6, 0.6]) box(0.15, 1.05, 1.05, metal, x, 0.55, 0, chest);
  box(0.25, 0.25, 0.1, gold, 0, 0.65, 0.56, chest);
  obstacle(8, 5, 2, 1.4);
  // Waypoint circle and standing rune stones.
  const waypoint = v(-7, 0, 2);
  cyl(2.1, 2.2, 0.13, stone, -7, 0.045, 2, scene, 12);
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const s = box(
      0.5,
      0.25,
      0.75,
      mat("#83908b"),
      -7 + Math.cos(a) * 1.6,
      0.17,
      2 + Math.sin(a) * 1.6,
    );
    s.rotation.y = -a;
    box(
      0.04,
      0.015,
      0.38,
      mat("#8ee4e0", { emissive: "#3cb0c1", emissiveIntensity: 1.2 }),
      s.position.x,
      0.31,
      s.position.z,
    );
  }
  const ring = mesh(
    new T.RingGeometry(1.18, 1.22, 48),
    mat("#76c5c4", {
      emissive: "#28869d",
      emissiveIntensity: 0.5,
      side: T.DoubleSide,
    }),
    -7,
    0.13,
    2,
  );
  ring.rotation.x = -Math.PI / 2;
  // Central campfire: stone ring, charred logs, animated flame clusters and sparks.
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    rock(Math.cos(a) * 1.2, Math.sin(a) * 1.2, 0.34);
  }
  const ember = mat("#9b4024", { emissive: "#af3916", emissiveIntensity: 0.6 });
  cyl(0.95, 1, 0.05, ember, 0, 0.04, 0);
  for (let a of [0, 1.1, 2.2]) {
    const log = cyl(0.17, 0.21, 1.7, darkwood, 0, 0.24, 0);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = a;
  }
  const flames = [];
  for (let i = 0; i < 9; i++) {
    const f = mesh(
      new T.IcosahedronGeometry(1, 0),
      new T.MeshBasicMaterial({
        color: i % 2 ? "#ffc66b" : "#ec742f",
        transparent: true,
        opacity: 0.8,
      }),
      (rand() - 0.5) * 0.7,
      0.65,
      (rand() - 0.5) * 0.7,
    );
    f.scale.set(0.2 + rand() * 0.2, 0.65 + rand() * 0.4, 0.2 + rand() * 0.2);
    flames.push(f);
  }
  const firelight = new T.PointLight("#ffb060", 25, 13, 2);
  firelight.position.set(0, 1.8, 0);
  scene.add(firelight);
  obstacle(0, 0, 2.5, 2.5);
  for (const [x, z, rot] of [
    [-2.6, 2.2, 0.6],
    [2.3, 2.2, -0.6],
    [-1.5, -2.4, 1.5],
  ]) {
    const l = cyl(0.25, 0.3, 2.1, wood, x, 0.3, z);
    l.rotation.z = Math.PI / 2;
    l.rotation.y = rot;
  }
  const sparkGeo = new T.BufferGeometry(),
    sparkPos = new Float32Array(150 * 3);
  for (let i = 0; i < 150; i++) {
    sparkPos[i * 3] = (rand() - 0.5) * 1.5;
    sparkPos[i * 3 + 1] = rand() * 5;
    sparkPos[i * 3 + 2] = (rand() - 0.5) * 1.5;
  }
  sparkGeo.setAttribute("position", new T.BufferAttribute(sparkPos, 3));
  const sparks = new T.Points(
    sparkGeo,
    new T.PointsMaterial({
      color: "#ffc278",
      size: 0.05,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    }),
  );
  scene.add(sparks);
  const torches = [];
  function torch(x, z) {
    cyl(0.065, 0.1, 1.9, wood, x, 0.95, z);
    cyl(0.19, 0.1, 0.3, metal, x, 1.85, z);
    const flame = mesh(
      new T.IcosahedronGeometry(0.22, 0),
      new T.MeshBasicMaterial({ color: "#ffc878" }),
      x,
      2.12,
      z,
    );
    flame.scale.y = 1.7;
    torches.push(flame);
    const light = new T.PointLight("#ffac61", 7, 6, 2);
    light.position.set(x, 2.1, z);
    scene.add(light);
  }
  for (const p of [
    [-7, -5],
    [5, -6],
    [-9, 5],
    [8, 7],
    [18, -3],
    [18, 3],
  ])
    torch(...p);
  // Cloth banners at the gate and recruitment post.
  const banners = [];
  function banner(x, z, color) {
    cyl(0.065, 0.1, 4, wood, x, 2, z);
    beam(v(x - 0.1, 3.7, z), v(x + 1.6, 3.7, z), 0.05, wood);
    const geo = new T.PlaneGeometry(1.4, 2, 8, 10);
    const flag = mesh(
      geo,
      mat(color, { side: T.DoubleSide }),
      x + 0.7,
      2.65,
      z,
    );
    banners.push(flag);
  }
  banner(18, -3.3, "#884f46");
  banner(18, 3.3, "#884f46");
  banner(-9, 8, "#8e7756");
  // Small rocks and grass tufts use instancing to keep the scene lightweight.
  const grassGeo = new T.ConeGeometry(0.1, 0.4, 3),
    grass = new T.InstancedMesh(grassGeo, mat("#647357"), 1700);
  const dummy = new T.Object3D();
  for (let i = 0; i < 1700; i++) {
    let x = (rand() - 0.5) * 49,
      z = (rand() - 0.5) * 43;
    if (Math.abs(x) < 16 && Math.abs(z) < 12 && rand() < 0.8) {
      x += (x > 0 ? 1 : -1) * 15;
    }
    dummy.position.set(x, 0.12, z);
    dummy.scale.setScalar(0.5 + rand());
    dummy.rotation.set(0, rand() * 6, rand() * 0.35);
    dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix);
  }
  grass.receiveShadow = true;
  scene.add(grass);
  for (let i = 0; i < 95; i++) {
    const x = (rand() - 0.5) * 45,
      z = (rand() - 0.5) * 36;
    if (Math.abs(x) < 16 && Math.abs(z) < 12) continue;
    rock(x, z, 0.2 + rand() * 0.7);
  }
  // Batch static scenery by material to avoid thousands of draw calls.
  scene.updateMatrixWorld(true);
  const movingMeshes = new Set([...flames, ...torches, ...banners, ring]);
  const batches = new Map();
  scene.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || movingMeshes.has(o) || o === ground)
      return;
    const geo = o.geometry.clone().applyMatrix4(o.matrixWorld);
    const normalized = geo.index ? geo.toNonIndexed() : geo;
    for (const key of Object.keys(normalized.attributes))
      if (!["position", "normal", "uv"].includes(key))
        normalized.deleteAttribute(key);
    if (!normalized.attributes.uv)
      normalized.setAttribute(
        "uv",
        new T.Float32BufferAttribute(
          new Float32Array(normalized.attributes.position.count * 2),
          2,
        ),
      );
    if (!batches.has(o.material)) batches.set(o.material, []);
    batches.get(o.material).push({ object: o, geo: normalized });
  });
  for (const [material, parts] of batches) {
    const merged = mergeGeometries(parts.map((p) => p.geo));
    if (merged) {
      const m = mesh(merged, material);
      parts.forEach((p) => {
        p.object.removeFromParent();
        p.geo.dispose();
      });
    }
  }
  function person(x, z, color, kind = "warrior") {
    const g = new T.Group();
    g.position.set(x, 0, z);
    scene.add(g);
    const body = new T.Group();
    g.add(body);
    const cloth = mat(color),
      skin = mat("#b49a7d");
    cyl(0.25, 0.32, 0.65, cloth, 0, 0.95, 0, body);
    cyl(0.28, 0.37, 0.4, cloth, 0, 0.55, 0, body);
    const head = mesh(
      new T.IcosahedronGeometry(0.22, 1),
      skin,
      0,
      1.52,
      0,
      body,
    );
    const hood = mesh(
      new T.SphereGeometry(0.235, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.55),
      kind === "warrior" ? metal : cloth,
      0,
      1.57,
      0,
      body,
    );
    box(0.46, 0.12, 0.31, metal, 0, 1.04, 0, body);
    const legs = [];
    for (let s of [-1, 1]) {
      const l = new T.Group();
      l.position.set(s * 0.14, 0.55, 0);
      body.add(l);
      box(0.17, 0.5, 0.19, darkwood, 0, -0.22, 0, l);
      box(0.2, 0.16, 0.33, darkwood, 0, -0.46, 0.05, l);
      legs.push(l);
      const arm = box(0.15, 0.55, 0.18, cloth, s * 0.34, 1, 0, body);
      arm.rotation.z = s * 0.13;
      mesh(
        new T.IcosahedronGeometry(0.18, 0),
        kind === "warrior" ? metal : cloth,
        s * 0.32,
        1.25,
        0,
        body,
      );
    }
    if (kind === "warrior") {
      box(0.12, 1, 0.07, metal, 0.43, 0.8, 0.16, body);
      box(0.42, 0.07, 0.12, gold, 0.43, 0.47, 0.16, body);
      const shield = cyl(0.31, 0.31, 0.1, metal, -0.43, 0.95, 0.12, body, 6);
      shield.rotation.x = Math.PI / 2;
    } else if (kind === "mage") {
      beam(v(0.4, 0.05, 0), v(0.4, 1.95, 0), 0.035, wood, body);
      mesh(
        new T.IcosahedronGeometry(0.12),
        mat("#abbed4", { emissive: "#64789c", emissiveIntensity: 0.8 }),
        0.4,
        1.95,
        0,
        body,
      );
    } else {
      const bow = mesh(
        new T.TorusGeometry(0.43, 0.025, 4, 16, Math.PI),
        wood,
        0.43,
        1,
        0.1,
        body,
      );
      bow.rotation.z = -Math.PI / 2;
    }
    const capeGeo = new T.PlaneGeometry(0.52, 0.85, 1, 1);
    const cape = mesh(
      capeGeo,
      mat(color, { side: T.DoubleSide }),
      0,
      0.94,
      -0.22,
      body,
    );
    cape.rotation.x = 0.2;
    g.userData = { body, legs, phase: rand() * 6, path: [], swing: 0 };
    return g;
  }
  const hero = person(0, 5, "#65777a");
  const companions = [
    person(-1.8, 6.8, "#697658", "ranger"),
    person(0.2, 7.4, "#8d745a"),
    person(2, 6.7, "#83728d", "mage"),
  ];
  const select = mesh(
    new T.RingGeometry(0.55, 0.61, 32),
    new T.MeshBasicMaterial({
      color: "#c8b885",
      transparent: true,
      opacity: 0.8,
      side: T.DoubleSide,
    }),
    0,
    0.035,
    0,
    hero,
  );
  select.rotation.x = -Math.PI / 2;
  const npcs = [
    {
      name: "Akara",
      role: "HEALER",
      point: v(-8.8, 0, -4.6),
      kind: "mage",
      color: "#9384a2",
    },
    {
      name: "Charsi",
      role: "BLACKSMITH",
      point: v(6.1, 0, -3.2),
      kind: "warrior",
      color: "#b29470",
    },
    {
      name: "Kashya",
      role: "RECRUITMENT",
      point: v(-9.1, 0, 6.2),
      kind: "ranger",
      color: "#927762",
    },
    { name: "Stash", role: "SHARED STORAGE", point: v(8, 0, 6.6) },
    { name: "Waypoint", role: "FAST TRAVEL", point: v(-7, 0, 2) },
    { name: "Blood Moor", role: "THE EASTERN ROAD", point: v(18, 0, 0) },
  ];
  for (const n of npcs)
    if (n.kind) n.model = person(n.point.x, n.point.z, n.color, n.kind);
  person(15, 2.5, "#8b7564");
  person(15, -2.5, "#756e58", "ranger");
  const campObjects = scene.children.filter(
    (o) =>
      (!o.isLight || o.isPointLight) && o !== hero && !companions.includes(o),
  );
  const campObstacles = [...obstacles];
  const wilderness = createWilderness(ground.material);
  scene.add(wilderness.root);
  const enemyModels = new Map(),
    lootModels = new Map();
  const projectiles = [];
  const actorNames = ["hero", "Ilyra", "Bram", "Eira"];
  // Grid A* for every commanded move. A clearance margin prevents clipping tents and props.
  const STEP = 0.65,
    MIN = -18.2,
    MAX = 18.2,
    COUNT = Math.floor((MAX - MIN) / STEP) + 1;
  function blocked(x, z) {
    return (
      x < MIN ||
      x > MAX ||
      z < -14 ||
      z > 14 ||
      obstacles.some(
        (o) =>
          Math.abs(x - o.x) < o.w / 2 + 0.35 &&
          Math.abs(z - o.z) < o.d / 2 + 0.35,
      )
    );
  }
  function cell(p) {
    return [
      Math.max(0, Math.min(COUNT - 1, Math.round((p.x - MIN) / STEP))),
      Math.max(0, Math.min(COUNT - 1, Math.round((p.z - MIN) / STEP))),
    ];
  }
  function point(x, z) {
    return v(MIN + x * STEP, 0, MIN + z * STEP);
  }
  function route(start, end) {
    const [sx, sz] = cell(start);
    let [ex, ez] = cell(end);
    if (blocked(...[point(ex, ez).x, point(ex, ez).z])) {
      let best = Infinity;
      for (let x = 0; x < COUNT; x++)
        for (let z = 0; z < COUNT; z++) {
          const p = point(x, z),
            d = p.distanceToSquared(end);
          if (d < best && !blocked(p.x, p.z)) {
            best = d;
            ex = x;
            ez = z;
          }
        }
    }
    const key = (x, z) => x + z * COUNT,
      startKey = key(sx, sz),
      endKey = key(ex, ez),
      open = [startKey],
      parents = new Map(),
      scores = new Map([[startKey, 0]]),
      closed = new Set();
    let rounds = 0;
    while (open.length && rounds++ < 4000) {
      open.sort((a, b) => score(a) - score(b));
      const k = open.shift();
      if (k === endKey) {
        const out = [];
        let q = k;
        while (q !== startKey) {
          out.push(point(q % COUNT, Math.floor(q / COUNT)));
          q = parents.get(q);
          if (q === undefined) break;
        }
        return out.reverse();
      }
      closed.add(k);
      const x = k % COUNT,
        z = Math.floor(k / COUNT);
      for (const [dx, dz] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [-1, 1],
        [1, -1],
        [-1, -1],
      ]) {
        let nx = x + dx,
          nz = z + dz;
        if (nx < 0 || nz < 0 || nx >= COUNT || nz >= COUNT) continue;
        const p = point(nx, nz),
          nk = key(nx, nz);
        if (closed.has(nk) || blocked(p.x, p.z)) continue;
        if (
          dx &&
          dz &&
          (blocked(point(nx, z).x, point(nx, z).z) ||
            blocked(point(x, nz).x, point(x, nz).z))
        )
          continue;
        const g = scores.get(k) + (dx && dz ? 1.414 : 1);
        if (g < (scores.get(nk) ?? Infinity)) {
          parents.set(nk, k);
          scores.set(nk, g);
          if (!open.includes(nk)) open.push(nk);
        }
      }
    }
    return [];
    function score(k) {
      return (
        (scores.get(k) ?? Infinity) +
        Math.hypot((k % COUNT) - ex, Math.floor(k / COUNT) - ez)
      );
    }
  }
  const marker = mesh(
    new T.RingGeometry(0.3, 0.36, 32),
    new T.MeshBasicMaterial({
      color: "#e9cd8f",
      side: T.DoubleSide,
      transparent: true,
      opacity: 0,
    }),
    0,
    0.045,
    0,
  );
  marker.rotation.x = -Math.PI / 2;
  const api = {
    scene,
    renderer,
    camera,
    hero,
    companions,
    npcs,
    obstacles,
    hold: false,
    low: false,
    zone: "camp",
    combat: null,
    enemyModels,
    blocked,
    setZone(zone) {
      api.zone = zone;
      campObjects.forEach((o) => (o.visible = zone === "camp"));
      wilderness.root.visible = zone === "moor";
      enemyModels.forEach((o) => (o.visible = zone === "moor"));
      lootModels.forEach((o) => (o.visible = zone === "moor"));
      obstacles.splice(
        0,
        obstacles.length,
        ...(zone === "camp" ? campObstacles : wilderness.obstacles),
      );
      scene.background.set(zone === "camp" ? "#283b3e" : "#333e36");
      scene.fog.color.copy(scene.background);
      api.stop();
      hero.position.set(zone === "camp" ? 0 : -14, 0, zone === "camp" ? 5 : 10);
      companions.forEach((c, i) => {
        c.position.copy(hero.position).add(v((i - 1) * 1.1, 0, 1.4));
        c.userData.path = [];
      });
      repath = 0;
    },
    setCombat(combat) {
      api.combat = combat;
      for (const obj of lootModels.values()) {
        obj.geometry.dispose();
        obj.removeFromParent();
      }
      lootModels.clear();
      for (const obj of enemyModels.values()) {
        obj.traverse((o) => {
          if (o.isMesh) o.geometry.dispose();
        });
        obj.removeFromParent();
      }
      enemyModels.clear();
      for (const enemy of combat.enemies) {
        const obj = person(
          enemy.x,
          enemy.z,
          enemy.elite
            ? "#8f664b"
            : enemy.name === "Fallen"
              ? "#9a4d3f"
              : "#87917e",
        );
        obj.userData.enemyId = enemy.id;
        if (enemy.elite) obj.scale.setScalar(1.5);
        obj.visible = api.zone === "moor" && enemy.hp > 0;
        enemyModels.set(enemy.id, obj);
      }
    },
    projectile(sourceId, targetId) {
      const source = [hero, ...companions][actorNames.indexOf(sourceId)],
        target = enemyModels.get(targetId);
      if (!source || !target) return;
      const a = source.position.clone().add(v(0, 1.2, 0)),
        b = target.position.clone().add(v(0, 1, 0));
      const line = new T.Line(
        new T.BufferGeometry().setFromPoints([a, b]),
        new T.LineBasicMaterial({
          color: sourceId === "Eira" ? 0x9fcce1 : 0xd3bd85,
          transparent: true,
          opacity: 0.8,
        }),
      );
      scene.add(line);
      projectiles.push({ line, life: 0.17 });
    },
    animateAttack(id) {
      const actor =
        [hero, ...companions][actorNames.indexOf(id)] || enemyModels.get(id);
      if (actor) actor.userData.swing = 0.5;
    },
    moveTo(p) {
      hero.userData.path = route(hero.position, p);
      marker.position.set(p.x, 0.045, p.z);
      marker.material.opacity = 0.8;
    },
    stop() {
      hero.userData.path = [];
    },
    regroup() {
      companions.forEach((c) => (c.userData.path = []));
      repath = 0;
    },
    returnHome() {
      api.setZone("camp");
      hero.position.set(0, 0, 5);
      hero.userData.path = [];
      companions.forEach((c, i) => {
        c.position.set((i - 1) * 1.8, 0, 7);
        c.userData.path = [];
      });
      api.hold = false;
      api.pulse(0x81cbd6);
    },
    swing() {
      hero.userData.swing = 0.5;
    },
    pulse(color) {
      pulse.material.color.set(color);
      pulse.material.opacity = 0.8;
      pulse.scale.setScalar(1);
    },
  };
  const pulse = mesh(
    new T.RingGeometry(0.65, 0.8, 48),
    new T.MeshBasicMaterial({
      color: "#d3c087",
      transparent: true,
      opacity: 0,
      side: T.DoubleSide,
    }),
    0,
    0.05,
    0,
  );
  pulse.rotation.x = -Math.PI / 2;
  const ray = new T.Raycaster(),
    pointer = new T.Vector2();
  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    pointer.set(
      (e.clientX / innerWidth) * 2 - 1,
      (-e.clientY / innerHeight) * 2 + 1,
    );
    ray.setFromCamera(pointer, camera);
    if (api.zone === "moor" && api.combat) {
      const hit = ray.intersectObjects(
        [...enemyModels.values()].filter((o) => o.visible),
        true,
      )[0];
      if (hit) {
        let obj = hit.object;
        while (obj && !obj.userData.enemyId) obj = obj.parent;
        if (obj) {
          api.combat.select(obj.userData.enemyId);
          api.onManualMove?.();
          return;
        }
      }
    }
    const hits = ray.intersectObject(ground);
    if (hits.length) {
      api.combat?.cancel();
      api.onManualMove?.();
      api.moveTo(hits[0].point);
    }
  });
  const keys = new Set();
  window.addEventListener("keydown", (e) => keys.add(e.code));
  window.addEventListener("keyup", (e) => keys.delete(e.code));
  window.addEventListener("blur", () => keys.clear());
  function walk(person, dt, speed) {
    const data = person.userData;
    let moving = !!person.userData.manualMoving;
    if (data.path.length) {
      const target = data.path[0],
        d = target.clone().sub(person.position);
      d.y = 0;
      if (d.length() < speed * dt) {
        person.position.copy(target);
        data.path.shift();
      } else {
        person.position.addScaledVector(d.normalize(), speed * dt);
        person.rotation.y = Math.atan2(d.x, d.z);
        moving = true;
      }
    }
    data.phase += dt * (moving ? 10 : 2);
    data.body.position.y = moving
      ? Math.abs(Math.sin(data.phase)) * 0.055
      : Math.sin(data.phase) * 0.015;
    data.legs.forEach(
      (l, i) =>
        (l.rotation.x = moving ? Math.sin(data.phase + i * Math.PI) * 0.5 : 0),
    );
    if (data.swing > 0) {
      data.swing -= dt;
      data.body.rotation.y = Math.sin(data.swing * 12) * 0.7;
    } else data.body.rotation.y = 0;
  }
  let repath = 0;
  api.update = (dt, time, paused) => {
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.life -= dt;
      p.line.material.opacity = Math.max(0, p.life / 0.17) * 0.8;
      if (p.life <= 0) {
        p.line.removeFromParent();
        p.line.geometry.dispose();
        p.line.material.dispose();
        projectiles.splice(i, 1);
      }
    }
    flames.forEach((f, i) => {
      f.scale.y = 0.6 + Math.sin(time * 9 + i) * 0.15 + (i % 3) * 0.2;
      f.rotation.y = time + i;
    });
    firelight.intensity = 25 + Math.sin(time * 11) * 3;
    torches.forEach(
      (f, i) => (f.scale.y = 1.6 + Math.sin(time * 8 + i) * 0.25),
    );
    for (let i = 0; i < 150; i++) {
      sparkPos[i * 3 + 1] += dt * (0.5 + (i % 4) * 0.2);
      sparkPos[i * 3] += Math.sin(time + i) * dt * 0.1;
      if (sparkPos[i * 3 + 1] > 5) {
        sparkPos[i * 3 + 1] = 0.4;
        sparkPos[i * 3] = (rand() - 0.5) * 1.2;
      }
    }
    sparkGeo.attributes.position.needsUpdate = true;
    banners.forEach((f, j) => {
      const a = f.geometry.attributes.position;
      for (let i = 0; i < a.count; i++)
        a.setZ(
          i,
          Math.sin(a.getX(i) * 3 + time * 2 + j) *
            0.1 *
            (1 - (a.getY(i) + 1) / 2),
        );
      a.needsUpdate = true;
      f.geometry.computeVertexNormals();
    });
    marker.material.opacity = Math.max(0, marker.material.opacity - dt * 0.45);
    if (pulse.material.opacity > 0) {
      pulse.position.x = hero.position.x;
      pulse.position.z = hero.position.z;
      pulse.scale.addScalar(dt * 2);
      pulse.material.opacity -= dt * 0.8;
    }
    if (paused) {
      keys.clear();
      return;
    }
    let mx =
        (keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0) -
        (keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0),
      mz =
        (keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0) -
        (keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0);
    hero.userData.manualMoving = !!(mx || mz);
    if (mx || mz) {
      api.combat?.cancel();
      api.onManualMove?.();
      hero.userData.path = [];
      const d = v(mx * 0.81 + mz * 0.58, 0, -mx * 0.58 + mz * 0.81).normalize();
      let nx = hero.position.x + d.x * dt * 4,
        nz = hero.position.z + d.z * dt * 4;
      if (!blocked(nx, hero.position.z)) hero.position.x = nx;
      if (!blocked(hero.position.x, nz)) hero.position.z = nz;
      hero.rotation.y = Math.atan2(d.x, d.z);
    }
    if (api.zone === "moor" && api.combat) {
      api.combat.tick(
        dt,
        [hero, ...companions].map((o, i) => ({
          id: actorNames[i],
          x: o.position.x,
          z: o.position.z,
          active: o.visible,
        })),
        api.hold,
      );
      const order = api.combat.allies[0].order;
      if (
        order &&
        (!hero.userData.path.length ||
          hero.userData.path.at(-1).distanceTo(v(order.x, 0, order.z)) > 1.3)
      )
        hero.userData.path = route(hero.position, v(order.x, 0, order.z));
      if (api.combat.target && !order) hero.userData.path = [];
      for (const enemy of api.combat.enemies) {
        const model = enemyModels.get(enemy.id);
        model.visible = enemy.hp > 0;
        const prev = model.position.clone();
        model.position.set(enemy.x, 0, enemy.z);
        const dir = model.position.clone().sub(prev);
        if (dir.lengthSq() > 0.00001)
          model.rotation.y = Math.atan2(dir.x, dir.z);
        model.userData.body.position.y = Math.sin(time * 8) * 0.035;
        model.userData.body.rotation.z =
          enemy.windup > 0 ? Math.sin(time * 18) * 0.08 : 0;
        if (enemy.windup > 0) model.userData.body.rotation.x = -0.15;
        else model.userData.body.rotation.x = 0;
      }
      const activeDrops = new Set(api.combat.drops.map((d) => d.id));
      for (const [id, obj] of lootModels) {
        if (!activeDrops.has(id)) {
          obj.geometry.dispose();
          obj.removeFromParent();
          lootModels.delete(id);
        }
      }
      for (const drop of api.combat.drops) {
        let obj = lootModels.get(drop.id);
        if (!obj) {
          obj = mesh(
            new T.OctahedronGeometry(drop.elite ? 0.28 : 0.17),
            mat(drop.elite ? "#a9daca" : "#e2bc69", {
              emissive: drop.elite ? "#559e8a" : "#ac762a",
              emissiveIntensity: 0.8,
            }),
            drop.x,
            0.35,
            drop.z,
          );
          lootModels.set(drop.id, obj);
        }
        obj.visible = true;
        obj.position.y = 0.4 + Math.sin(time * 3) * 0.12;
        obj.rotation.y = time;
      }
    }
    walk(hero, dt, 4);
    repath -= dt;
    if (!api.hold && repath <= 0) {
      repath = 0.7;
      companions.forEach((comp, i) => {
        if (!comp.visible) return;
        const ally = api.zone === "moor" ? api.combat?.allies[i + 1] : null;
        if (ally && !ally.hp) {
          comp.userData.path = [];
          return;
        }
        if (ally?.order) {
          comp.userData.path = route(
            comp.position,
            v(ally.order.x, 0, ally.order.z),
          );
          return;
        }
        if (
          api.zone === "moor" &&
          api.combat?.enemies.some(
            (e) =>
              e.hp > 0 &&
              Math.hypot(e.x - comp.position.x, e.z - comp.position.z) <
                (i === 1 ? 2 : 7),
          )
        ) {
          comp.userData.path = [];
          return;
        }
        const offset = v((i - 1) * 1.65, 0, 2).applyAxisAngle(
          v(0, 1, 0),
          hero.rotation.y - Math.PI,
        );
        const target = hero.position.clone().add(offset);
        if (comp.position.distanceTo(target) > 1.1)
          comp.userData.path = route(comp.position, target);
      });
    }
    companions.forEach((c, i) => {
      const down = api.zone === "moor" && api.combat?.allies[i + 1].hp === 0;
      c.userData.body.rotation.z = down ? Math.PI / 2 : 0;
      if (c.visible && !api.hold && !down) walk(c, dt, 4.2);
    });
  };
  return api;
}
