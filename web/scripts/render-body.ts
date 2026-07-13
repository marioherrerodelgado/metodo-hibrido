/**
 * Rasteriza el mapa corporal a PNG para poder revisarlo con los ojos.
 * Usa el MISMO módulo de formas que la app, así lo que se revisa es
 * exactamente lo que se envía.
 *
 *   npx tsx scripts/render-body.ts body.png
 */
import sharp from "sharp";
import { BACK, FRONT, SILHOUETTE, VIEWBOX } from "../src/lib/body-shapes";
import type { MuscleGroup } from "../src/lib/types";

// LOAD_COLOR son variables CSS (cambian con el tema) y aquí escribimos
// atributos SVG, donde `var()` no se resuelve. Copia literal del tema oscuro
// tal y como está en globals.css.
const LOAD_COLOR: Record<0 | 1 | 2 | 3, string> = {
  0: "#23232a",
  1: "#3b82f6",
  2: "#f5c518",
  3: "#ef4444",
};

// Carga de ejemplo: una de cada nivel, para ver los cuatro colores a la vez.
const DEMO: Partial<Record<MuscleGroup, 0 | 1 | 2 | 3>> = {
  hombros: 1,
  pecho: 3,
  biceps: 2,
  triceps: 2,
  antebrazos: 0,
  core: 3,
  espalda: 3,
  gluteos: 3,
  cuadriceps: 1,
  isquios: 1,
  gemelos: 2,
};

// El borde oscuro separa zonas contiguas del mismo color: sin él, pecho y
// abdomen en rojo se funden en una única mancha ilegible.
const paint = (regions: typeof FRONT) =>
  regions
    .map((r) => {
      const color = LOAD_COLOR[DEMO[r.id] ?? 0];
      return `<g fill="${color}" stroke="#101014" stroke-width="1.6" stroke-linejoin="round">${r.d
        .map((d) => `<path d="${d}"/>`)
        .join("")}</g>`;
    })
    .join("");

const body = (regions: typeof FRONT) => `
  <g fill="#17171c" stroke="#2c2c34" stroke-width="1.1">
    ${SILHOUETTE.map((d) => `<path d="${d}"/>`).join("")}
  </g>
  ${paint(regions)}`;

const [, , out = "body.png"] = process.argv;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="440" viewBox="0 0 440 400">
  <rect width="440" height="400" fill="#08080a"/>
  <svg x="0" y="0" width="220" height="400" viewBox="${VIEWBOX}">${body(FRONT)}</svg>
  <svg x="220" y="0" width="220" height="400" viewBox="${VIEWBOX}">${body(BACK)}</svg>
</svg>`;

sharp(Buffer.from(svg))
  .png()
  .toFile(out)
  .then(() => console.log(`Escrito ${out}`));
