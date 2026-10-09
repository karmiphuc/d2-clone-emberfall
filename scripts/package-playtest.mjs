import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

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
  const source = await readFile(resolve("dist", match[1]), "utf8");
  html = html.replace(
    match[0],
    () =>
      `<script type="module">${source.replace(/<\/script/gi, "<\\/script")}</script>`,
  );
}
for (const match of [
  ...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g),
]) {
  const css = await readFile(resolve("dist", match[1]), "utf8");
  html = html.replace(match[0], () => `<style>${css}</style>`);
}
html = html.replace(/<link[^>]*rel="icon"[^>]*>/g, "");
await mkdir("artifacts", { recursive: true });
await writeFile("artifacts/emberfall-playtest.html", html);
console.log("Packaged artifacts/emberfall-playtest.html");
