import { chromium } from "@playwright/test";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const stage = resolve(process.argv[2]);
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    let file;
    if (pathname === "/") file = resolve(root, "scripts/rigged/baker.html");
    else if (pathname.startsWith("/node_modules/"))
      file = resolve(root, "." + pathname);
    else file = resolve(stage, "." + pathname);
    if (
      !file.startsWith(stage + "/") &&
      !file.startsWith(root + "/node_modules/") &&
      pathname !== "/"
    )
      throw Error("Invalid path");
    const data = await readFile(file);
    res.writeHead(200, {
      "Content-Type":
        {
          ".html": "text/html",
          ".js": "text/javascript",
          ".glb": "model/gltf-binary",
        }[extname(file)] || "application/octet-stream",
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--no-sandbox", "--enable-unsafe-swiftshader"],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.waitForFunction(() => window.ready);
  const source = await page.evaluate(() => window.ready);
  const output = resolve(root, "assets/rigged");
  await mkdir(output, { recursive: true });
  const report = {
    source,
    cell: 256,
    worldStride: source.strideModel * 1.4,
    actors: [],
  };
  for (const [role, weapon, directions] of [
    ["hero", "longsword", 16],
    ["hero", "hand_axe", 16],
    ["Bram", "mace", 8],
  ]) {
    const result = await page.evaluate(
      async (args) => window.bakeSet(...args),
      [role, weapon, directions],
    );
    const name = `${role.toLowerCase()}-${weapon}`;
    await writeFile(
      resolve(output, name + ".webp"),
      Buffer.from(result.image.split(",")[1], "base64"),
    );
    await writeFile(
      resolve(output, name + ".json"),
      JSON.stringify(result.metadata) + "\n",
    );
    report.actors.push({ role, weapon, directions, walkTrace: result.trace });
    console.log(
      `${name}: ${result.metadata.width} × ${result.metadata.height}, 48 walk frames`,
    );
  }
  if (errors.length) throw Error(errors.join("\n"));
  await writeFile(
    resolve(stage, "bake-report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    `Calibrated full-cycle travel: ${report.worldStride.toFixed(6)} world units`,
  );
} finally {
  await browser.close();
  server.close();
}
