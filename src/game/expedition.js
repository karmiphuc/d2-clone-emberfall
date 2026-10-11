// Quest credit is permanent; population and drops belong to an expedition.
export const RESPAWN_SECONDS = 90;
export const questKills = (progress) => [
  ...new Set([...(progress.questKills || []), ...progress.defeated]),
];
export function recordKill(progress, id) {
  progress.questKills = [...new Set([...questKills(progress), id])];
}
export function replenish(progress, encounter) {
  if (
    encounter.questBoss ||
    !progress.defeated.includes(encounter.id) ||
    !progress.lootTaken.includes(encounter.id)
  )
    return false;
  recordKill(progress, encounter.id);
  progress.defeated = progress.defeated.filter((id) => id !== encounter.id);
  progress.lootTaken = progress.lootTaken.filter((id) => id !== encounter.id);
  delete progress.dropLocations[encounter.id];
  delete progress.dropItems[encounter.id];
  progress.spawnCounts ||= {};
  progress.spawnCounts[encounter.id] =
    (progress.spawnCounts[encounter.id] || 0) + 1;
  return true;
}
