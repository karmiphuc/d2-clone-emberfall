// Shared by simulation events and presentation. Flight is targeted, not ballistic.
export function flightSeconds(from, to) {
  return Math.min(
    0.22,
    Math.max(0.08, Math.hypot(to.x - from.x, to.z - from.z, 0.2) / 36),
  );
}
