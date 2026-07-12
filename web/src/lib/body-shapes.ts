import type { MuscleGroup } from "./types";

/**
 * Geometría del cuerpo humano del mapa de carga.
 *
 * Vive aparte del componente a propósito: el mismo módulo lo consume la UI y
 * el script que rasteriza el SVG para revisarlo, así lo que se revisa es
 * exactamente lo que se envía.
 *
 * Sistema de coordenadas: viewBox 0 0 220 400, eje de simetría en x = 110.
 * Toda zona muscular tiene que quedar DENTRO de la silueta.
 */

export const VIEWBOX = "0 0 220 400";
export const CENTER = 110;

export const SILHOUETTE: string[] = [
  // Cabeza y cuello
  "M110 8 a18 18 0 0 1 0 36 a18 18 0 0 1 0 -36 z",
  "M101 42 h18 v10 q-9 5 -18 0 z",
  // Torso: hombros anchos, cintura estrecha, cadera
  "M78 56 q14 -8 32 -8 q18 0 32 8 l6 26 q3 14 1 28 l-4 34 q-1 12 -3 22 l-2 14 h-60 l-2 -14 q-2 -10 -3 -22 l-4 -34 q-2 -14 1 -28 z",
  // Brazo izquierdo: deltoides -> bíceps -> antebrazo -> mano
  "M76 60 q-12 3 -16 14 l-6 24 q-2 8 -1 16 l4 30 q1 8 -1 16 l-5 24 q-1 8 5 10 q7 2 9 -6 l6 -26 q2 -8 2 -16 l-1 -30 q0 -8 2 -16 l6 -24 z",
  // Brazo derecho (espejo)
  "M144 60 q12 3 16 14 l6 24 q2 8 1 16 l-4 30 q-1 8 1 16 l5 24 q1 8 -5 10 q-7 2 -9 -6 l-6 -26 q-2 -8 -2 -16 l1 -30 q0 -8 -2 -16 l-6 -24 z",
  // Pierna izquierda: cadera -> muslo -> rodilla -> gemelo -> pie
  "M80 168 h28 l-1 40 q-1 26 -3 44 l-3 34 q-1 24 -3 44 l-2 26 q-1 8 -8 8 q-7 0 -8 -8 l-2 -30 q-1 -22 -1 -42 l1 -36 q0 -20 2 -40 z",
  // Pierna derecha (espejo)
  "M140 168 h-28 l1 40 q1 26 3 44 l3 34 q1 24 3 44 l2 26 q1 8 8 8 q7 0 8 -8 l2 -30 q1 -22 1 -42 l-1 -36 q0 -20 -2 -40 z",
  // Pies
  "M78 362 h20 l1 12 h-23 q-1 -8 2 -12 z",
  "M142 362 h-20 l-1 12 h23 q1 -8 -2 -12 z",
];

export interface Region {
  id: MuscleGroup;
  /** Uno o varios paths; se pintan todos del color de la zona. */
  d: string[];
}

// ─── Vista frontal ────────────────────────────────────────────────────────

export const FRONT: Region[] = [
  {
    id: "hombros",
    d: [
      // Deltoides: montan sobre la unión hombro-brazo, dentro de la silueta.
      "M78 56 q-14 4 -18 18 l-3 12 q10 6 20 3 q8 -3 10 -12 l3 -18 q-6 -3 -12 -3 z",
      "M142 56 q14 4 18 18 l3 12 q-10 6 -20 3 q-8 -3 -10 -12 l-3 -18 q6 -3 12 -3 z",
    ],
  },
  {
    id: "pecho",
    d: [
      "M86 62 q10 -4 22 -4 v34 q-2 5 -8 5 l-14 -3 q-6 -2 -6 -9 l1 -16 q0 -5 5 -7 z",
      "M134 62 q-10 -4 -22 -4 v34 q2 5 8 5 l14 -3 q6 -2 6 -9 l-1 -16 q0 -5 -5 -7 z",
    ],
  },
  {
    id: "biceps",
    d: [
      "M62 78 q9 -1 12 6 l-3 24 q-1 10 -6 14 q-7 4 -12 -2 q-3 -4 -2 -12 l4 -22 q1 -7 7 -8 z",
      "M158 78 q-9 -1 -12 6 l3 24 q1 10 6 14 q7 4 12 -2 q3 -4 2 -12 l-4 -22 q-1 -7 -7 -8 z",
    ],
  },
  {
    id: "antebrazos",
    d: [
      "M55 126 q8 -2 11 5 l-3 26 q-1 10 -4 18 q-5 6 -10 2 q-3 -3 -2 -10 l4 -30 q1 -9 4 -11 z",
      "M165 126 q-8 -2 -11 5 l3 26 q1 10 4 18 q5 6 10 2 q3 -3 2 -10 l-4 -30 q-1 -9 -4 -11 z",
    ],
  },
  {
    id: "core",
    d: [
      // Recto abdominal
      "M94 100 h32 q3 0 3 4 l-2 40 q-1 8 -4 12 l-13 8 l-13 -8 q-3 -4 -4 -12 l-2 -40 q0 -4 3 -4 z",
      // Oblicuos
      "M88 102 l4 0 l2 44 l-8 -8 q-2 -6 -2 -14 z",
      "M132 102 l-4 0 l-2 44 l8 -8 q2 -6 2 -14 z",
    ],
  },
  {
    id: "cuadriceps",
    d: [
      "M84 172 q10 -3 20 0 q3 2 2 8 l-4 44 q-1 16 -6 24 q-7 8 -13 0 q-4 -6 -4 -18 l2 -50 q0 -6 3 -8 z",
      "M136 172 q-10 -3 -20 0 q-3 2 -2 8 l4 44 q1 16 6 24 q7 8 13 0 q4 -6 4 -18 l-2 -50 q0 -6 -3 -8 z",
    ],
  },
  {
    id: "gemelos",
    d: [
      "M87 262 q9 -3 15 2 q3 3 2 11 l-3 34 q-1 12 -6 16 q-6 4 -10 -2 q-2 -4 -2 -14 l2 -38 q0 -7 2 -9 z",
      "M133 262 q-9 -3 -15 2 q-3 3 -2 11 l3 34 q1 12 6 16 q6 4 10 -2 q2 -4 2 -14 l-2 -38 q0 -7 -2 -9 z",
    ],
  },
];

