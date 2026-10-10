// Distances are world metres. Separate arrival/start thresholds prevent a
// settled companion from continuously restarting its walk loop.
export function turnToward(current, target, amount) {
  const delta = Math.atan2(
    Math.sin(target - current),
    Math.cos(target - current),
  );
  return current + Math.max(-amount, Math.min(amount, delta));
}

export function companionPace(id, distance, current, dt) {
  const base =
    id === "Nyx" ? 5.2 : id === "Bram" || id === "Aldric" ? 4.3 : 4.5;
  const catchup = Math.min(1.6, Math.max(0, distance - 3) * 0.28);
  const target = Math.min(base + catchup, Math.max(0, distance) * 5);
  return current + (target - current) * (1 - Math.exp(-dt * 12));
}

export function needsFollowRoute(state, position, target, pursuing = false) {
  const gap = Math.hypot(target.x - position.x, target.z - position.z);
  if (!pursuing && gap < 0.4) {
    state.settled = true;
    return false;
  }
  if (!pursuing && state.settled && gap < 1.1) return false;
  state.settled = false;
  const changed =
    !state.goal ||
    Math.hypot(target.x - state.goal.x, target.z - state.goal.z) > 0.65;
  return changed || !state.hasPath;
}

export function formationDepth(id) {
  return id === "Bram" || id === "Aldric"
    ? 1.65
    : id === "Nyx"
      ? 2
      : id === "Eira"
        ? 3.1
        : 2.6;
}
