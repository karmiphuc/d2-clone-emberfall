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
    if (pathname === "/")
      file = resolve(root, "scripts/rigged/cast-baker.html");
    else if (pathname === "/cast-profiles.js")
      file = resolve(root, "scripts/rigged/cast-profiles.js");
    else if (pathname.startsWith("/node_modules/"))
      file = resolve(root, "." + pathname);
    else file = resolve(stage, "." + pathname);
    if (
      !file.startsWith(stage + "/") &&
      !file.startsWith(root + "/node_modules/") &&
      pathname !== "/" &&
      pathname !== "/cast-profiles.js"
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
  const output = resolve(root, "assets/rigged");
  await mkdir(output, { recursive: true });
  const roles = process.argv.slice(3);
  const cast = roles.length
    ? roles
    : [
        "Ilyra",
        "Eira",
        "Soren",
        "Aldric",
        "Nyx",
        "Fallen",
        "Risen",
        "Brute",
        "Gravewarden",
        "AldricMace",
      ];
  const report = { actors: [] };
  for (const role of cast) {
    const source = await page.evaluate(
      async (role) => window.review(role),
      role,
    );
    console.log(
      role,
      JSON.stringify({
        stride: source.stride,
        strideVector: source.strideVector,
        animations: source.animations,
      }),
    );
    await writeFile(
      resolve(stage, role + "-contact-probe.json"),
      JSON.stringify(await page.evaluate(() => window.contactTrace()), null, 2),
    );
    const review = resolve(stage, "review");
    await mkdir(review, { recursive: true });
    for (const [clip, phase] of [
      ["idle", 0],
      ["walk", 0],
      ["walk", 0.25],
      ["walk", 0.5],
      ["walk", 0.75],
      ["attack", 0],
      ["attack", 0.5],
      ["attack", 1],
      ...(role === "Brute" ||
      role === "Gravewarden" ||
      role === "Fallen" ||
      role === "Risen"
        ? [
            ["windup", 0.5],
            ["death", 0.9],
          ]
        : []),
    ]) {
      const png = await page.evaluate(
        ({ clip, phase }) => window.draw(clip, phase),
        { clip, phase },
      );
      await writeFile(
        resolve(review, role + "-" + clip + "-" + phase + ".png"),
        Buffer.from(png.split(",")[1], "base64"),
      );
    }
    if (process.env.REVIEW_ONLY) continue;
    const result = await page.evaluate(
      async (role) => window.bakeSet(role),
      role,
    );
    const name = role.toLowerCase();
    await writeFile(
      resolve(output, name + ".webp"),
      Buffer.from(result.image.split(",")[1], "base64"),
    );
    await writeFile(
      resolve(output, name + ".json"),
      JSON.stringify(result.metadata) + "\n",
    );
    report.actors.push({
      role,
      source,
      metadata: { ...result.metadata, clips: undefined },
      trace: result.trace,
    });
    console.log(
      name + ": " + result.metadata.width + " x " + result.metadata.height,
    );
  }
  if (errors.length) throw Error(errors.join("\n"));
  await writeFile(
    resolve(stage, "cast-bake-report.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
} finally {
  await browser.close();
  server.close();
}
