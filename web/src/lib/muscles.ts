import type { Intensity, MuscleGroup, Sport, Wod } from "./types";
import { INTENSITY_WEIGHT } from "./types";
import { normalize } from "./utils";

/**
 * Motor de inferencia muscular.
 *
 * Un WOD puede traer `muscles` explícito (lo pone el coach o la IA). Si no,
 * inferimos las zonas leyendo el texto del entrenamiento: cada movimiento
 * conocido aporta sus grupos musculares con un peso (1 = primario, 0.5 =
 * secundario). Esto alimenta el mapa de carga corporal semanal.
 */

type Contribution = Partial<Record<MuscleGroup, number>>;

interface MovementPattern {
  /** Palabras clave, ya normalizadas (sin acentos, minúsculas). */
  keys: string[];
  muscles: Contribution;
}

const P = (keys: string[], muscles: Contribution): MovementPattern => ({
  keys: keys.map(normalize),
  muscles,
});

/**
 * Ordenado de más específico a más genérico: el primer patrón que coincide
 * en una línea gana, para que "front squat" no se lea como "squat" a secas.
 */
export const MOVEMENT_PATTERNS: MovementPattern[] = [
  // ─ Halterofilia / barra
  P(["overhead squat", "ohs"], { cuadriceps: 1, core: 1, hombros: 0.8, gluteos: 0.6, espalda: 0.5 }),
  P(["front squat"], { cuadriceps: 1, core: 0.7, gluteos: 0.6, espalda: 0.4 }),
  P(["back squat", "sentadilla trasera"], { cuadriceps: 1, gluteos: 0.8, espalda: 0.5, core: 0.5 }),
  P(["goblet squat"], { cuadriceps: 1, gluteos: 0.6, core: 0.5 }),
  P(["air squat", "sentadilla"], { cuadriceps: 1, gluteos: 0.7, core: 0.3 }),
  P(["pistol"], { cuadriceps: 1, gluteos: 0.7, core: 0.6 }),
  P(["clean and jerk", "clean & jerk", "c&j"], { cuadriceps: 0.9, gluteos: 0.9, espalda: 0.8, hombros: 0.8, triceps: 0.5, core: 0.6, isquios: 0.6 }),
  P(["power clean", "hang clean", "squat clean", "clean"], { cuadriceps: 0.9, gluteos: 0.9, espalda: 0.8, isquios: 0.7, core: 0.5, antebrazos: 0.4 }),
  P(["power snatch", "hang snatch", "snatch"], { hombros: 0.9, espalda: 0.9, cuadriceps: 0.8, gluteos: 0.8, core: 0.6, isquios: 0.6 }),
  P(["push jerk", "split jerk", "jerk"], { hombros: 1, triceps: 0.8, cuadriceps: 0.5, core: 0.5 }),
  P(["push press"], { hombros: 1, triceps: 0.7, cuadriceps: 0.4, core: 0.5 }),
  P(["strict press", "shoulder press", "press militar", "overhead press"], { hombros: 1, triceps: 0.8, core: 0.4 }),
  P(["bench press", "press banca"], { pecho: 1, triceps: 0.8, hombros: 0.6 }),
  P(["romanian deadlift", "rdl", "peso muerto rumano"], { isquios: 1, gluteos: 0.9, espalda: 0.7 }),
  P(["sumo deadlift high pull", "sdhp"], { espalda: 0.8, hombros: 0.8, cuadriceps: 0.6, gluteos: 0.6 }),
  P(["deadlift", "peso muerto"], { isquios: 1, gluteos: 1, espalda: 0.9, antebrazos: 0.5, core: 0.5 }),
  P(["thruster"], { cuadriceps: 1, hombros: 1, gluteos: 0.7, triceps: 0.6, core: 0.5, cardio: 0.6 }),
  P(["good morning"], { isquios: 1, espalda: 0.8, gluteos: 0.7 }),
  P(["hip thrust"], { gluteos: 1, isquios: 0.6 }),
  P(["lunge", "zancada", "step-up", "step up"], { cuadriceps: 0.9, gluteos: 0.9, isquios: 0.4, core: 0.3 }),

  // ─ Gimnásticos
  P(["ring muscle-up", "ring muscle up", "bar muscle-up", "bar muscle up", "muscle-up", "muscle up"], { espalda: 1, biceps: 0.8, triceps: 0.8, pecho: 0.6, core: 0.7, hombros: 0.6 }),
  P(["chest to bar", "c2b", "butterfly pull-up", "kipping pull-up", "pull-up", "pull up", "dominada"], { espalda: 1, biceps: 0.8, antebrazos: 0.5, core: 0.4 }),
  P(["chin-up", "chin up"], { biceps: 1, espalda: 0.8 }),
  P(["toes to bar", "t2b", "knees to elbow", "k2e", "hanging knee raise"], { core: 1, espalda: 0.5, antebrazos: 0.5 }),
  P(["handstand push-up", "handstand push up", "hspu"], { hombros: 1, triceps: 0.9, core: 0.5, pecho: 0.3 }),
  P(["handstand walk", "handstand hold", "handstand", "pino"], { hombros: 1, core: 0.9, triceps: 0.5 }),
  P(["ring dip", "dip", "fondo"], { triceps: 1, pecho: 0.8, hombros: 0.6 }),
  P(["push-up", "push up", "flexion", "flexiones"], { pecho: 1, triceps: 0.8, hombros: 0.5, core: 0.4 }),
  P(["rope climb", "cuerda"], { espalda: 1, biceps: 0.8, antebrazos: 0.9, core: 0.6 }),
  P(["l-sit", "l sit", "hollow", "plank", "plancha"], { core: 1, hombros: 0.4 }),
  P(["sit-up", "sit up", "abdominal", "crunch", "v-up", "russian twist"], { core: 1 }),
  P(["back extension", "superman", "gh raise", "ghd"], { espalda: 0.8, isquios: 0.8, gluteos: 0.7, core: 0.6 }),
  P(["burpee"], { pecho: 0.7, cuadriceps: 0.7, hombros: 0.6, core: 0.6, triceps: 0.5, cardio: 1 }),

  // ─ Metcon / accesorios
  P(["wall ball", "wallball"], { cuadriceps: 0.9, hombros: 0.9, gluteos: 0.6, cardio: 0.8 }),
  P(["kettlebell swing", "kb swing", "swing"], { gluteos: 1, isquios: 0.9, espalda: 0.7, hombros: 0.5, cardio: 0.7 }),
  P(["devil press"], { hombros: 0.9, pecho: 0.7, cuadriceps: 0.7, cardio: 1 }),
  P(["dumbbell snatch", "db snatch"], { hombros: 0.9, espalda: 0.7, gluteos: 0.7, cuadriceps: 0.6 }),
  P(["farmer", "carry", "suitcase"], { antebrazos: 1, core: 0.8, espalda: 0.6, gluteos: 0.4 }),
  P(["sled push", "sled pull", "trineo"], { cuadriceps: 1, gluteos: 0.9, gemelos: 0.6, cardio: 0.9 }),
  P(["sandbag"], { espalda: 0.9, gluteos: 0.8, core: 0.8, cuadriceps: 0.6 }),
  P(["box jump", "salto al cajon", "jump"], { cuadriceps: 0.9, gemelos: 0.8, gluteos: 0.7, cardio: 0.7 }),
  P(["double under", "dobles", "comba", "single under"], { gemelos: 1, cardio: 0.9, antebrazos: 0.3 }),
  P(["bent over row", "barbell row", "remo con barra", "ring row", "dumbbell row"], { espalda: 1, biceps: 0.7, antebrazos: 0.4 }),
  P(["curl", "biceps"], { biceps: 1, antebrazos: 0.5 }),
  P(["triceps", "skull crusher", "extension de triceps"], { triceps: 1 }),
  P(["lateral raise", "elevacion lateral", "face pull"], { hombros: 1 }),
  P(["calf raise", "gemelos"], { gemelos: 1 }),
  P(["nordic"], { isquios: 1, gluteos: 0.4 }),

  // ─ Cardio / máquinas
  P(["assault bike", "echo bike", "air bike", "bike erg", "bici"], { cardio: 1, cuadriceps: 0.7, hombros: 0.4 }),
  P(["row", "remo", "rower", "erg"], { espalda: 0.8, cardio: 1, cuadriceps: 0.6, biceps: 0.4 }),
  P(["ski erg", "skierg", "ski"], { espalda: 0.8, core: 0.7, triceps: 0.6, cardio: 1 }),
  P(["sprint", "series", "intervalos", "tempo run", "fartlek"], { cardio: 1, cuadriceps: 0.7, isquios: 0.7, gemelos: 0.7, gluteos: 0.5 }),
  P(["run", "correr", "carrera", "rodaje", "trote", "km", "tirada"], { cardio: 1, gemelos: 0.7, cuadriceps: 0.6, isquios: 0.6, gluteos: 0.5 }),
  P(["swim", "natacion", "nadar"], { espalda: 0.8, hombros: 0.8, cardio: 1 }),
  P(["walk", "caminar", "marcha"], { cardio: 0.4, gemelos: 0.3 }),
];

