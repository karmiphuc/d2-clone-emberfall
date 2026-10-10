// Shuffle complete action sets. No per-frame randomness and no gameplay RNG.
export function chooseActionVariant(data, action, random = Math.random) {
  const count = data.variantCount || 1;
  const field = `${action}Variant`,
    bagField = `${action}VariantBag`;
  if (count < 2) return (data[field] = 0);
  let bag = data[bagField];
  if (!bag?.length) {
    bag = Array.from({ length: count }, (_, i) => i);
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    // First draw after refill cannot repeat the previous completed action.
    if (bag.at(-1) === data[field])
      [bag[0], bag[count - 1]] = [bag[count - 1], bag[0]];
    data[bagField] = bag;
  }
  return (data[field] = bag.pop());
}

export function beginAttackVariant(data, winding = false) {
  // Enemy release continues its already-selected windup; duplicate combat
  // notifications must not pick another pose set halfway through a strike.
  if (!(data.swing > 0) && !data.variantWindup)
    chooseActionVariant(data, "attack");
  data.variantWindup = winding;
}

export function updateWalkVariant(data, wasMoving, previousPhase) {
  if (!data.moving || data.swing > 0 || data.windup > 0 || data.down) return;
  const cycle = Math.floor((data.phase || 0) / (data.gaitFrames || 16));
  const before = Math.floor((previousPhase || 0) / (data.gaitFrames || 16));
  if (!wasMoving || cycle !== before) {
    data.previousWalkVariant = data.walkVariant || 0;
    chooseActionVariant(data, "walk");
    data.walkVariantCycle = cycle;
  }
}

// A physical tick may cross the seam while the display is still interpolating
// the last part of the previous stride. Keep its original bank until display wrap.
export function renderedActionVariant(data, clip, phase) {
  if (
    clip === "walk" &&
    data.walkVariantCycle !== undefined &&
    Math.floor(phase / (data.gaitFrames || 16)) < data.walkVariantCycle
  )
    return data.previousWalkVariant || 0;
  return data[`${clip}Variant`] || 0;
}
