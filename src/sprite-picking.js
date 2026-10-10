// Raycasting a Sprite normally hits its entire rectangle. Test the current
// atlas frame's alpha so empty cape/weapon margins remain walkable ground.
const masks = new WeakMap();
export function visibleSpriteHit(hit) {
  const map = hit.object.material?.map,
    source = map?.image;
  if (!hit.object.isSprite || !map || !source?.complete || !hit.uv) return true;
  let mask = masks.get(source);
  if (!mask) {
    const scale = Math.min(1, 512 / Math.max(source.width, source.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const alpha = new Uint8Array(canvas.width * canvas.height);
    for (let i = 0; i < alpha.length; i++) alpha[i] = rgba[i * 4 + 3];
    mask = { width: canvas.width, height: canvas.height, alpha };
    masks.set(source, mask);
  }
  map.updateMatrix();
  const uv = map.transformUv(hit.uv.clone());
  const x = Math.min(
    mask.width - 1,
    Math.max(0, Math.floor(uv.x * mask.width)),
  );
  const y = Math.min(
    mask.height - 1,
    Math.max(0, Math.floor(uv.y * mask.height)),
  );
  return mask.alpha[y * mask.width + x] > 64;
}