/** Carga base por deporte, cuando el texto no da pistas suficientes. */
const SPORT_BASELINE: Record<Sport, Contribution> = {
  running: { cardio: 1, gemelos: 0.7, cuadriceps: 0.6, isquios: 0.6, gluteos: 0.5 },
  crossfit: { cardio: 0.7, cuadriceps: 0.6, hombros: 0.6, core: 0.6, espalda: 0.5 },
  hyrox: { cardio: 1, cuadriceps: 0.8, gluteos: 0.7, espalda: 0.6, hombros: 0.5 },
  deka: { cardio: 1, cuadriceps: 0.7, hombros: 0.6, core: 0.6 },
  fuerza: { cuadriceps: 0.6, espalda: 0.6, pecho: 0.5, hombros: 0.5 },
  movilidad: {},
};

/** Texto completo del WOD (todas las secciones concatenadas). */
export function wodText(w: Partial<Wod>): string {
  return [w.titulo, w.type, w.warmup, w.main, w.metcon, w.cooldown, w.notes]
    .filter(Boolean)
    .join("\n");
}

/**
 * Zonas trabajadas con su peso relativo (0–1), inferidas del texto.
 * Si el WOD trae `muscles` explícito, ese gana y se devuelve con peso 1.
 */
export function inferMuscles(w: Partial<Wod>): Contribution {
  if (w.muscles?.length) {
    return Object.fromEntries(w.muscles.map((m) => [m, 1])) as Contribution;
  }

  const text = normalize(wodText(w));
  const acc: Contribution = {};
  let hits = 0;

  for (const pattern of MOVEMENT_PATTERNS) {
    const matched = pattern.keys.some((k) => text.includes(k));
    if (!matched) continue;
    hits++;
    for (const [muscle, weight] of Object.entries(pattern.muscles)) {
      const m = muscle as MuscleGroup;
      acc[m] = Math.max(acc[m] ?? 0, weight as number);
    }
  }

  // Sin coincidencias claras: caemos a la firma del deporte.
  if (hits === 0 && w.sport) {
    const base = SPORT_BASELINE[w.sport as Sport];
    for (const [muscle, weight] of Object.entries(base ?? {})) {
      acc[muscle as MuscleGroup] = weight as number;
    }
  }

  return acc;
}

