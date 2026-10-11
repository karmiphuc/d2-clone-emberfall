// Presentation only: inspecting a creature never changes the combat target.
export function combatFocus(enemies, hovered, selected, hero) {
  const visible = enemies.filter((e) => e.hp > 0 && !e.label?.hidden);
  return (
    visible.find((e) => e.id === hovered) ||
    visible
      .filter(
        (e) =>
          e.elite && e.engaged && Math.hypot(e.x - hero.x, e.z - hero.z) <= 12,
      )
      .sort(
        (a, b) =>
          Math.hypot(a.x - hero.x, a.z - hero.z) -
          Math.hypot(b.x - hero.x, b.z - hero.z),
      )[0] ||
    visible.find((e) => e.id === selected) ||
    null
  );
}

export function attackWarning(enemy) {
  return enemy.windup > 0
    ? Math.max(
        0,
        Math.min(
          1,
          1 - enemy.windup / (enemy.windupTotal || (enemy.elite ? 0.95 : 0.5)),
        ),
      )
    : 0;
}

export function createCombatFocus(element) {
  element.innerHTML = `<div class="target-heading"><span class="target-kind"></span><strong class="target-name"></strong><span class="target-life"></span></div><div class="target-health" role="progressbar" aria-label="Creature health" aria-valuemin="0"><i></i></div><div class="target-condition"></div><div class="target-warning" aria-hidden="true"><i></i></div>`;
  const name = element.querySelector(".target-name"),
    kind = element.querySelector(".target-kind"),
    life = element.querySelector(".target-life"),
    health = element.querySelector(".target-health"),
    condition = element.querySelector(".target-condition"),
    warning = element.querySelector(".target-warning i");
  return (enemy, camp) => {
    element.hidden = camp || !enemy;
    if (element.hidden) return;
    element.dataset.enemy = enemy.id;
    element.classList.toggle("elite", !!enemy.elite);
    element.classList.toggle("winding", enemy.windup > 0);
    name.textContent = enemy.name;
    kind.textContent = enemy.questBoss
      ? "QUEST BOSS"
      : enemy.boss
        ? "BOSS"
        : enemy.champion
          ? "CHAMPION"
          : enemy.elite
            ? "ELITE"
            : "HOSTILE";
    life.textContent = `${Math.ceil(enemy.hp)} / ${enemy.maxHp}`;
    health.setAttribute("aria-valuemax", enemy.maxHp);
    health.setAttribute("aria-valuenow", Math.ceil(enemy.hp));
    health.querySelector("i").style.width =
      `${Math.max(0, Math.min(100, (enemy.hp / enemy.maxHp) * 100))}%`;
    const statuses = [];
    if (enemy.windup > 0)
      statuses.push(
        `${enemy.behavior === "ember" ? "Ember bolt" : enemy.elite ? "Committed strike" : "Strike"} → ${enemy.victim === "hero" ? "You" : enemy.victim || "Company"} · move clear`,
      );
    else if (enemy.recovery > 0 && enemy.elite)
      statuses.push("Recovering · strike now");
    else if (enemy.engaged) statuses.push("In combat");
    else statuses.push("Unaware");
    if (enemy.enraged) statuses.push("Enraged");
    if (enemy.champion) statuses.push("Armored · 25% protection");
    if (enemy.slow > 0) statuses.push("Chilled");
    if (enemy.taunted > 0)
      statuses.push(`Challenged by ${enemy.taunter || "Bram"}`);
    condition.textContent = statuses.join(" · ");
    warning.style.width = `${attackWarning(enemy) * 100}%`;
  };
}
