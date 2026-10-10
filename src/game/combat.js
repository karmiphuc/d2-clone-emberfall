import { COMPANIONS } from "./companions.js";
import {
  heroStats,
  companionStats,
  lootItem,
  addLoot,
  ITEMS,
} from "./items.js";
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
  let encounters = ENCOUNTERS,
    progress = state;
  const areaScale = 1 + Math.min(state.run, 3) * 0.22;
  const enemies = ENCOUNTERS.map((e) => ({
    ...e,
    maxHp: Math.round(e.hp * areaScale),
    hp: progress.defeated.includes(e.id) ? 0 : Math.round(e.hp * areaScale),
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
    .filter((e) => e.hp === 0 && !progress.lootTaken.includes(e.id))
    .map((e) => ({
      id: e.id,
      x: progress.dropLocations[e.id]?.x ?? e.x,
      z: progress.dropLocations[e.id]?.z ?? e.z,
      gold: e.gold,
      elite: e.elite,
      item:
        progress.dropItems[e.id] ||
        lootItem(
          state,
          e.id,
          encounters.findIndex((a) => a.id === e.id),
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
    queuedCleave = false,
    queuedTarget = null,
    pendingStrike = null;
  let automaticTarget = false,
    autoSuppressed = 0,
    movingHero = false;
  let enemyRoute = null;
  const clearLine = (a, b) => {
    if (!enemyRoute) return true;
    const steps = Math.ceil(distance(a, b) / 0.3);
    for (let i = 1; i < steps; i++)
      if (
        blocked(
          a.x + ((b.x - a.x) * i) / steps,
          a.z + ((b.z - a.z) * i) / steps,
        )
      )
        return false;
    return true;
  };
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
      if (!progress.defeated.includes(enemy.id)) {
        progress.defeated.push(enemy.id);
        progress.dropLocations[enemy.id] = { x: enemy.x, z: enemy.z };
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
          encounters.findIndex((e) => e.id === enemy.id),
          enemy.elite,
        );
        progress.dropItems[enemy.id] = item;
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
          complete: progress.defeated.length === encounters.length,
        });
      }
      if (target === enemy.id) target = null;
      if (queuedTarget === enemy.id) {
        queuedCleave = false;
        queuedTarget = null;
      }
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
          (ally.id !== "hero"
            ? 1 - companionStats(state, ally.id).armor / 100
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
    if (ally.id === "hero" && !target && !movingHero && autoSuppressed <= 0) {
      const attacker = enemies.find(
        (e) =>
          e.id === source &&
          e.hp > 0 &&
          distance(hero, e) <= 2 &&
          clearLine(hero, e),
      );
      if (attacker) {
        target = attacker.id;
        automaticTarget = true;
      }
    }
    if (!ally.hp) {
      ally.order = null;
      emit({ type: "down", id: ally.id });
    }
  }
  function attack(enemy, cleave = false) {
    if (hero.hp <= 0 || hero.cooldown > 0 || pendingStrike) return false;
    if (
      !enemy ||
      enemy.hp <= 0 ||
      distance(hero, enemy) >
        (cleave ? 3.1 + (state.skills.wideArc || 0) * 0.6 : 2) ||
      !clearLine(hero, enemy)
    )
      return false;
    if (cleave && mana < 8) return false;
    const duration = cleave ? 0.8 : 0.55,
      windup = cleave ? 0.22 : 0.16;
    hero.cooldown = duration;
    pendingStrike = {
      id: enemy.id,
      cleave,
      remaining: windup,
      duration,
      windup,
    };
    hero.order = null;
    emit({
      type: "prepare",
      id: "hero",
      target: enemy.id,
      cleave,
      duration,
      windup,
    });
    return true;
  }
  function releaseStrike(strike) {
    const enemy = enemies.find((e) => e.id === strike.id);
    const { cleave, duration, windup } = strike;
    if (
      !hero.hp ||
      !enemy?.hp ||
      distance(hero, enemy) >
        (cleave ? 3.1 + (state.skills.wideArc || 0) * 0.6 : 2.35) ||
      !clearLine(hero, enemy) ||
      (cleave && mana < 8)
    ) {
      emit({ type: "cancelStrike", id: "hero" });
      return;
    }
    if (cleave) mana -= 8;
    // The visible cut and damage share this contact event.
    emit({
      type: "swing",
      id: "hero",
      target: enemy.id,
      cleave,
      duration: duration - windup,
    });
    const damage =
      stats.damage +
      (state.skills.lastStand && hero.hp < hero.maxHp * 0.4 ? 15 : 0);
    if (cleave)
      enemies
        .filter(
          (e) =>
            e.hp > 0 &&
            clearLine(hero, e) &&
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
  }
  function refreshStats(restore = false) {
    stats = heroStats(state);
    allies.forEach((a) => {
      const max =
        a.id === "hero" ? stats.life : companionStats(state, a.id).life;
      const gain = max - a.maxHp;
      a.maxHp = max;
      a.hp = restore ? max : Math.min(max, Math.max(0, a.hp + gain));
    });
    mana = restore ? stats.mana : Math.min(mana, stats.mana);
  }
  refreshStats(true);
  const api = {
    setArea(nextEncounters, nextProgress, navigate = null) {
      encounters = nextEncounters;
      progress = nextProgress;
      enemyRoute = navigate;
      const scale = nextProgress === state ? areaScale : 1;
      enemies.splice(
        0,
        enemies.length,
        ...encounters.map((e) => ({
          ...e,
          maxHp: Math.round(e.hp * scale),
          hp: progress.defeated.includes(e.id) ? 0 : Math.round(e.hp * scale),
          damage: Math.round(
            e.damage *
              (nextProgress === state ? 1 + Math.min(state.run, 3) * 0.12 : 1),
          ),
          slow: 0,
          taunted: 0,
          taunter: null,
          cooldown: 0,
          windup: 0,
          victim: null,
          engaged: false,
        })),
      );
      drops.splice(
        0,
        drops.length,
        ...enemies
          .filter((e) => !e.hp && !progress.lootTaken.includes(e.id))
          .map((e) => ({
            id: e.id,
            x: progress.dropLocations[e.id]?.x ?? e.x,
            z: progress.dropLocations[e.id]?.z ?? e.z,
            gold: e.gold,
            elite: e.elite,
            item:
              progress.dropItems[e.id] ||
              lootItem(
                state,
                e.id,
                encounters.findIndex((a) => a.id === e.id),
                e.elite,
              ),
          })),
      );
      api.cancel();
      allies.forEach((a) => (a.order = null));
    },
    refreshStats,
    get stats() {
      return stats;
    },
    allies,
    enemies,
    drops,
    get preparing() {
      return pendingStrike ? { ...pendingStrike } : null;
    },
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
      if (enemies.some((e) => e.id === id && e.hp > 0)) {
        if (target !== id && pendingStrike) {
          emit({ type: "cancelStrike", id: "hero" });
          pendingStrike = null;
        }
        queuedCleave = false;
        queuedTarget = null;
        target = id;
        automaticTarget = false;
      }
    },
    cancel() {
      if (pendingStrike) emit({ type: "cancelStrike", id: "hero" });
      pendingStrike = null;
      queuedCleave = false;
      queuedTarget = null;
      target = null;
      hero.order = null;
      automaticTarget = false;
      autoSuppressed = 0.3;
    },
    rally() {
      api.cancel();
      queuedCleave = false;
      queuedTarget = null;
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
    cleave(targetId) {
      const enemy = targetId
        ? enemies.find((e) => e.id === targetId && e.hp > 0)
        : enemies
            .filter((e) => e.hp > 0)
            .sort((a, b) => distance(hero, a) - distance(hero, b))[0];
      if (!hero.hp || mana < 8 || !enemy) return false;
      const inRange =
        clearLine(hero, enemy) &&
        distance(hero, enemy) <= 3.1 + (state.skills.wideArc || 0) * 0.6;
      if (!targetId && !inRange) return false;
      if (targetId) {
        target = targetId;
        automaticTarget = false;
      }
      if (hero.cooldown > 0 || !inRange) {
        queuedCleave = true;
        queuedTarget = targetId || null;
        return true;
      }
      queuedCleave = false;
      queuedTarget = null;
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
      api.cancel();
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
      queuedTarget = null;
      target = null;
      enemies.forEach((e) => {
        e.windup = 0;
        e.victim = null;
        e.engaged = false;
      });
    },
    tick(dt, positions, holding = false, heroMoving = false) {
      movingHero = heroMoving;
      autoSuppressed = Math.max(0, autoSuppressed - dt);
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
      if (pendingStrike) {
        pendingStrike.remaining -= dt;
        if (pendingStrike.remaining <= 0.000001) {
          const strike = pendingStrike;
          pendingStrike = null;
          releaseStrike(strike);
        }
      }
      mana = Math.min(stats.mana, mana + dt * stats.regen);
      guard = Math.max(0, guard - dt);
      guardCooldown = Math.max(0, guardCooldown - dt);
      rallyCooldown = Math.max(0, rallyCooldown - dt);
      regroupTime = Math.max(0, regroupTime - dt);
      if (queuedCleave && hero.cooldown <= 0) {
        const nearest = queuedTarget
          ? enemies.find((e) => e.id === queuedTarget && e.hp > 0)
          : enemies
              .filter((e) => e.hp > 0)
              .sort((a, b) => distance(hero, a) - distance(hero, b))[0];
        const inRange =
          nearest &&
          clearLine(hero, nearest) &&
          distance(hero, nearest) <= 3.1 + (state.skills.wideArc || 0) * 0.6;
        if (!nearest || mana < 8 || inRange || !queuedTarget) {
          queuedCleave = false;
          queuedTarget = null;
          if (nearest && inRange) attack(nearest, true);
        }
      }
      let focused = enemies.find((e) => e.id === target && e.hp > 0);
      if (
        !pendingStrike &&
        automaticTarget &&
        (!focused || distance(hero, focused) > 2 || !clearLine(hero, focused))
      ) {
        target = null;
        focused = null;
        automaticTarget = false;
      }
      if (!focused && !pendingStrike && !heroMoving && autoSuppressed <= 0) {
        focused = enemies
          .filter(
            (e) => e.hp > 0 && distance(hero, e) <= 2 && clearLine(hero, e),
          )
          .sort((a, b) => distance(hero, a) - distance(hero, b))[0];
        if (focused) {
          target = focused.id;
          automaticTarget = true;
        }
      }
      if (focused && !pendingStrike) {
        if (
          !automaticTarget &&
          (distance(hero, focused) > 1.7 || !clearLine(hero, focused))
        )
          hero.order = { x: focused.x, z: focused.z };
        if (!queuedCleave) attack(focused);
      }
      for (const ally of allies.slice(1)) {
        if (!ally.active || !ally.hp) continue;
        const spec = COMPANIONS[ally.id],
          gear = companionStats(state, ally.id),
          bonus = gear.damage - spec.damage;
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
            wounded.hp = Math.min(wounded.maxHp, wounded.hp + gear.healing);
            ally.specialCooldown = 3.5;
            emit({ type: "heal", id: wounded.id, source: ally.id });
            // Healing is her action: don't immediately turn away to attack.
            ally.cooldown = Math.max(ally.cooldown, spec.cooldown);
            continue;
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
        if (distance(ally, enemy) > spec.range || !clearLine(ally, enemy)) {
          if (!holding)
            ally.order = {
              x: enemy.x + (ally.id === "Nyx" ? 1 : 0),
              z: enemy.z + (ally.id === "Nyx" ? -1 : 0),
            };
          continue;
        }
        if (ally.cooldown > 0) continue;
        ally.cooldown = spec.cooldown * gear.cooldownMultiplier;
        if (ally.specialCooldown <= 0 && ally.id === "Ilyra") {
          near
            .filter((e) => distance(e, ally) <= 7 && clearLine(ally, e))
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
            .filter(
              (e) =>
                e.hp > 0 && distance(e, center) < 3.5 && clearLine(ally, e),
            )
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
              clearLine(enemy, victim) &&
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
        if (!enemy.engaged && (dist > 8 || !clearLine(enemy, victim))) continue;
        enemy.engaged = true;
        if (dist > 1.45 || !clearLine(enemy, victim)) {
          let destination = victim;
          if (enemyRoute && !clearLine(enemy, victim)) {
            enemy.routeTimer = (enemy.routeTimer || 0) - dt;
            if (enemy.routeTimer <= 0 || !enemy.route?.length) {
              enemy.route = enemyRoute(enemy, victim);
              enemy.routeTimer = 0.7;
            }
            while (enemy.route.length && distance(enemy, enemy.route[0]) < 0.3)
              enemy.route.shift();
            destination = enemy.route[0] || enemy;
          }
          const travelDistance = Math.max(0.01, distance(enemy, destination));
          const dx =
              ((destination.x - enemy.x) / travelDistance) *
              enemy.speed *
              dt *
              (enemy.slow > 0 ? 0.45 : 1),
            dz =
              ((destination.z - enemy.z) / travelDistance) *
              enemy.speed *
              dt *
              (enemy.slow > 0 ? 0.45 : 1);
          if (!blocked(enemy.x + dx, enemy.z)) enemy.x += dx;
          if (!blocked(enemy.x, enemy.z + dz)) enemy.z += dz;
        } else if (enemy.cooldown <= 0) {
          enemy.windup = enemy.elite ? 0.95 : 0.5;
          enemy.victim = victim.id;
          emit({ type: "windup", id: enemy.id, target: victim.id });
        }
      }
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        if (distance(hero, d) < 2) {
          if (!progress.lootTaken.includes(d.id)) {
            progress.lootTaken.push(d.id);
            delete progress.dropLocations[d.id];
            state.gold += d.gold;
            if (d.elite) state.charm = true;
            const result = addLoot(state, d.item);
            delete progress.dropItems[d.id];
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
            if (progress.lootTaken.length % 3 === 0) state.potions++;
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
