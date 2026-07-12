/**
 * Genera los iconos de la PWA. Sin dependencias de diseño: el icono es la
 * marca en tipografía condensada sobre el negro de la app.
 *
 *   npx tsx scripts/gen-icons.ts
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const OUT = path.join(process.cwd(), "public");

const icon = (size: number, rounded: boolean) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#17171c"/>
      <stop offset="1" stop-color="#08080a"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="url(#g)"/>
  <rect x="0" y="436" width="512" height="76" fill="#ff4d17" opacity="${rounded ? 0 : 0}"/>
  <g fill="#f6f4f0" font-family="Arial Narrow, Arial, sans-serif" font-weight="700" text-anchor="middle">
    <text x="256" y="300" font-size="230" letter-spacing="-6">MH</text>
  </g>
  <rect x="150" y="336" width="212" height="14" rx="7" fill="#ff4d17"/>
</svg>`;

const targets: [string, number, boolean][] = [
  ["icon-192.png", 192, false],
  ["icon-512.png", 512, false],
  ["apple-icon.png", 180, true],
];

fs.mkdirSync(OUT, { recursive: true });

void Promise.all(
  targets.map(([name, size, rounded]) =>
    sharp(Buffer.from(icon(size, rounded)))
      .png()
      .toFile(path.join(OUT, name))
      .then(() => console.log(`  ${name}  ${size}x${size}`)),
  ),
);
