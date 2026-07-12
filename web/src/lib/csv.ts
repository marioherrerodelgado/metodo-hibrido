import type { Intensity, Sport, Wod } from "./types";
import { fixUtf, normalize } from "./utils";

/**
 * Importador de WODs desde CSV.
 *
 * Reemplaza el parser de `admin.html`. Es un parser RFC 4180 de verdad, porque
 * los WODs traen saltos de línea dentro de las celdas (una línea por ejercicio)
 * y partir por comas y por `\n` a lo bruto los destrozaba.
 */

/** Divide un CSV respetando comillas y saltos de línea dentro de las celdas. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  // Quita el BOM: Excel lo mete y convertía la primera cabecera en "﻿fecha".
  const src = text.replace(/^﻿/, "");

  for (let i = 0; i < src.length; i++) {
    const c = src[i];

    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cell += '"'; // comilla escapada ("")
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += c;
      }
      continue;
    }

    if (c === '"') {
      quoted = true;
    } else if (c === "," || c === ";") {
      row.push(cell);
      cell = "";
    } else if (c === "\r") {
      // Ignoramos el CR de los finales de línea de Windows.
    } else if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += c;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows.filter((r) => r.some((v) => v.trim()));
}

/** Acepta YYYY-MM-DD, DD/MM/YYYY y el serial numérico de Excel. */
export function parseFlexibleDate(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;

  const iso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  const dmy = v.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const d = dmy[1].padStart(2, "0");
    const m = dmy[2].padStart(2, "0");
    return `${dmy[3]}-${m}-${d}`;
  }

  // Serial de Excel: días desde el 30/12/1899 (con su famoso bug del año 1900).
  const serial = Number(v);
  if (Number.isFinite(serial) && serial > 20000 && serial < 80000) {
    const base = Date.UTC(1899, 11, 30);
    const d = new Date(base + serial * 86_400_000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  return null;
}

const SPORT_ALIASES: Record<string, Sport> = {
  running: "running",
  correr: "running",
  carrera: "running",
  crossfit: "crossfit",
  wod: "crossfit",
  hyrox: "hyrox",
  deka: "deka",
  fuerza: "fuerza",
  strength: "fuerza",
  movilidad: "movilidad",
  mobility: "movilidad",
};

const INTENSITY_ALIASES: Record<string, Intensity> = {
  baja: "baja",
  suave: "baja",
  low: "baja",
  media: "media",
  moderada: "media",
  medium: "media",
  alta: "alta",
  exigente: "alta",
  high: "alta",
  maxima: "maxima",
  max: "maxima",
};

/** Cabeceras aceptadas -> campo del WOD. */
const COLUMNS: Record<string, keyof Wod> = {
  fecha: "fecha",
  date: "fecha",
  dia: "fecha",
  sport: "sport",
  deporte: "sport",
  titulo: "titulo",
  title: "titulo",
  nombre: "titulo",
  intensity: "intensity",
  intensidad: "intensity",
  duration: "duration",
  duracion: "duration",
  volume: "volume",
  volumen: "volume",
  type: "type",
  tipo: "type",
  sede: "sede",
  notes: "notes",
  notas: "notes",
  warmup: "warmup",
  calentamiento: "warmup",
  main: "main",
  principal: "main",
  metcon: "metcon",
  cooldown: "cooldown",
};

export interface ImportResult {
  wods: Omit<Wod, "id">[];
  /** Filas que no hemos podido usar, con el porqué. */
  errors: { row: number; reason: string }[];
}

export function parseWodsCSV(text: string): ImportResult {
  const rows = parseCSV(text);
  const errors: ImportResult["errors"] = [];
  const wods: Omit<Wod, "id">[] = [];

  if (rows.length < 2) {
    return { wods, errors: [{ row: 0, reason: "El fichero está vacío." }] };
  }

  const headers = rows[0].map((h) => normalize(h));

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const raw: Record<string, string> = {};

    headers.forEach((h, c) => {
      const key = COLUMNS[h];
      if (key) raw[key as string] = fixUtf(row[c] ?? "").trim();
    });

    const sportRaw = normalize(raw.sport ?? "");
    const fecha = parseFlexibleDate(raw.fecha ?? "");

    if (!fecha) {
      errors.push({ row: i + 1, reason: "Fecha ausente o no reconocida" });
      continue;
    }
    if (!raw.titulo) {
      errors.push({ row: i + 1, reason: "Falta el título" });
      continue;
    }
    if (!raw.main) {
      errors.push({ row: i + 1, reason: "Falta la parte principal" });
      continue;
    }

    wods.push({
      fecha,
      month: fecha.slice(0, 7),
      sport: SPORT_ALIASES[sportRaw] ?? "crossfit",
      titulo: raw.titulo,
      intensity: INTENSITY_ALIASES[normalize(raw.intensity ?? "")] ?? "media",
      duration: raw.duration ?? "",
      volume: raw.volume ?? "",
      type: raw.type ?? "",
      sede: raw.sede ?? "",
      notes: raw.notes ?? "",
      warmup: raw.warmup ?? "",
      main: raw.main,
      metcon: raw.metcon ?? "",
      cooldown: raw.cooldown ?? "",
      source: "coach",
    });
  }

  return { wods, errors };
}
