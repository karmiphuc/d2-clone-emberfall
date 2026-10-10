// Consume the complete tick's travel budget, including short waypoint segments.
// Moving remains true on a tick that reaches a node, even the final node.
export function stepWaypoints(position, path, distance) {
  let remaining = distance,
    travel = 0,
    heading = null;
  while (path.length && remaining > 1e-8) {
    const target = path[0],
      dx = target.x - position.x,
      dz = target.z - position.z;
    const length = Math.hypot(dx, dz);
    if (length < 1e-8) {
      path.shift();
      continue;
    }
    const step = Math.min(length, remaining);
    position.x += (dx / length) * step;
    position.z += (dz / length) * step;
    heading = Math.atan2(dx, dz);
    remaining -= step;
    travel += step;
    if (step >= length - 1e-8) path.shift();
  }
  return { moving: travel > 1e-8, travel, heading };
}
