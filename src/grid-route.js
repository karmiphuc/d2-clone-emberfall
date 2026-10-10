// A* with a binary heap: larger worlds must not sort the entire frontier per node.
export function gridRoute(start, end, bounds, blocked, step = 0.65) {
  const width = Math.floor((bounds.maxX - bounds.minX) / step) + 1;
  const depth = Math.floor((bounds.maxZ - bounds.minZ) / step) + 1;
  const point = (key) => ({
    x: bounds.minX + (key % width) * step,
    z: bounds.minZ + Math.floor(key / width) * step,
  });
  const cell = (p) =>
    Math.max(0, Math.min(width - 1, Math.round((p.x - bounds.minX) / step))) +
    Math.max(0, Math.min(depth - 1, Math.round((p.z - bounds.minZ) / step))) *
      width;
  const isBlocked = (key) => {
    const p = point(key);
    return blocked(p.x, p.z);
  };
  const begin = cell(start);
  let goal = cell(end);
  if (isBlocked(goal)) {
    let best = Infinity;
    for (let k = 0; k < width * depth; k++) {
      const p = point(k),
        d = (p.x - end.x) ** 2 + (p.z - end.z) ** 2;
      if (d < best && !isBlocked(k)) {
        goal = k;
        best = d;
      }
    }
    if (best === Infinity) return [];
  }
  const gx = goal % width,
    gz = Math.floor(goal / width);
  const heap = [],
    scores = new Map([[begin, 0]]),
    parents = new Map(),
    closed = new Set();
  function push(k, g) {
    const node = {
      k,
      g,
      f: g + Math.hypot((k % width) - gx, Math.floor(k / width) - gz),
    };
    let i = heap.length;
    heap.push(node);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p].f <= node.f) break;
      heap[i] = heap[p];
      i = p;
    }
    heap[i] = node;
  }
  function pop() {
    const first = heap[0],
      last = heap.pop();
    if (heap.length) {
      let i = 0;
      while (i * 2 + 1 < heap.length) {
        let c = i * 2 + 1;
        if (c + 1 < heap.length && heap[c + 1].f < heap[c].f) c++;
        if (last.f <= heap[c].f) break;
        heap[i] = heap[c];
        i = c;
      }
      heap[i] = last;
    }
    return first;
  }
  push(begin, 0);
  while (heap.length) {
    const { k, g } = pop();
    if (closed.has(k) || g !== scores.get(k)) continue;
    if (k === goal) {
      const out = [];
      let q = k;
      while (q !== begin) {
        out.push(point(q));
        q = parents.get(q);
      }
      return out.reverse();
    }
    closed.add(k);
    const x = k % width,
      z = Math.floor(k / width);
    for (const [dx, dz] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1],
    ]) {
      const nx = x + dx,
        nz = z + dz,
        next = nx + nz * width;
      if (
        nx < 0 ||
        nz < 0 ||
        nx >= width ||
        nz >= depth ||
        closed.has(next) ||
        isBlocked(next)
      )
        continue;
      if (dx && dz && (isBlocked(nx + z * width) || isBlocked(x + nz * width)))
        continue;
      const cost = g + (dx && dz ? Math.SQRT2 : 1);
      if (cost < (scores.get(next) ?? Infinity)) {
        scores.set(next, cost);
        parents.set(next, k);
        push(next, cost);
      }
    }
  }
  return [];
}
