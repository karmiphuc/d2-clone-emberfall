import { COMPANIONS } from "./companions.js";
import { heroStats, lootItem, addLoot, ITEMS } from "./items.js";
import { levelOf, LEVEL_XP } from "./progression.js";
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
export const MAX_HP = {
  hero: 120,
  ...Object.fromEntries(
    Object.entries(COMPANIONS).map(([id, c]) => [id, c.hp]),
  ),
};
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
  let stats = heroStats(state);
  const areaScale = 1 + Math.min(state.run, 3) * 0.22;
  const enemies = ENCOUNTERS.map((e) => ({
    ...e,
    maxHp: Math.round(e.hp * areaScale),
    hp: state.defeated.includes(e.id) ? 0 : Math.round(e.hp * areaScale),
    damage: Math.round(e.damage * (1 + Math.min(state.run, 3) * 0.12)),
    slow: 0,
    taunted: 0,
    taunter: null,
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
      item:
        state.dropItems[e.id] ||
        lootItem(
          state,
          e.id,
          ENCOUNTERS.findIndex((a) => a.id === e.id),
          e.elite,
        ),
    }));
  let target = null,
    mana = stats.mana,
    guard = 0,
    guardCooldown = 0,
    rallyCooldown = 0,
    regroupTime = 0,
    dead = false,
    queuedCleave = false;
  const hero = allies[0];
  function hurtEnemy(enemy, damage, source) {
    if (enemy.hp <= 0) return;
    if (
      source === "hero" &&
      state.skills.executioner &&
      enemy.hp < enemy.maxHp * 0.35
    )
      damage *= 1.35;
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
        const oldLevel = levelOf(state);
        state.xp = Math.min(
          LEVEL_XP.at(-1),
          state.xp + (enemy.elite ? 100 : 20),
        );
        if (levelOf(state) > oldLevel) {
          refreshStats(true);
          emit({ type: "level", level: levelOf(state) });
        }
        const item = lootItem(
          state,
          enemy.id,
          ENCOUNTERS.findIndex((e) => e.id === enemy.id),
          enemy.elite,
        );
        state.dropItems[enemy.id] = item;
        drops.push({
          id: enemy.id,
          x: enemy.x,
          z: enemy.z,
          gold: enemy.gold,
          elite: enemy.elite,
          item,
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
          (ally.id === "Bram" ? 0.6 : 1) *
          (allies.some(
            (a) =>
              a.id === "Aldric" &&
              a.active &&
              a.hp > 0 &&
              distance(a, ally) < 5,
          )
            ? 0.8
            : 1) *
          (ally.id === "hero"
            ? (1 - stats.armor / 100) *
              (1 - (state.skills.ironSkin || 0) * 0.08)
            : 1) *
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
    if (
      !enemy ||
      enemy.hp <= 0 ||
      distance(hero, enemy) >
        (cleave ? 3.1 + (state.skills.wideArc || 0) * 0.6 : 2)
    )
      return false;
    if (cleave && mana < 8) return false;
    hero.cooldown = cleave ? 0.8 : 0.55;
    if (cleave) mana -= 8;
    const damage =
      stats.damage +
      (state.skills.lastStand && hero.hp < hero.maxHp * 0.4 ? 15 : 0);
    if (cleave)
      enemies
        .filter(
          (e) =>
            e.hp > 0 &&
            distance(hero, e) < 3.1 + (state.skills.wideArc || 0) * 0.6,
        )
        .forEach((e) =>
          hurtEnemy(
            e,
            damage * (1.5 + (state.skills.wideArc || 0) * 0.15),
            "hero",
          ),
        );
    else hurtEnemy(enemy, damage, "hero");
    emit({ type: "swing", id: "hero", target: enemy.id, cleave });
    return true;
  }
  function refreshStats(restore = false) {
    stats = heroStats(state);
    allies.forEach((a) => {
      const max =
        a.id === "hero"
          ? stats.life
          : COMPANIONS[a.id].hp + (stats.level - 1) * 12;
      const gain = max - a.maxHp;
      a.maxHp = max;
      a.hp = restore ? max : Math.min(max, Math.max(0, a.hp + gain));
    });
    mana = restore ? stats.mana : Math.min(mana, stats.mana);
  }
  refreshStats(true);
  const api = {
    refreshStats,
    get stats() {
      return stats;
    },
    allies,
    enemies,
    drops,
    get mana() {
      return mana;
    },
    get guard() {
      return guard;
    },
    get cleaveQueued() {
      return queuedCleave;
    },
    get cooldowns() {
      return {
        attack: hero.cooldown,
        guard: guardCooldown,
        rally: rallyCooldown,
      };
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
      queuedCleave = false;
      target = null;
      hero.order = null;
    },
    rally() {
      queuedCleave = false;
      regroupTime = 3;
      if (state.skills.battleCry && rallyCooldown <= 0 && mana >= 15) {
        mana -= 15;
        rallyCooldown = 12;
        allies
          .filter((a) => a.active && a.hp > 0)
          .forEach((a) => {
            a.hp = Math.min(a.maxHp, a.hp + 25);
          });
        emit({ type: "heal", id: "hero" });
      }
      target = null;
      allies.forEach((a) => (a.order = null));
    },
    cleave() {
      const enemy = enemies
        .filter((e) => e.hp > 0)
        .sort((a, b) => distance(hero, a) - distance(hero, b))[0];
      if (
        !hero.hp ||
        mana < 8 ||
        !enemy ||
        distance(hero, enemy) > 3.1 + (state.skills.wideArc || 0) * 0.6
      )
        return false;
      if (hero.cooldown > 0) {
        queuedCleave = true;
        return true;
      }
      queuedCleave = false;
      return attack(enemy, true);
    },
    defend() {
      if (mana < 10 || guardCooldown > 0 || !hero.hp) return false;
      mana -= 10;
      guard = 3 + (state.skills.bulwark || 0);
      guardCooldown = 8;
      emit({ type: "guard", id: "hero", duration: guard });
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
        a.specialCooldown = 0;
        a.order = null;
      });
      refreshStats(true);
      guard = 0;
      guardCooldown = 0;
      rallyCooldown = 0;
      dead = false;
      queuedCleave = false;
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
        ally.specialCooldown = Math.max(0, (ally.specialCooldown || 0) - dt);
        ally.order = null;
      }
      if (dead) return;
      mana = Math.min(stats.mana, mana + dt * stats.regen);
      guard = Math.max(0, guard - dt);
      guardCooldown = Math.max(0, guardCooldown - dt);
      rallyCooldown = Math.max(0, rallyCooldown - dt);
      regroupTime = Math.max(0, regroupTime - dt);
      if (queuedCleave && hero.cooldown <= 0) {
        queuedCleave = false;
        const nearest = enemies
          .filter((e) => e.hp > 0)
          .sort((a, b) => distance(hero, a) - distance(hero, b))[0];
        attack(nearest, true);
      }
      const focused = enemies.find((e) => e.id === target && e.hp > 0);
      if (focused) {
        if (distance(hero, focused) > 1.7)
          hero.order = { x: focused.x, z: focused.z };
        attack(focused);
      }
      for (const ally of allies.slice(1)) {
        if (!ally.active || !ally.hp) continue;
        const spec = COMPANIONS[ally.id],
          bonus = (stats.level - 1) * 2;
        if (ally.id === "Eira" && ally.specialCooldown <= 0) {
          const wounded = allies
            .filter(
              (a) =>
                a.active &&
                a.hp > 0 &&
                a.hp < a.maxHp * 0.82 &&
                distance(a, ally) < 9,
            )
            .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
          if (wounded) {
            wounded.hp = Math.min(
              wounded.maxHp,
              wounded.hp + 22 + stats.level * 3,
            );
            ally.specialCooldown = 3.5;
            emit({ type: "heal", id: wounded.id, source: ally.id });
          }
        }
        if (regroupTime > 0) continue;
        const near = enemies
          .filter((e) => e.hp > 0 && distance(hero, e) < 9)
          .sort((a, b) => distance(ally, a) - distance(ally, b));
        const enemy =
          focused && distance(hero, focused) < 10 ? focused : near[0];
        if (!enemy) continue;
        if (
          ally.id === "Bram" &&
          ally.specialCooldown <= 0 &&
          near.some((e) => distance(e, ally) < 5)
        ) {
          near
            .filter((e) => distance(e, ally) < 5)
            .forEach((e) => {
              e.taunted = 3;
              e.taunter = ally.id;
            });
          ally.specialCooldown = 6;
          emit({ type: "special", id: ally.id, name: "Challenge" });
        }
        if (distance(ally, enemy) > spec.range) {
          if (!holding)
            ally.order = {
              x: enemy.x + (ally.id === "Nyx" ? 1 : 0),
              z: enemy.z + (ally.id === "Nyx" ? -1 : 0),
            };
          continue;
        }
        if (ally.cooldown > 0) continue;
        ally.cooldown = spec.cooldown;
        if (ally.specialCooldown <= 0 && ally.id === "Ilyra") {
          near
            .filter((e) => distance(e, ally) <= 7)
            .slice(0, 3)
            .forEach((e) => {
              hurtEnemy(e, spec.damage + bonus, ally.id);
              emit({ type: "swing", id: ally.id, target: e.id });
            });
          ally.specialCooldown = 4;
          emit({ type: "special", id: ally.id, name: "Volley" });
        } else if (ally.specialCooldown <= 0 && ally.id === "Soren") {
          const center = { x: enemy.x, z: enemy.z };
          enemies
            .filter((e) => e.hp > 0 && distance(e, center) < 3.5)
            .forEach((e) => {
              e.slow = 3;
              hurtEnemy(e, 14 + bonus, ally.id);
            });
          ally.specialCooldown = 6;
          emit({
            type: "special",
            id: ally.id,
            target: enemy.id,
            name: "Frostburst",
          });
          emit({ type: "swing", id: ally.id, target: enemy.id });
        } else if (ally.specialCooldown <= 0 && ally.id === "Nyx") {
          hurtEnemy(enemy, (spec.damage + bonus) * 2.8, ally.id);
          ally.specialCooldown = 4;
          emit({
            type: "special",
            id: ally.id,
            target: enemy.id,
            name: "Backstab",
          });
          emit({ type: "swing", id: ally.id, target: enemy.id });
        } else if (ally.specialCooldown <= 0 && ally.id === "Aldric") {
          hurtEnemy(
            enemy,
            (spec.damage + bonus) * (enemy.name === "Risen" ? 2 : 1.5),
            ally.id,
          );
          allies
            .filter((a) => a.active && a.hp > 0 && distance(a, ally) < 5)
            .forEach((a) => (a.hp = Math.min(a.maxHp, a.hp + 5 + stats.level)));
          ally.specialCooldown = 5;
          emit({
            type: "special",
            id: ally.id,
            target: enemy.id,
            name: "Holy strike",
          });
          emit({ type: "swing", id: ally.id, target: enemy.id });
        } else {
          hurtEnemy(enemy, spec.damage + bonus, ally.id);
          emit({ type: "swing", id: ally.id, target: enemy.id });
        }
      }
      for (const enemy of enemies) {
        if (enemy.hp <= 0) continue;
        enemy.cooldown = Math.max(0, enemy.cooldown - dt);
        enemy.slow = Math.max(0, enemy.slow - dt);
        enemy.taunted = Math.max(0, enemy.taunted - dt);
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
            emit({ type: "enemyAttack", id: enemy.id, target: enemy.victim });
            enemy.cooldown = enemy.elite ? 1.4 : 1;
          }
          continue;
        }
        const forced =
          enemy.taunted > 0
            ? allies.find((a) => a.id === enemy.taunter && a.active && a.hp > 0)
            : null;
        const victim =
          forced ||
          allies
            .filter((a) => a.active && a.hp > 0)
            .sort((a, b) => distance(a, enemy) - distance(b, enemy))[0];
        if (!victim) continue;
        const dist = distance(enemy, victim);
        if (dist > 8 && !enemy.engaged) continue;
        enemy.engaged = true;
        if (dist > 1.45) {
          const dx =
              ((victim.x - enemy.x) / dist) *
              enemy.speed *
              dt *
              (enemy.slow > 0 ? 0.45 : 1),
            dz =
              ((victim.z - enemy.z) / dist) *
              enemy.speed *
              dt *
              (enemy.slow > 0 ? 0.45 : 1);
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
            const result = addLoot(state, d.item);
            delete state.dropItems[d.id];
            if (
              d.item.itemId === "ashen_charm" &&
              !state.equipment.charm &&
              result === true
            ) {
              state.equipment.charm = d.item;
              state.inventory = state.inventory.filter(
                (i) => i.uid !== d.item.uid,
              );
              refreshStats();
            }
            if (state.lootTaken.length % 3 === 0) state.potions++;
            emit({
              type: "loot",
              gold: d.gold,
              charm: !!d.elite,
              item: ITEMS[d.item.itemId].name,
              sold: result === "sold",
            });
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
