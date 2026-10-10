import { createRenderBudget } from "./render-budget.js";
import { createDungeon } from "./dungeon.js";
import { denWalkable, DEN_GATE } from "./game/den.js";
import * as T from "three";
import { createActor, setActorWeapon, createMonster } from "./characters.js";
import { updateActorMotion, presentActor } from "./actor-sprites.js";
import { COMPANIONS } from "./game/companions.js";
import { scenery, scatterGrass, updateSceneryVisibility } from "./scenery.js";
import { visibleSpriteHit } from "./sprite-picking.js";
import { createCombatEffects } from "./combat-effects.js";
import { createWilderness } from "./wilderness.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export function createWorld(canvas) {
  const scene = new T.Scene();
  scene.background = new T.Color("#1e2223");
  scene.fog = new T.FogExp2("#252927", 0.008);
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  const renderBudget = createRenderBudget(Math.min(devicePixelRatio, 1.25));
  renderer.setPixelRatio(renderBudget.ratio);
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  let zoom = 19;
  const camera = new T.OrthographicCamera();
  camera.position.set(30, 36, 42);
  camera.lookAt(0, 0, 0);
  function resize() {
    const a = innerWidth / innerHeight;
    const viewHeight = Math.max(zoom, 18 / a);
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
      zoom = T.MathUtils.clamp(zoom + e.deltaY * 0.015, 14, 35);
      resize();
    },
    { passive: false },
  );
  const ambient = new T.HemisphereLight("#8195ac", "#2f332e", 1.1);
  scene.add(ambient);
  const sun = new T.DirectionalLight("#b6c0cf", 1.55);
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
  tex.width = tex.height = 4096;
  const c = tex.getContext("2d");
  c.scale(4, 4);
  c.fillStyle = "#535746";
  c.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 95000; i++) {
    const n = rand();
    c.fillStyle = n < 0.3 ? "#383f3444" : n < 0.65 ? "#8e876444" : "#63715755";
    c.fillRect(rand() * 1024, rand() * 1024, rand() * 3 + 1, rand() * 3 + 1);
  }
  function path(points, width) {
    c.strokeStyle = "#8b857636";
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
  new T.TextureLoader().load(
    new URL("../public/art/camp-soil.webp", import.meta.url).href,
    (loaded) => {
      for (let x = 0; x < 8; x++)
        for (let y = 0; y < 8; y++)
          c.drawImage(loaded.image, x * 128, y * 128, 128, 128);
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
      texture.needsUpdate = true;
      loaded.dispose();
    },
  );

  const ground = mesh(
    new T.PlaneGeometry(80, 80),
    mat("#ffffff", { map: texture }),
    0,
    -0.025,
    0,
  );
  ground.rotation.x = -Math.PI / 2;
  ground.castShadow = false;
  const oakTexture = new T.TextureLoader().load(
    new URL("../public/art/oak.webp", import.meta.url).href,
  );
  oakTexture.colorSpace = T.SRGBColorSpace;
  const flameTexture = new T.TextureLoader().load(
    new URL("../public/art/flame.webp", import.meta.url).href,
  );
  flameTexture.colorSpace = T.SRGBColorSpace;
  const obstacles = [];
  function obstacle(x, z, w, d) {
    obstacles.push({ x, z, w, d });
  }
  function rock(x, z, s = 1) {
    return scenery(scene, "moor", 0, x, z, s * 2.2, s * 1.7, 0.3);
  }

  // A broken palisade follows the edge of the camp, leaving the eastern road open.
  for (let x = -19; x <= 19; x += 0.7) {
    for (const z of [-15, 15]) {
      if (z === 15 && x > 6 && x < 11) continue;
      const h = (z === 15 ? 0.65 : 2) + rand() * 0.35;
      cyl(0.2, 0.28, h, wood, x, h / 2, z);
      mesh(new T.ConeGeometry(0.2, 0.5, 5), wood, x, h + 0.2, z);
    }
  }
  for (let z = -14.5; z <= 14.5; z += 0.7) {
    for (const x of [-19, 19]) {
      if (x === 19 && Math.abs(z) < 3) continue;
      const h = (z === 15 ? 0.65 : 2) + rand() * 0.35;
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
    // Foreground vegetation stays low so it never masks the company.
    if (x + z > 20) {
      cyl(0.1, 0.25, 0.7, bark, x, 0.35, z);
      rock(x + 0.4, z, 0.4);
      return;
    }
    const sprite = new T.Sprite(
      new T.SpriteMaterial({
        map: oakTexture,
        color: "#9c9b83",
        alphaTest: 0.15,
        depthWrite: true,
      }),
    );
    sprite.userData.occluder = true;
    sprite.center.set(0.58, 0.04);
    sprite.position.set(x, 0, z);
    sprite.scale.set(6.7 * s, 7 * s, 1);
    scene.add(sprite);
  }
  // Illustrated structures retain the original navigation footprints.
  function tent(x, z, w, d, cell, rot = 0) {
    const sprite = scenery(scene, "tents", cell, x, z, w * 1.7, w * 1.7, 0.3);
    obstacle(x, z, rot ? d : w, rot ? w : d);
    return sprite;
  }
  tent(-11, -8, 5.2, 5.6, 0, 0.1);
  tent(8, -9, 5.8, 5.5, 1, -0.12);
  tent(-12, 7, 5.2, 5, 2, 0.25);
  tent(10, 9, 4.8, 5, 3, -0.15);
  tent(-4, -12, 3.4, 3, 3);
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
  // Detailed hearth, bellows and tools with the original service footprint.
  scenery(scene, "services", 2, 9, -4, 5.5, 3.8, 0.3);
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
  scenery(scene, "services", 1, 8, 5, 3, 2.8, 0.15);
  obstacle(8, 5, 2, 1.4);
  // Rune circle retains its animated activation ring.
  const waypoint = v(-7, 0, 2);
  scenery(scene, "services", 0, -7, 2, 4.8, 4, 0.35);
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
  // Detailed charred timber and stones beneath the animated fire.
  scenery(scene, "details", 0, 0, 0, 3.4, 2.4, 0.48);
  const flames = [];
  const fireSprite = new T.Sprite(
    new T.SpriteMaterial({
      map: flameTexture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  fireSprite.center.set(0.5, 0);
  fireSprite.position.set(0, 0.2, 0);
  fireSprite.scale.set(2.6, 2.8, 1);
  scene.add(fireSprite);
  flames.push(fireSprite);
  const firelight = new T.PointLight("#ff9c49", 55, 18, 2);
  firelight.position.set(0, 1.8, 0);
  scene.add(firelight);
  obstacle(0, 0, 2.5, 2.5);
  for (const [x, z, rot] of [
    [-2.6, 2.2, 0.6],
    [2.3, 2.2, -0.6],
    [-1.5, -2.4, 1.5],
  ]) {
    scenery(scene, "services", 3, x, z, 2.6, 1.7, 0.2);
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
    const flame = new T.Sprite(
      new T.SpriteMaterial({
        map: flameTexture,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    flame.center.set(0.5, 0);
    flame.position.set(x, 1.85, z);
    flame.scale.set(0.6, 0.8, 1);
    scene.add(flame);
    torches.push(flame);
    const light = new T.PointLight("#ffac61", 14, 9, 2);
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
  scatterGrass(scene, 180, rand, true);
  for (let i = 0; i < 95; i++) {
    const x = (rand() - 0.5) * 45,
      z = (rand() - 0.5) * 36;
    if (Math.abs(x) < 16 && Math.abs(z) < 12) continue;
    rock(x, z, 0.2 + rand() * 0.7);
  }
  for (let i = 0; i < 22; i++) {
    const x = -16 + i * 1.55,
      z = 2.4 + Math.sin(i * 0.38) * 0.75;
    scenery(scene, "details", 1, x, z, 2.3, 1.5, 0.45);
  }
  for (let x = -18; x < 19; x += 4) {
    beam(v(x, 0.9, -14.7), v(x + 3.8, 1.5, -14.7), 0.08, darkwood);
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
  function person(x, z, color, kind = "warrior", identity = null) {
    const name =
      kind === "mage" ? "Eira" : kind === "ranger" ? "Ilyra" : "Bram";
    const actor = createActor(identity || name);
    actor.position.set(x, 0, z);
    scene.add(actor);
    return actor;
  }
  const hero = createActor("hero");
  hero.position.set(0, 0, 5);
  hero.rotation.y = Math.PI;
  scene.add(hero);
  const companions = Object.entries(COMPANIONS).map(([id, spec], i) => {
    const actor = createActor(id);
    actor.position.set((i - 1) * 1.8, 0, 7);
    actor.userData.companionId = id;
    actor.visible = i < 3;
    scene.add(actor);
    return actor;
  });
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
    if (n.kind) n.model = person(n.point.x, n.point.z, n.color, n.kind, n.name);
  person(15, 2.5, "#8b7564");
  person(15, -2.5, "#756e58", "ranger");
  const campObjects = scene.children.filter(
    (o) =>
      (!o.isLight || o.isPointLight) && o !== hero && !companions.includes(o),
  );
  const campObstacles = [...obstacles];
  const wilderness = createWilderness(ground.material, oakTexture);
  scene.add(wilderness.root);
  const dungeon = createDungeon();
  scene.add(dungeon.root);
  scenery(
    wilderness.root,
    "cave",
    1,
    DEN_GATE.x,
    DEN_GATE.z - 1,
    5.5,
    5.2,
    0.1,
  );
  const sceneryProps = [];
  scene.traverse((o) => {
    if (o.userData.occluder) sceneryProps.push(o);
  });
  const enemyModels = new Map(),
    lootModels = new Map();
  const effects = createCombatEffects(scene);
  const findActor = (id) =>
    [hero, ...companions][actorNames.indexOf(id)] || enemyModels.get(id);
  const actorNames = ["hero", ...Object.keys(COMPANIONS)];
  // Grid A* for every commanded move. A clearance margin prevents clipping tents and props.
  const STEP = 0.65,
    MIN = -18.2,
    MAX = 18.2,
    COUNT = Math.floor((MAX - MIN) / STEP) + 1;
  function blocked(x, z) {
    return (
      (api.zone === "den" && !denWalkable(x, z, 0.3)) ||
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
  const cameraFocus = new T.Vector3(0, 0, 5);
  const cameraOffset = new T.Vector3(30, 36, 42);
  const api = {
    scene,
    renderer,
    camera,
    hero,
    companions,
    npcs,
    obstacles,
    hold: false,
    hoveredEnemy: null,
    low: false,
    zone: "camp",
    combat: null,
    enemyModels,
    blocked,
    route: (a, b) => route(v(a.x, 0, a.z), v(b.x, 0, b.z)),
    resetRenderBudget() {
      renderer.setPixelRatio(
        renderBudget.reset(Math.min(devicePixelRatio, api.low ? 1 : 1.25)),
      );
    },
    adaptPerformance(dt) {
      // Respect direct renderer overrides used by captures/development tools.
      if (Math.abs(renderer.getPixelRatio() - renderBudget.ratio) > 0.001)
        return;
      const ratio = renderBudget.tick(dt);
      if (Math.abs(renderer.getPixelRatio() - ratio) > 0.001)
        renderer.setPixelRatio(ratio);
    },
    updateCamera(dt) {
      cameraFocus.lerp(
        hero.position.clone().add(hero.userData.renderOffset),
        1 - Math.exp(-dt * 7),
      );
      camera.position.copy(cameraFocus).add(cameraOffset);
      camera.lookAt(cameraFocus.x, 0.6, cameraFocus.z);
      camera.updateMatrixWorld();
    },
    setEquipment(equipment, mercGear = {}) {
      setActorWeapon(hero, equipment.weapon?.itemId || "worn_sword");
      const issued = {
        Ilyra: "bow",
        Bram: "mace",
        Eira: "sun_staff",
        Soren: "frost_staff",
        Aldric: "tempered_sword",
        Nyx: "daggers",
      };
      companions.forEach((actor) =>
        setActorWeapon(
          actor,
          mercGear[actor.userData.characterId]?.weapon?.itemId ||
            issued[actor.userData.characterId],
        ),
      );
    },
    setZone(zone) {
      renderer.shadowMap.needsUpdate = true;
      api.practiceWindup = 0;
      effects.clear();
      api.hoveredEnemy = null;
      api.zone = zone;
      campObjects.forEach((o) => (o.visible = zone === "camp"));
      wilderness.root.visible = zone === "moor";
      dungeon.root.visible = zone === "den";
      enemyModels.forEach((o) => (o.visible = zone !== "camp"));
      lootModels.forEach((o) => (o.visible = zone !== "camp"));
      obstacles.splice(
        0,
        obstacles.length,
        ...(zone === "camp"
          ? campObstacles
          : zone === "den"
            ? []
            : wilderness.obstacles),
      );
      ambient.color.set(zone === "camp" ? "#8195ac" : "#708796");
      ambient.groundColor.set(zone === "camp" ? "#2f332e" : "#222d2d");
      ambient.intensity = zone === "camp" ? 1.1 : 1.3;
      sun.color.set(zone === "camp" ? "#b6c0cf" : "#879eaa");
      sun.intensity = zone === "camp" ? 1.55 : 1.4;
      scene.background.set(zone === "camp" ? "#1e2223" : "#202b30");
      if (zone === "den") {
        ambient.color.set("#788791");
        ambient.intensity = 1.25;
        ambient.groundColor.set("#292421");
        sun.intensity = 1.15;
        scene.background.set("#080c0f");
      }
      scene.fog.color.copy(scene.background);
      api.stop();
      hero.position.set(zone === "camp" ? 0 : -14, 0, zone === "camp" ? 5 : 10);
      hero.rotation.y = zone === "camp" ? Math.PI : 2.3;
      hero.userData.renderPosition.copy(hero.position);
      companions.forEach((c, i) => {
        c.position
          .copy(hero.position)
          .add(
            v(
              (Math.max(0, companions.filter((a) => a.visible).indexOf(c)) -
                1) *
                1.1,
              0,
              1.4,
            ),
          );
        c.userData.path = [];
      });
      cameraFocus.copy(hero.position);
      api.updateCamera(1);
      repath = 0;
    },
    setCombat(combat) {
      effects.clear();
      api.combat = combat;
      for (const obj of lootModels.values()) {
        obj.geometry.dispose();
        obj.removeFromParent();
      }
      lootModels.clear();
      for (const obj of enemyModels.values()) {
        obj.userData.disposeTextures?.();
        obj.traverse((o) => {
          if (o.isMesh) {
            o.geometry.dispose();
            o.material.dispose();
          }
          if (o.isSprite) {
            o.material.dispose();
          }
        });
        obj.removeFromParent();
      }
      enemyModels.clear();
      for (const enemy of combat.enemies) {
        const obj = createMonster(enemy);
        obj.position.set(enemy.x, 0, enemy.z);
        scene.add(obj);
        obj.userData.enemyId = enemy.id;
        if (enemy.elite) obj.scale.setScalar(1.25);
        obj.visible = api.zone !== "camp" && enemy.hp > 0;
        enemyModels.set(enemy.id, obj);
      }
    },
    effects,
    reducedEffects: window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches,
    combatVisual(event) {
      const actor = findActor(event.id || event.source || "hero");
      const target = findActor(event.victim || event.target);
      const point = (object, height = 1) =>
        object.position.clone().add(v(0, height, 0));
      if (event.type === "hit" && target) {
        target.userData.hitFlash = api.reducedEffects ? 0 : 0.13;
        if (!api.reducedEffects && actor && actor !== target) {
          const impulse = target.position
            .clone()
            .sub(actor.position)
            .normalize();
          const angle = target.rotation.y;
          target.userData.recoilX =
            impulse.x * Math.cos(angle) - impulse.z * Math.sin(angle);
          target.userData.recoilZ =
            impulse.x * Math.sin(angle) + impulse.z * Math.cos(angle);
          target.userData.recoilStrength =
            event.source === "hero" ? 0.22 : 0.12;
          target.userData.recoilTime = 0.22;
          target.userData.impactHold = 0.018;
        }
        const kind =
          event.source === "Soren"
            ? "frost"
            : event.source === "Nyx"
              ? "shadow"
              : event.source === "Aldric"
                ? "holy"
                : "impact";
        effects.spawn(kind, point(target), {
          size: 1.2,
          duration: 0.3,
          opacity: kind === "impact" ? 0.55 : 0.25,
        });
      }
      if (event.type === "swing" && actor) {
        if (["Ilyra", "Eira", "Soren"].includes(event.id) && target) {
          const from = point(actor, 1.2),
            to = point(target);
          const kind = { Ilyra: "arrow", Eira: "holyBolt", Soren: "frostBolt" }[
            event.id
          ];
          effects.spawn(kind, from, {
            to,
            size: event.id === "Ilyra" ? 1.1 : 1.4,
            duration: Math.min(0.22, Math.max(0.08, from.distanceTo(to) / 36)),
            opacity: event.id === "Ilyra" ? 1 : 0.8,
          });
        } else {
          const pos = point(actor);
          if (target) pos.lerp(point(target), 0.5);
          const kind = event.id === "Nyx" ? "shadow" : "slash";
          effects.spawn(kind, pos, {
            size: event.cleave ? 4 : event.id === "hero" ? 2.4 : 1.8,
            opacity: event.id === "hero" ? 0.65 : 0.4,
            duration: event.cleave ? 0.4 : 0.23,
            rotation: actor.rotation.y > 0 ? -0.3 : 0.3,
          });
          if (event.id === "hero" && hero.userData.weaponId === "ember_cleaver")
            effects.spawn("fire", pos, { size: 2, duration: 0.35 });
          if (event.id === "hero" && hero.userData.weaponId === "frost_edge")
            effects.spawn("frost", pos, { size: 1.8, duration: 0.35 });
        }
      }
      if (event.type === "heal" && actor) {
        effects.spawn("heal", point(actor, 0.7), {
          size: 2.8,
          duration: 1,
          rise: 1,
        });
        const caster = findActor(event.source);
        if (caster && caster !== actor)
          effects.spawn("healBolt", point(caster, 1.2), {
            to: point(actor),
            size: 1.4,
            duration: 0.22,
            opacity: 0.65,
          });
      }
      if (event.type === "guard" && actor)
        effects.spawn("ward", point(actor, 0.5), {
          size: 2.7,
          duration: event.duration,
          follow: actor,
          opacity: 0.24,
        });
      if (event.type === "level")
        effects.spawn("holy", point(hero), { size: 5, duration: 1.5, rise: 1 });
      if (event.type === "special" && actor) {
        const kind = {
          Frostburst: "frost",
          Backstab: "shadow",
          "Holy strike": "holy",
          Challenge: "ward",
        }[event.name];
        if (kind)
          effects.spawn(kind, point(target || actor), {
            size: event.name === "Frostburst" ? 4.2 : 3,
            duration: 0.65,
            opacity: event.name === "Challenge" ? 0.3 : 0.4,
          });
      }
      if (event.type === "kill") {
        const victim = findActor(event.id);
        if (victim) victim.userData.deathTime = 1.2;
      }
    },
    animateAttack(id, targetId, duration = 0.55, windup = 0.16) {
      const actor =
        [hero, ...companions][actorNames.indexOf(id)] || enemyModels.get(id);
      if (actor) {
        actor.userData.swing = duration;
        actor.userData.attackDuration = duration;
        actor.userData.attackWindup = windup;
        const target =
          enemyModels.get(targetId) ||
          [hero, ...companions][actorNames.indexOf(targetId)];
        if (target)
          actor.rotation.y = Math.atan2(
            target.position.x - actor.position.x,
            target.position.z - actor.position.z,
          );
      }
    },
    releaseAttack(duration = 0.39) {
      hero.userData.swing = duration;
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
        c.position.set(
          (Math.max(0, companions.filter((a) => a.visible).indexOf(c)) - 1) *
            1.8,
          0,
          7,
        );
        c.userData.path = [];
      });
      api.hold = false;
      api.pulse(0x81cbd6);
    },
    swing() {
      if (hero.userData.swing > 0) return;
      hero.userData.path = [];
      api.practiceWindup = 0.16;
      api.animateAttack("hero", null, 0.55, 0.16);
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
  function castPointer(event) {
    pointer.set(
      (event.clientX / innerWidth) * 2 - 1,
      (-event.clientY / innerHeight) * 2 + 1,
    );
    ray.setFromCamera(pointer, camera);
  }
  function pickEnemy() {
    if (api.zone === "camp" || !api.combat) return null;
    const living = [...enemyModels.values()].filter(
      (o) =>
        o.visible &&
        api.combat.enemies.some((e) => e.id === o.userData.enemyId && e.hp > 0),
    );
    for (const hit of ray.intersectObjects(living, true)) {
      if (!hit.object.isSprite || !visibleSpriteHit(hit)) continue;
      let object = hit.object;
      while (object && !object.userData.enemyId) object = object.parent;
      if (object) return object.userData.enemyId;
    }
    return null;
  }
  canvas.addEventListener("pointermove", (event) => {
    castPointer(event);
    api.hoveredEnemy = pickEnemy();
    canvas.style.cursor = api.hoveredEnemy ? "crosshair" : "default";
  });
  canvas.addEventListener("pointerleave", () => {
    api.hoveredEnemy = null;
    canvas.style.cursor = "default";
  });
  canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.button !== 2) return;
    castPointer(event);
    const enemyId = pickEnemy();
    if (event.button === 2) {
      api.onSecondaryAttack?.(enemyId);
      return;
    }
    if (enemyId) {
      api.combat.select(enemyId);
      api.onManualMove?.();
      return;
    }
    const hits = ray.intersectObject(ground);
    if (hits.length) {
      api.combat?.cancel();
      api.onManualMove?.();
      api.moveTo(hits[0].point);
    }
  });
  const targetRing = mesh(
    new T.RingGeometry(0.63, 0.69, 48),
    new T.MeshBasicMaterial({
      color: "#bd6949",
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    }),
    0,
    0.04,
    0,
  );
  targetRing.rotation.x = -Math.PI / 2;
  targetRing.castShadow = false;
  targetRing.visible = false;
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
    data.moving = moving;
  }
  let repath = 0;
  api.update = (dt, time, paused) => {
    if (!paused)
      for (const actor of [hero, ...companions, ...enemyModels.values()])
        actor.userData.simulationPosition.copy(actor.position);
    updateSceneryVisibility(sceneryProps, hero, camera, dt);
    if (api.zone === "den") dungeon.update(time);
    const marked =
      api.zone !== "camp" &&
      api.combat?.enemies.find(
        (e) => e.hp > 0 && e.id === (api.hoveredEnemy || api.combat.target),
      );
    targetRing.visible = !!marked;
    if (marked) {
      targetRing.position.set(marked.x, 0.04, marked.z);
      targetRing.scale.setScalar(marked.elite ? 1.7 : 1);
      targetRing.material.color.set(
        api.hoveredEnemy === marked.id ? "#e2c287" : "#bd6949",
      );
    }
    if (!paused) effects.update(dt, api.reducedEffects);
    flames.forEach((f, i) => {
      f.scale.y = 2.8 + Math.sin(time * 9 + i) * 0.12;
      f.scale.x = 2.6 + Math.sin(time * 5) * 0.09;
    });
    firelight.intensity = 55 + Math.sin(time * 11) * 5;
    torches.forEach((f, i) => (f.scale.y = 0.8 + Math.sin(time * 8 + i) * 0.1));
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
    if (api.practiceWindup > 0) {
      api.practiceWindup = Math.max(0, api.practiceWindup - dt);
      if (!api.practiceWindup) api.onPracticeStrike?.();
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
    if (api.zone !== "camp" && api.combat) {
      api.combat.tick(
        dt,
        [hero, ...companions].map((o, i) => ({
          id: actorNames[i],
          x: o.position.x,
          z: o.position.z,
          active: o.visible,
        })),
        api.hold,
        hero.userData.manualMoving || !!hero.userData.path.length,
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
        const dying = enemy.hp <= 0 && (model.userData.deathTime || 0) > 0;
        model.visible = enemy.hp > 0 || dying;
        if (dying)
          model.userData.deathTime = Math.max(0, model.userData.deathTime - dt);
        const prev = model.position.clone();
        model.position.set(enemy.x, 0, enemy.z);
        const dir = model.position.clone().sub(prev);
        if (dir.lengthSq() > 0.00001)
          model.rotation.y = Math.atan2(dir.x, dir.z);
        model.userData.highlight =
          api.hoveredEnemy === enemy.id
            ? 0.2
            : api.combat.target === enemy.id
              ? 0.08
              : 0;
        model.userData.windup = enemy.windup;
        updateActorMotion(model, dt, dir.lengthSq() > 0.00001);
        if (dying) {
          const t = 1 - model.userData.deathTime / 1.2;
          const settle = Math.min(1, t * 3);
          model.userData.body.rotation.z = settle * 0.25;
          model.userData.sprite.material.opacity =
            1 - Math.max(0, (t - 0.45) / 0.55);
          model.userData.shadow.material.opacity = 0.6 * (1 - t);
          model.userData.body.position.y = -settle * 0.5;
          model.userData.posePosition.copy(model.userData.body.position);
        }
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
    if (api.zone !== "camp" && api.combat?.preparing) hero.userData.path = [];
    walk(hero, dt, 4);
    updateActorMotion(hero, dt, hero.userData.moving);
    repath -= dt;
    if (!api.hold && repath <= 0) {
      repath = 0.7;
      companions.forEach((comp, i) => {
        if (!comp.visible) return;
        const ally = api.zone !== "camp" ? api.combat?.allies[i + 1] : null;
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
          api.zone !== "camp" &&
          api.combat?.enemies.some(
            (e) =>
              e.hp > 0 &&
              Math.hypot(e.x - comp.position.x, e.z - comp.position.z) <
                COMPANIONS[actorNames[i + 1]].range,
          )
        ) {
          comp.userData.path = [];
          return;
        }
        const formationIndex = companions
          .filter((c) => c.visible)
          .indexOf(comp);
        const offset = v((formationIndex - 1) * 1.65, 0, 2).applyAxisAngle(
          v(0, 1, 0),
          hero.rotation.y - Math.PI,
        );
        const target = hero.position.clone().add(offset);
        if (comp.position.distanceTo(target) > 1.1)
          comp.userData.path = route(comp.position, target);
      });
    }
    companions.forEach((c, i) => {
      const down = api.zone !== "camp" && api.combat?.allies[i + 1].hp === 0;
      c.userData.moving = false;
      if (c.visible && !api.hold && !down && c.userData.swing <= 0)
        walk(c, dt, c.userData.companionId === "Nyx" ? 5.4 : 4.2);
      if (c.visible) updateActorMotion(c, dt, c.userData.moving, down);
    });
  };
  api.present = (alpha, dt) => {
    for (const actor of [hero, ...companions, ...enemyModels.values()])
      if (actor.visible) presentActor(actor, alpha, dt);
    const h = hero.userData;
    select.position.set(h.shadow.position.x, 0.035, h.shadow.position.z);
    const marked = api.combat?.enemies.find(
      (e) => e.hp > 0 && e.id === (api.hoveredEnemy || api.combat.target),
    );
    const displayed =
      marked && enemyModels.get(marked.id)?.userData.renderPosition;
    if (displayed) targetRing.position.set(displayed.x, 0.04, displayed.z);
    effects.present(alpha, api.reducedEffects);
  };
  return api;
}
