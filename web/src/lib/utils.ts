import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const MESES_CORTO = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export const DIAS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export const DIAS_CORTO = ["D", "L", "M", "X", "J", "V", "S"];

/** YYYY-MM-DD en hora local (evita el desfase de toISOString con UTC). */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** Parsea YYYY-MM-DD como fecha local. Devuelve null si no es válida. */
export function parseISODate(v: unknown): Date | null {
  if (typeof v !== "string") return null;
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "Lunes, 13 de julio" */
export function formatLong(iso: string): string {
  const d = parseISODate(iso);
  if (!d) return "Fecha por confirmar";
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()].toLowerCase()}`;
}

/** Lunes de la semana de `d` (la semana empieza en lunes). */
export function startOfWeek(d: Date): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (out.getDay() + 6) % 7; // 0 = lunes
  out.setDate(out.getDate() - day);
  return out;
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  out.setDate(out.getDate() + n);
  return out;
}

/** Las 7 fechas ISO de la semana que contiene `ref`. */
export function weekDates(ref: Date = new Date()): string[] {
  const start = startOfWeek(ref);
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(start, i)));
}

export function saludo(d = new Date()): string {
  const h = d.getHours();
  if (h < 6) return "Buenas noches";
  if (h < 13) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

/** Quita acentos y pasa a minúsculas: para búsquedas tolerantes. */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Repara mojibake heredado de los CSV antiguos (Ã¡ -> á). */
export function fixUtf(v: string): string {
  if (typeof v !== "string") return v;
  let out = v;
  for (let i = 0; i < 2; i++) {
    if (!/[ÃÂâð]/.test(out)) break;
    try {
      const dec = decodeURIComponent(escape(out));
      if (dec === out) break;
      out = dec;
    } catch {
      break;
    }
  }
  return out.replace(/\uFFFD/g, "").trim();
}

/** Fórmula de Epley: estima el 1RM a partir de peso × reps. */
export function estimate1RM(weight: number, reps: number): number {
  if (!weight || reps <= 1) return weight;
  return Math.round(weight * (1 + reps / 30) * 10) / 10;
}