// ─── Vista trasera ────────────────────────────────────────────────────────

export const BACK: Region[] = [
  {
    id: "hombros",
    d: [
      "M78 56 q-14 4 -18 18 l-3 12 q10 6 20 3 q8 -3 10 -12 l3 -18 q-6 -3 -12 -3 z",
      "M142 56 q14 4 18 18 l3 12 q-10 6 -20 3 q-8 -3 -10 -12 l-3 -18 q6 -3 12 -3 z",
    ],
  },
  {
    id: "espalda",
    d: [
      // Trapecios
      "M88 54 q22 -6 44 0 l4 20 q-13 8 -26 8 q-13 0 -26 -8 z",
      // Dorsales
      "M86 80 q24 10 48 0 l3 26 q1 12 -6 20 q-12 12 -21 14 q-9 -2 -21 -14 q-7 -8 -6 -20 z",
    ],
  },
  {
    id: "triceps",
    d: [
      "M62 78 q9 -1 12 6 l-3 24 q-1 10 -6 14 q-7 4 -12 -2 q-3 -4 -2 -12 l4 -22 q1 -7 7 -8 z",
      "M158 78 q-9 -1 -12 6 l3 24 q1 10 6 14 q7 4 12 -2 q3 -4 2 -12 l-4 -22 q-1 -7 -7 -8 z",
    ],
  },
  {
    id: "antebrazos",
    d: [
      "M55 126 q8 -2 11 5 l-3 26 q-1 10 -4 18 q-5 6 -10 2 q-3 -3 -2 -10 l4 -30 q1 -9 4 -11 z",
      "M165 126 q-8 -2 -11 5 l3 26 q1 10 4 18 q5 6 10 2 q3 -3 2 -10 l-4 -30 q-1 -9 -4 -11 z",
    ],
  },
  {
    id: "core",
    d: [
      // Lumbares
      "M92 136 h36 l-2 24 q-1 6 -5 8 h-22 q-4 -2 -5 -8 z",
    ],
  },
  {
    id: "gluteos",
    d: [
      "M109 168 v38 q-10 6 -20 0 q-8 -5 -8 -18 q0 -13 8 -18 q9 -4 20 -2 z",
      "M111 168 v38 q10 6 20 0 q8 -5 8 -18 q0 -13 -8 -18 q-9 -4 -20 -2 z",
    ],
  },
  {
    id: "isquios",
    d: [
      "M85 208 q11 -3 20 1 q3 2 2 9 l-4 38 q-1 14 -6 20 q-7 7 -12 0 q-4 -5 -4 -16 l2 -44 q0 -6 2 -8 z",
      "M135 208 q-11 -3 -20 1 q-3 2 -2 9 l4 38 q1 14 6 20 q7 7 12 0 q4 -5 4 -16 l-2 -44 q0 -6 -2 -8 z",
    ],
  },
  {
    id: "gemelos",
    d: [
      "M86 264 q10 -4 16 2 q3 3 2 12 l-3 32 q-1 12 -6 16 q-6 4 -10 -2 q-2 -4 -2 -14 l2 -37 q0 -7 1 -9 z",
      "M134 264 q-10 -4 -16 2 q-3 3 -2 12 l3 32 q1 12 6 16 q6 4 10 -2 q2 -4 2 -14 l-2 -37 q0 -7 -1 -9 z",
    ],
  },
];
