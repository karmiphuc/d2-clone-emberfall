import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname, extname } from "node:path";

// The current Vite build is one JS bundle and one stylesheet. Inline both so
// testers can run the downloaded HTML without Node or a local server.
let html = await readFile("dist/index.html", "utf8");
const scripts = [
  ...html.matchAll(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g),
];
if (scripts.length !== 1)
  throw new Error(
    "Expected one application bundle; update the packager before publishing.",
  );
for (const match of scripts) {
  const scriptPath = resolve("dist", match[1]);
  let source = await readFile(scriptPath, "utf8");
  // Vite resolves 3D material URLs relative to the bundle. Inline those too.
  for (const asset of [
    ...source.matchAll(
      /new URL\("([^"\n]+\.(?:webp|png|jpg|bin))",import\.meta\.url\)\.href/g,
    ),
  ]) {
    const data = await readFile(resolve(dirname(scriptPath), asset[1]));
    source = source.replace(asset[0], () =>
      JSON.stringify(
        `data:${extname(asset[1]) === ".bin" ? "application/octet-stream" : "image/" + extname(asset[1]).slice(1)};base64,${data.toString("base64")}`,
      ),
    );
  }
  html = html.replace(
    match[0],
    () =>
      `<script type="module">${source.replace(/<\/script/gi, "<\\/script")}</script>`,
  );
}
for (const match of [
  ...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g),
]) {
  const cssPath = resolve("dist", match[1]);
  let css = await readFile(cssPath, "utf8");
  for (const asset of [
    ...css.matchAll(/url\((?:["']?)([^)"']+\.(?:webp|png|jpg))(?:["']?)\)/g),
  ]) {
    const data = await readFile(resolve(dirname(cssPath), asset[1]));
    css = css.replace(
      asset[0],
      () =>
        `url("data:image/${extname(asset[1]).slice(1)};base64,${data.toString("base64")}")`,
    );
  }
  html = html.replace(match[0], () => `<style>${css}</style>`);
}
html = html.replace(/<link[^>]*rel="icon"[^>]*>/g, "");
await mkdir("artifacts", { recursive: true });
await writeFile("artifacts/emberfall-playtest.html", html);
console.log("Packaged artifacts/emberfall-playtest.html");
