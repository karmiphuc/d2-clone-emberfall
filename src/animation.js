import { updateWalkVariant } from "./action-variants.js";
// Movement is distance-driven in the world; previews use the same stride at
// a nominal speed. Impact holds affect presentation only, never the simulation.
export function advanceMotion(data, dt, moving = false, down = false) {
  const wasMoving = data.moving,
    previousPhase = data.phase;
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
  updateWalkVariant(data, wasMoving, previousPhase);
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

// Baked sprite sequences contain the intermediate silhouettes already. Sampling
// adjacent frames is cheap and keeps presentation continuous above atlas cadence.
export function sequenceFrames(data, attackFrames = false) {
  const pose = motionPose(data, attackFrames);
  let position = 0,
    count = 1;
  if (pose.clip === "walk") {
    count = data.gaitFrames || 16;
    position = (data.phase || 0) % count;
  } else if (pose.clip === "attack" && data.detailedMotion) {
    count = 33;
    const duration = data.attackDuration || 0.55,
      windup = data.attackWindup ?? 0.16;
    const recovery = duration - windup;
    const times = [
      0,
      windup * 0.5,
      windup * 0.78,
      windup,
      windup + recovery * 0.1,
      windup + recovery * 0.2,
      windup + recovery * 0.47,
      windup + recovery * 0.76,
      duration,
    ];
    const elapsed = Math.max(0, duration - data.swing);
    let segment = 0;
    while (segment < 7 && elapsed >= times[segment + 1]) segment++;
    position = Math.min(
      32,
      segment * 4 +
        Math.max(
          0,
          Math.min(
            1,
            (elapsed - times[segment]) / (times[segment + 1] - times[segment]),
          ),
        ) *
          4,
    );
  } else if (pose.clip === "attack") {
    count = 17;
    position =
      data.windup > 0
        ? 0
        : Math.min(
            16,
            Math.max(0, 1 - data.swing / (data.attackDuration || 0.26)) * 16,
          );
  }
  const row = Math.floor(position);
  return {
    clip: pose.clip,
    row,
    next:
      pose.clip === "walk" ? (row + 1) % count : Math.min(count - 1, row + 1),
    mix: position - row,
  };
}
