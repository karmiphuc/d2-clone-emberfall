// A deterministic clock keeps visual poses independent of frame rate and
// gameplay cooldowns. Holding formation stops feet, never an attack recovery.
export function advanceMotion(data, dt, moving = false, down = false) {
  data.moving = moving && !down;
  data.down = down;
  data.phase = (data.phase || 0) + dt * (data.moving ? 6 : 1);
  data.swing = down ? 0 : Math.max(0, (data.swing || 0) - dt);
}

export function motionPose(data, attackFrames = false) {
  if (data.down) return { clip: "idle", row: 0 };
  if (data.windup > 0 && attackFrames) return { clip: "attack", row: 2 };
  if (data.swing > 0 && attackFrames)
    return { clip: "attack", row: data.swing > 0.28 ? 2 : 3 };
  if (data.moving && !data.swing) {
    const stride = Math.floor(data.phase) % 4;
    return stride % 2
      ? { clip: "idle", row: 0 }
      : { clip: "walk", row: stride / 2 };
  }
  return { clip: "idle", row: 0 };
}
