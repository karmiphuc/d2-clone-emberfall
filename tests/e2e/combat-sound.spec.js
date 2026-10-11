import { test, expect } from "@playwright/test";

test("sound is opt-in, resumes after muting and clears transient voices", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Native = window.AudioContext;
    window.AudioContext = class extends Native {
      constructor(...args) {
        super(...args);
        window.testAudio = this;
      }
    };
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/", { waitUntil: "networkidle" });
  const button = page.getByRole("button", {
    name: "Toggle sound",
    exact: true,
  });
  await expect(button).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => !!window.testAudio)).toBe(false);
  await button.click();
  await expect(button).toHaveText("Sound: On");
  expect(await page.evaluate(() => testAudio.state)).toBe("running");
  // Exercise actual Web Audio nodes, including immediate mute during contact.
  await page.evaluate(async () => {
    const { createCombatAudio } = await import("/src/combat-audio.js");
    const play = createCombatAudio(testAudio);
    play({ type: "hit", heavy: true });
    play({ type: "heal" });
    play.clear();
  });
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "false");
  expect(await page.evaluate(() => testAudio.state)).toBe("suspended");
  await button.click();
  await expect(button).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => testAudio.state)).toBe("running");
  expect(errors).toEqual([]);
});
