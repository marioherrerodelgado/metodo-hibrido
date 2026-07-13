/**
 * Capturas de la app en claro y oscuro, para revisar el diseño con los ojos
 * en vez de suponer que los tokens han quedado bien.
 *
 *   npx tsx scripts/shots.ts http://localhost:3118 ./shots
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const [, , base = "http://localhost:3118", outDir = "shots"] = process.argv;

const PAGES: [string, string][] = [
  ["landing", "/"],
  ["login", "/login"],
  ["onboarding", "/onboarding"],
  ["timer", "/herramientas/timer"],
  ["zapatillas", "/herramientas/zapatillas"],
];

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();

  for (const theme of ["light", "dark"] as const) {
    const ctx = await browser.newContext({
      viewport: { width: 420, height: 900 },
      deviceScaleFactor: 2,
    });
    // Fijamos la preferencia antes de que cargue la app, igual que haría el
    // usuario con el interruptor del perfil.
    await ctx.addInitScript(
      `try{ localStorage.setItem("mh-theme", "${theme}"); }catch(e){}`,
    );
    const page = await ctx.newPage();

    for (const [name, route] of PAGES) {
      await page.goto(base + route, { waitUntil: "networkidle" });
      await page.waitForTimeout(700); // deja terminar las animaciones de entrada
      const file = path.join(outDir, `${name}-${theme}.png`);
      await page.screenshot({ path: file });
      console.log(`  ${file}`);
    }
    await ctx.close();
  }

  await browser.close();
}

main();
