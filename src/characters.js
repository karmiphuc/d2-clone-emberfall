import * as T from "three";
import {
  createSpriteActor,
  equipSprite,
  updateActorMotion,
} from "./actor-sprites.js";

// Weapons are declared once for world actors and the directional preview.
const CHARACTER_WEAPONS = {
  hero: "worn_sword",
  Ilyra: "bow",
  Bram: "mace",
  Eira: "sun_staff",
  Soren: "frost_staff",
  Aldric: "tempered_sword",
  Nyx: "daggers",
  Akara: "sun_staff",
  Charsi: "hammer",
  Kashya: "bow",
};
export function setActorWeapon(actor, id) {
  if (actor.userData.weaponId !== id) equipSprite(actor, id);
}
export function createActor(name = "hero") {
  return createSpriteActor(
    name,
    CHARACTER_WEAPONS[name] || CHARACTER_WEAPONS.hero,
  );
}
export function createCharacterPreview(canvas, id, weapon) {
  const renderer = new T.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  const scene = new T.Scene();
  scene.add(new T.HemisphereLight("#d5d4d0", "#2a2420", 2));
  const key = new T.DirectionalLight("#e7e1d7", 3);
  key.position.set(-3, 4, 5);
  scene.add(key);
  const rim = new T.DirectionalLight("#8da9c5", 2);
  rim.position.set(4, 3, -3);
  scene.add(rim);
  const actor = createActor(id);
  actor.userData.previewMotion = true;
  if (weapon) setActorWeapon(actor, weapon);
  actor.rotation.y = -0.35;
  scene.add(actor);
  const camera = new T.PerspectiveCamera(35, 1, 0.1, 20);
  camera.position.set(0, 1.65, 5.1);
  camera.lookAt(0, 1.3, 0);
  let dragging = false,
    lastX = 0;
  canvas.onpointerdown = (e) => {
    dragging = true;
    lastX = e.clientX;
    canvas.setPointerCapture(e.pointerId);
  };
  canvas.onpointerup = () => (dragging = false);
  canvas.onpointermove = (e) => {
    if (dragging) {
      actor.rotation.y += (e.clientX - lastX) * 0.012;
      lastX = e.clientX;
    }
  };
  let mode = "idle",
    previousTime = null,
    nextAttack = 0;
  return {
    actor,
    setMotion(value) {
      mode = ["idle", "walk", "attack"].includes(value) ? value : "idle";
      actor.userData.swing = 0;
      nextAttack = 0;
    },
    render(time) {
      const w = canvas.clientWidth,
        h = canvas.clientHeight;
      if (!w || !h) return;
      if (
        canvas.width !== Math.round(w * renderer.getPixelRatio()) ||
        canvas.height !== Math.round(h * renderer.getPixelRatio())
      ) {
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        // Fit the complete figure and its weapon in narrow inventory columns.
        camera.position.z = 5.1 * Math.max(1, 1 / camera.aspect);
        camera.lookAt(0, 1.3, 0);
        camera.updateProjectionMatrix();
      }
      const dt = previousTime === null ? 0 : Math.min(0.1, time - previousTime);
      previousTime = time;
      if (mode === "attack" && time >= nextAttack) {
        actor.userData.swing = 0.55;
        actor.userData.attackDuration = 0.55;
        actor.userData.attackWindup = 0.16;
        nextAttack = time + 1.1;
      }
      updateActorMotion(actor, dt, mode === "walk");
      renderer.render(scene, camera);
    },
    dispose() {
      actor.userData.disposeTextures();
      scene.traverse((o) => {
        if (o.isSprite) {
          o.material.dispose();
        }
        if (o.isMesh) {
          o.geometry.dispose();
          o.material.dispose();
        }
      });
      renderer.dispose();
    },
  };
}

export function createMonster(enemy) {
  return createSpriteActor(
    enemy.elite ? "Brute" : enemy.name === "Fallen" ? "Fallen" : "Risen",
    "monster_weapon",
  );
}
