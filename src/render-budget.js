// Pixel resolution adapts slowly; simulation and CSS/UI resolution stay fixed.
export function createRenderBudget(maximum = 1.25) {
  let ratio = maximum,
    slow = 0,
    fast = 0;
  return {
    get ratio() {
      return ratio;
    },
    reset(cap) {
      maximum = cap;
      ratio = cap;
      slow = fast = 0;
      return ratio;
    },
    tick(dt) {
      if (dt <= 0 || dt > 0.2) {
        slow = fast = 0;
        return ratio;
      }
      if (dt > 1 / 40) {
        slow += dt;
        fast = 0;
      } else if (dt < 1 / 55) {
        fast += dt;
        slow = Math.max(0, slow - dt);
      } else {
        fast = 0;
        slow = Math.max(0, slow - dt);
      }
      if (slow > 2.4) {
        ratio = Math.max(Math.min(0.65, maximum), ratio * 0.85);
        slow = fast = 0;
      }
      if (fast > 6) {
        ratio = Math.min(maximum, ratio + 0.1);
        slow = fast = 0;
      }
      return ratio;
    },
  };
}
