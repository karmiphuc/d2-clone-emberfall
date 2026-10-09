// Rendering-independent rules for the first authored wilderness encounter.
export const ENCOUNTERS = [
  {
    id: "fallen-1",
    name: "Fallen",
    x: -8,
    z: 3,
    hp: 34,
    damage: 7,
    speed: 1.65,
    gold: 12,
  },
  {
    id: "fallen-2",
    name: "Fallen",
    x: -5,
    z: 2,
    hp: 34,
    damage: 7,
    speed: 1.65,
    gold: 12,
  },
  {
    id: "fallen-3",
    name: "Fallen",
    x: -7,
    z: 0,
    hp: 34,
    damage: 7,
    speed: 1.65,
    gold: 12,
  },
  {
    id: "risen-1",
    name: "Risen",
    x: 3,
    z: 4,
    hp: 52,
    damage: 10,
    speed: 1.1,
    gold: 16,
  },
  {
    id: "risen-2",
    name: "Risen",
    x: 6,
    z: 2,
    hp: 52,
    damage: 10,
    speed: 1.1,
    gold: 16,
  },
  {
    id: "risen-3",
    name: "Risen",
    x: 4,
    z: 0,
    hp: 52,
    damage: 10,
    speed: 1.1,
    gold: 16,
  },
  {
    id: "fallen-4",
    name: "Fallen",
    x: -3,
    z: -5,
    hp: 34,
    damage: 7,
    speed: 1.65,
    gold: 12,
  },
  {
    id: "fallen-5",
    name: "Fallen",
    x: 0,
    z: -6,
    hp: 34,
    damage: 7,
    speed: 1.65,
    gold: 12,
  },
  {
    id: "fallen-6",
    name: "Fallen",
    x: -1,
    z: -8,
    hp: 34,
    damage: 7,
    speed: 1.65,
    gold: 12,
  },
  {
    id: "risen-4",
    name: "Risen",
    x: 8,
    z: -7,
    hp: 52,
    damage: 10,
    speed: 1.1,
    gold: 16,
  },
  {
    id: "risen-5",
    name: "Risen",
    x: 11,
    z: -6,
    hp: 52,
    damage: 10,
    speed: 1.1,
    gold: 16,
  },
  {
    id: "brute",
    name: "Ashen Brute",
    x: 11,
    z: -10,
    hp: 180,
    damage: 23,
    speed: 1.25,
    gold: 55,
    elite: true,
  },
];
export const MAX_HP = { hero: 120, Ilyra: 78, Bram: 155, Eira: 85 };
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export function createCombat(state, emit = () => {}, blocked = () => false) {
  const allies = Object.entries(MAX_HP).map(([id, hp]) => ({
    id,
    hp,
    maxHp: hp,
    x: 0,
    z: 0,
    active: true,
    cooldown: 0,
    order: null,
  }));
  const enemies = ENCOUNTERS.map((e) => ({
    ...e,
    maxHp: e.hp,
    hp: state.defeated.includes(e.id) ? 0 : e.hp,
    cooldown: 0,
    windup: 0,
    victim: null,
    engaged: false,
  }));
  const drops = enemies
    .filter((e) => e.hp === 0 && !state.lootTaken.includes(e.id))
    .map((e) => ({
      id: e.id,
      x: state.dropLocations[e.id]?.x ?? e.x,
      z: state.dropLocations[e.id]?.z ?? e.z,
      gold: e.gold,
      elite: e.elite,
    }));
  let target = null,
    mana = 60,
    guard = 0,
    guardCooldown = 0,
    healCooldown = 0,
    regroupTime = 0,
    dead = false;
  const hero = allies[0];
  function hurtEnemy(enemy, damage, source) {
    if (enemy.hp <= 0) return;
    enemy.hp = Math.max(0, enemy.hp - damage);
    emit({
      type: "hit",
      victim: enemy.id,
      source,
      damage,
      x: enemy.x,
      z: enemy.z,
    });
    if (!enemy.hp) {
      enemy.windup = 0;
      if (!state.defeated.includes(enemy.id)) {
        state.defeated.push(enemy.id);
        state.dropLocations[enemy.id] = { x: enemy.x, z: enemy.z };
        state.xp += enemy.elite ? 100 : 20;
        drops.push({
          id: enemy.id,
          x: enemy.x,
          z: enemy.z,
          gold: enemy.gold,
          elite: enemy.elite,
        });
        emit({
          type: "kill",
          id: enemy.id,
          complete: state.defeated.length === ENCOUNTERS.length,
        });
      }
      if (target === enemy.id) target = null;
    }
  }
  function hitAlly(ally, damage, source) {
    if (ally.hp <= 0) return;
    const reduced = Math.max(
      1,
      Math.round(
        damage *
          (ally.id === "Bram" ? 0.65 : 1) *
          (ally.id === "hero" && guard > 0 ? 0.3 : 1),
      ),
    );
    ally.hp = Math.max(0, ally.hp - reduced);
    emit({
      type: "hit",
      victim: ally.id,
      source,
      damage: reduced,
      x: ally.x,
      z: ally.z,
    });
    if (!ally.hp) {
      ally.order = null;
      emit({ type: "down", id: ally.id });
    }
  }
  function attack(enemy, cleave = false) {
    if (hero.hp <= 0 || hero.cooldown > 0) return false;
    if (!enemy || enemy.hp <= 0 || distance(hero, enemy) > (cleave ? 3.1 : 2))
      return false;
    if (cleave && mana < 8) return false;
    hero.cooldown = cleave ? 0.8 : 0.55;
    if (cleave) mana -= 8;
    const damage = (state.weapon ? 15 : 9) + (state.charm ? 3 : 0);
    if (cleave)
      enemies
        .filter((e) => e.hp > 0 && distance(hero, e) < 3.1)
        .forEach((e) => hurtEnemy(e, damage * 1.5, "hero"));
    else hurtEnemy(enemy, damage, "hero");
    emit({ type: "swing", id: "hero", cleave });
    return true;
  }
  const api = {
    allies,
    enemies,
    drops,
    get mana() {
      return mana;
    },
    get guard() {
      return guard;
    },
    get target() {
      return target;
    },
    get dead() {
      return dead;
    },
    select(id) {
      if (enemies.some((e) => e.id === id && e.hp > 0)) target = id;
    },
    cancel() {
      target = null;
      hero.order = null;
    },
    rally() {
      regroupTime = 3;
      target = null;
      allies.forEach((a) => (a.order = null));
    },
    cleave() {
      return attack(
        enemies
          .filter((e) => e.hp > 0)
          .sort((a, b) => distance(hero, a) - distance(hero, b))[0],
        true,
      );
    },
    defend() {
      if (mana < 10 || guardCooldown > 0 || !hero.hp) return false;
      mana -= 10;
      guard = 3;
      guardCooldown = 8;
      return true;
    },
    heal() {
      if (hero.hp >= hero.maxHp || !hero.hp || state.potions <= 0) return false;
      state.potions--;
      hero.hp = Math.min(hero.maxHp, hero.hp + 65);
      emit({ type: "heal", id: "hero" });
      return true;
    },
    restore() {
      allies.forEach((a) => {
        a.hp = a.maxHp;
        a.cooldown = 0;
        a.order = null;
      });
      mana = 60;
      guard = 0;
      guardCooldown = 0;
      healCooldown = 0;
      dead = false;
      target = null;
      enemies.forEach((e) => {
        e.windup = 0;
        e.victim = null;
        e.engaged = false;
      });
    },
    tick(dt, positions, holding = false) {
      for (const ally of allies) {
        const p = positions.find((p) => p.id === ally.id);
        ally.active = !!p?.active;
        if (p) {
          ally.x = p.x;
          ally.z = p.z;
        }
        ally.cooldown = Math.max(0, ally.cooldown - dt);
        ally.order = null;
      }
      if (dead) return;
      mana = Math.min(60, mana + dt * 3);
      guard = Math.max(0, guard - dt);
      guardCooldown = Math.max(0, guardCooldown - dt);
      healCooldown = Math.max(0, healCooldown - dt);
      regroupTime = Math.max(0, regroupTime - dt);
      const focused = enemies.find((e) => e.id === target && e.hp > 0);
      if (focused) {
        if (distance(hero, focused) > 1.7)
          hero.order = { x: focused.x, z: focused.z };
        attack(focused);
      }
      for (const ally of allies.slice(1)) {
        if (!ally.active || !ally.hp || regroupTime > 0) continue;
        const near = enemies
          .filter((e) => e.hp > 0 && distance(hero, e) < 9)
          .sort((a, b) => distance(ally, a) - distance(ally, b));
        const enemy =
          focused && distance(hero, focused) < 10 ? focused : near[0];
        if (!enemy) continue;
        const range = ally.id === "Bram" ? 2 : 7;
        if (distance(ally, enemy) > range) {
          if (!holding) ally.order = { x: enemy.x, z: enemy.z };
        } else if (ally.cooldown <= 0) {
          ally.cooldown =
            ally.id === "Ilyra" ? 1.1 : ally.id === "Eira" ? 1.6 : 1.05;
          hurtEnemy(
            enemy,
            ally.id === "Bram" ? 9 : ally.id === "Ilyra" ? 8 : 7,
            ally.id,
          );
          emit({ type: "swing", id: ally.id, target: enemy.id });
        }
        if (ally.id === "Eira" && healCooldown <= 0) {
          const wounded = allies
            .filter(
              (a) =>
                a.active &&
                a.hp > 0 &&
                a.hp < a.maxHp * 0.7 &&
                distance(a, ally) < 9,
            )
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
          if (wounded) {
            wounded.hp = Math.min(wounded.maxHp, wounded.hp + 18);
            healCooldown = 5;
            emit({ type: "heal", id: wounded.id });
          }
        }
      }
      for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        enemy.cooldown = Math.max(0, enemy.cooldown - dt);
        if (enemy.windup > 0) {
          enemy.windup = Math.max(0, enemy.windup - dt);
          if (!enemy.windup) {
            const victim = allies.find((a) => a.id === enemy.victim);
            if (
              victim?.active &&
              victim.hp > 0 &&
              distance(enemy, victim) < (enemy.elite ? 3 : 2)
            )
              hitAlly(victim, enemy.damage, enemy.id);
            enemy.cooldown = enemy.elite ? 1.4 : 1;
          }
          continue;
        }
        const victim = allies
          .filter((a) => a.active && a.hp > 0)
          .sort((a, b) => distance(a, enemy) - distance(b, enemy))[0];
        if (!victim) continue;
        const dist = distance(enemy, victim);
        if (dist > 8 && !enemy.engaged) continue;
        enemy.engaged = true;
        if (dist > 1.45) {
          const dx = ((victim.x - enemy.x) / dist) * enemy.speed * dt,
            dz = ((victim.z - enemy.z) / dist) * enemy.speed * dt;
          if (!blocked(enemy.x + dx, enemy.z)) enemy.x += dx;
          if (!blocked(enemy.x, enemy.z + dz)) enemy.z += dz;
        } else if (enemy.cooldown <= 0) {
          enemy.windup = enemy.elite ? 0.95 : 0.5;
          enemy.victim = victim.id;
          emit({ type: "windup", id: enemy.id });
        }
      }
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        if (distance(hero, d) < 2) {
          if (!state.lootTaken.includes(d.id)) {
            state.lootTaken.push(d.id);
            delete state.dropLocations[d.id];
            state.gold += d.gold;
            if (d.elite) state.charm = true;
            if (state.lootTaken.length % 3 === 0) state.potions++;
            emit({ type: "loot", gold: d.gold, charm: !!d.elite });
          }
          drops.splice(i, 1);
        }
      }
      if (hero.hp <= 0 && !dead) {
        dead = true;
        target = null;
        emit({ type: "defeat" });
      }
    },
  };
  return api;
}
