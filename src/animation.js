// Movement is distance-driven in the world; previews use the same stride at
// a nominal speed. Impact holds affect presentation only, never the simulation.
export function advanceMotion(data, dt, moving = false, down = false) {
  data.moving = moving && !down;
  data.down = down;
  data.idleTime = (data.idleTime || 0) + dt;
  if (data.moving) {
    const distance = data.travelDistance ?? dt * 4;
    data.phase =
      (data.phase || 0) +
      (data.gaitFrames
        ? (distance / (data.strideLength || 2.4)) * data.gaitFrames
        : dt * 6);
  }
  const hold = Math.min(dt, data.impactHold || 0);
  data.impactHold = Math.max(0, (data.impactHold || 0) - dt);
  data.swing = down ? 0 : Math.max(0, (data.swing || 0) - (dt - hold));
}

export function motionPose(data, attackFrames = false) {
  if (data.down) return { clip: "idle", row: 0 };
  if (data.detailedMotion && data.swing > 0) {
    const duration = data.attackDuration || 0.55,
      windup = data.attackWindup ?? 0.16;
    const elapsed = Math.max(0, duration - data.swing);
    const recovery = (elapsed - windup) / Math.max(0.01, duration - windup);
    const row =
      elapsed < windup * 0.5
        ? 0
        : elapsed < windup
          ? 1
          : recovery < 0.2
            ? 2
            : recovery < 0.47
              ? 3
              : recovery < 0.76
                ? 4
                : 5;
    return { clip: "attack", row };
  }
  if (data.windup > 0 && attackFrames) return { clip: "attack", row: 2 };
  if (data.swing > 0 && attackFrames) {
    const transition = data.attackSequence === "release-recover" ? 0.13 : 0.28;
    return { clip: "attack", row: data.swing > transition ? 2 : 3 };
  }
  if (data.moving && !data.swing)
    return {
      clip: "walk",
      row: Math.floor(data.phase || 0) % (data.gaitFrames || 2),
    };
  return { clip: "idle", row: 0 };
}

// Hysteresis prevents left/right pose chatter along a quadrant boundary.
export function facingColumn(x, y, previous) {
  let right = x >= 0,
    back = y > 0;
  if (previous !== undefined) {
    if (Math.abs(x) < 0.14) right = previous === 0 || previous === 3;
    if (Math.abs(y) < 0.14) back = previous >= 2;
  }
  return back ? (right ? 3 : 2) : right ? 0 : 1;
}
