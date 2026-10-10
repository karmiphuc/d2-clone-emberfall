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

// A continuous sample between authored poses; gameplay still uses discrete
// contact events. The renderer warps corresponding pixels before blending.
export function motionFrames(data, attackFrames = false) {
  const pose = motionPose(data, attackFrames);
  if (pose.clip === "walk") {
    const phase = data.phase || 0;
    return {
      ...pose,
      next: (pose.row + 1) % (data.gaitFrames || 2),
      mix: phase - Math.floor(phase),
    };
  }
  if (pose.clip === "attack" && data.detailedMotion) {
    const duration = data.attackDuration || 0.55,
      windup = data.attackWindup ?? 0.16;
    const recovery = duration - windup;
    const times = [
      0,
      windup * 0.5,
      windup,
      windup + recovery * 0.2,
      windup + recovery * 0.47,
      windup + recovery * 0.76,
      duration,
    ];
    const elapsed = duration - data.swing;
    const row = pose.row;
    return {
      ...pose,
      next: Math.min(5, row + 1),
      mix:
        row === 5
          ? 0
          : Math.max(
              0,
              Math.min(
                1,
                (elapsed - times[row]) / (times[row + 1] - times[row]),
              ),
            ),
    };
  }
  if (
    pose.clip === "attack" &&
    data.attackSequence === "release-recover" &&
    pose.row === 2
  )
    return {
      ...pose,
      next: 3,
      mix: Math.max(0, Math.min(1, (0.26 - data.swing) / 0.13)),
    };
  return { ...pose, next: pose.row, mix: 0 };
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