/** Lista simple de zonas principales (peso >= 0.6), para chips en la UI. */
export function primaryMuscles(w: Partial<Wod>, max = 4): MuscleGroup[] {
  const c = inferMuscles(w);
  return (Object.entries(c) as [MuscleGroup, number][])
    .filter(([, v]) => v >= 0.6)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([m]) => m);
}

/**
 * Carga acumulada por zona en un conjunto de sesiones.
 * carga(zona) = Σ (peso_zona × peso_intensidad)
 */
export function accumulateLoad(
  items: { intensity?: Intensity; muscles?: MuscleGroup[]; wod?: Partial<Wod> }[],
): Record<MuscleGroup, number> {
  const totals = {} as Record<MuscleGroup, number>;

  for (const item of items) {
    const contribution = item.muscles?.length
      ? (Object.fromEntries(item.muscles.map((m) => [m, 1])) as Contribution)
      : inferMuscles(item.wod ?? {});
    const iw = INTENSITY_WEIGHT[item.intensity ?? "media"];

    for (const [muscle, weight] of Object.entries(contribution)) {
      const m = muscle as MuscleGroup;
      totals[m] = (totals[m] ?? 0) + (weight as number) * iw;
    }
  }

  return totals;
}

/**
 * Normaliza la carga a un nivel 0–3 para pintar el cuerpo.
 * 0 sin trabajar · 1 fresco (azul) · 2 cargado (amarillo) · 3 muy cargado (rojo)
 *
 * El umbral es relativo a una semana "completa" tipo: ~3 sesiones de
 * intensidad media tocando una zona como primaria (3 × 1 × 1 = 3).
 */
export function loadLevel(value: number): 0 | 1 | 2 | 3 {
  if (value <= 0.01) return 0;
  if (value < 1.6) return 1;
  if (value < 3.2) return 2;
  return 3;
}

/**
 * Variables CSS, no hex: el tono cambia con el tema (un amarillo que se lee
 * sobre negro se pierde sobre blanco). Solo valen en estilos en línea, nunca
 * como atributo SVG, donde el navegador no resuelve `var()`.
 */
export const LOAD_COLOR: Record<0 | 1 | 2 | 3, string> = {
  0: "var(--load-0)",
  1: "var(--load-1)",
  2: "var(--load-2)",
  3: "var(--load-3)",
};

export const LOAD_LABEL: Record<0 | 1 | 2 | 3, string> = {
  0: "Sin trabajar",
  1: "Carga baja",
  2: "Cargado",
  3: "Muy cargado",
};
