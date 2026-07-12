"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Heart, RotateCcw } from "lucide-react";
import { LOAD_COLOR, LOAD_LABEL, loadLevel } from "@/lib/muscles";
import { MUSCLE_LABEL, type MuscleGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Mapa de carga corporal.
 *
 * Cuerpo anatómico estilizado (geométrico, no ilustrativo) con las zonas
 * pintadas según la carga acumulada de la semana:
 *   gris = sin trabajar · azul = suave · amarillo = cargado · rojo = muy cargado
 *
 * `cardio` no es una zona del cuerpo, así que se muestra aparte como
 * indicador de sistema cardiovascular.
 */

interface Region {
  id: MuscleGroup;
  /** Formas que componen la zona (se pintan todas del mismo color). */
  shapes: React.ReactNode;
}

const S = {
  base: "#17171c",
  line: "#2c2c34",
};

// ─── Vista frontal ────────────────────────────────────────────────────────

const FRONT: Region[] = [
  {
    id: "hombros",
    shapes: (
      <>
        <ellipse cx="58" cy="86" rx="17" ry="15" />
        <ellipse cx="142" cy="86" rx="17" ry="15" />
      </>
    ),
  },
  {
    id: "pecho",
    shapes: (
      <>
        <path d="M78 74 h20 a2 2 0 0 1 2 2 v28 a4 4 0 0 1-5 4 l-17-4 a5 5 0 0 1-4-5 v-20 a5 5 0 0 1 4-5 z" />
        <path d="M122 74 h-20 a2 2 0 0 0-2 2 v28 a4 4 0 0 0 5 4 l17-4 a5 5 0 0 0 4-5 v-20 a5 5 0 0 0-4-5 z" />
      </>
    ),
  },
  {
    id: "biceps",
    shapes: (
      <>
        <rect x="41" y="100" width="21" height="46" rx="10" />
        <rect x="138" y="100" width="21" height="46" rx="10" />
      </>
    ),
  },
  {
    id: "antebrazos",
    shapes: (
      <>
        <rect x="33" y="148" width="19" height="52" rx="9" transform="rotate(-6 42 174)" />
        <rect x="148" y="148" width="19" height="52" rx="9" transform="rotate(6 158 174)" />
      </>
    ),
  },
  {
    id: "core",
    shapes: (
      <>
        <rect x="84" y="112" width="32" height="56" rx="8" />
        <path d="M78 116 l5 0 0 44 -8 -8 z" />
        <path d="M122 116 l-5 0 0 44 8 -8 z" />
      </>
    ),
  },
  {
    id: "cuadriceps",
    shapes: (
      <>
        <path d="M76 190 c-8 0 -13 6 -13 16 l2 60 c0 12 4 18 11 18 8 0 12 -7 13 -18 l4 -60 c0 -10 -6 -16 -17 -16 z" />
        <path d="M124 190 c8 0 13 6 13 16 l-2 60 c0 12 -4 18 -11 18 -8 0 -12 -7 -13 -18 l-4 -60 c0 -10 6 -16 17 -16 z" />
      </>
    ),
  },
  {
    id: "gemelos",
    shapes: (
      <>
        <rect x="68" y="300" width="22" height="62" rx="10" />
        <rect x="110" y="300" width="22" height="62" rx="10" />
      </>
    ),
  },
];

// ─── Vista trasera ────────────────────────────────────────────────────────

const BACK: Region[] = [
  {
    id: "hombros",
    shapes: (
      <>
        <ellipse cx="58" cy="86" rx="17" ry="15" />
        <ellipse cx="142" cy="86" rx="17" ry="15" />
      </>
    ),
  },
  {
    id: "espalda",
    shapes: (
      <>
        {/* Trapecios */}
        <path d="M80 70 h40 l6 22 -26 8 -26 -8 z" />
        {/* Dorsales */}
        <path d="M76 96 l24 8 24 -8 4 30 c0 14 -12 30 -28 34 -16 -4 -28 -20 -28 -34 z" />
      </>
    ),
  },
  {
    id: "triceps",
    shapes: (
      <>
        <rect x="41" y="100" width="21" height="46" rx="10" />
        <rect x="138" y="100" width="21" height="46" rx="10" />
      </>
    ),
  },
  {
    id: "antebrazos",
    shapes: (
      <>
        <rect x="33" y="148" width="19" height="52" rx="9" transform="rotate(-6 42 174)" />
        <rect x="148" y="148" width="19" height="52" rx="9" transform="rotate(6 158 174)" />
      </>
    ),
  },
  {
    id: "gluteos",
    shapes: (
      <>
        <path d="M99 176 v42 c-10 6 -22 4 -28 -4 -5 -8 -4 -24 4 -32 6 -6 16 -8 24 -6 z" />
        <path d="M101 176 v42 c10 6 22 4 28 -4 5 -8 4 -24 -4 -32 -6 -6 -16 -8 -24 -6 z" />
      </>
    ),
  },
  {
    id: "isquios",
    shapes: (
      <>
        <path d="M76 222 c-9 0 -14 6 -14 16 l2 50 c0 12 5 18 12 18 8 0 12 -7 13 -18 l4 -50 c0 -10 -6 -16 -17 -16 z" />
        <path d="M124 222 c9 0 14 6 14 16 l-2 50 c0 12 -5 18 -12 18 -8 0 -12 -7 -13 -18 l-4 -50 c0 -10 6 -16 17 -16 z" />
      </>
    ),
  },
  {
    id: "gemelos",
    shapes: (
      <>
        <path d="M79 306 c-11 0 -16 8 -15 20 l3 30 c1 10 5 14 12 14 7 0 11 -4 12 -14 l2 -30 c1 -12 -4 -20 -14 -20 z" />
        <path d="M121 306 c11 0 16 8 15 20 l-3 30 c-1 10 -5 14 -12 14 -7 0 -11 -4 -12 -14 l-2 -30 c-1 -12 4 -20 14 -20 z" />
      </>
    ),
  },
  {
    id: "core",
    shapes: <rect x="82" y="140" width="36" height="34" rx="8" />,
  },
];

/** Silueta base: se dibuja debajo de las zonas para dar contexto anatómico. */
function Silhouette() {
  return (
    <g fill={S.base} stroke={S.line} strokeWidth="1.2">
      <circle cx="100" cy="36" r="21" />
      <rect x="91" y="54" width="18" height="14" rx="4" />
      {/* Torso */}
      <path d="M64 78 c8 -6 22 -10 36 -10 s28 4 36 10 l6 24 -4 40 c-1 14 -6 26 -8 38 l-30 6 -30 -6 c-2 -12 -7 -24 -8 -38 l-4 -40 z" />
      {/* Brazos */}
      <path d="M46 92 c-8 4 -11 12 -10 22 l8 76 c1 8 3 12 8 12 5 0 8 -5 7 -13 l-4 -74 4 -20 z" />
      <path d="M154 92 c8 4 11 12 10 22 l-8 76 c-1 8 -3 12 -8 12 -5 0 -8 -5 -7 -13 l4 -74 -4 -20 z" />
      {/* Manos */}
      <ellipse cx="43" cy="204" rx="8" ry="11" />
      <ellipse cx="157" cy="204" rx="8" ry="11" />
      {/* Cadera + piernas */}
      <path d="M70 172 h60 l6 26 -4 30 -6 76 -4 66 c-1 8 -5 12 -12 12 -7 0 -11 -5 -11 -13 l-2 -70 -1 -30 -1 30 -2 70 c0 8 -4 13 -11 13 -7 0 -11 -4 -12 -12 l-4 -66 -6 -76 -4 -30 z" />
      {/* Pies */}
      <path d="M68 384 h20 l2 12 h-24 z" />
      <path d="M112 384 h20 l2 12 h-24 z" />
    </g>
  );
}

export interface BodyMapProps {
  /** Carga acumulada por zona. */
  load: Partial<Record<MuscleGroup, number>>;
  /** Sesiones que tocaron cada zona, para el detalle al pulsar. */
  detail?: Partial<Record<MuscleGroup, string[]>>;
  className?: string;
}

export function BodyMap({ load, detail, className }: BodyMapProps) {
  const [view, setView] = useState<"front" | "back">("front");
  const [selected, setSelected] = useState<MuscleGroup | null>(null);

  const regions = view === "front" ? FRONT : BACK;
  const cardioLevel = loadLevel(load.cardio ?? 0);

  const selectedLevel = selected ? loadLevel(load[selected] ?? 0) : null;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Toggle frente / espalda */}
      <div className="mb-2 flex w-full items-center justify-between">
        <div className="flex rounded-full border border-line p-0.5">
          {(["front", "back"] as const).map((v) => (
            <button
              key={v}
              onClick={() => {
                setView(v);
                setSelected(null);
              }}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors",
                view === v ? "bg-ink text-bg" : "text-ink-3 hover:text-ink-2",
              )}
            >
              {v === "front" ? "Frente" : "Espalda"}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            setView((v) => (v === "front" ? "back" : "front"));
            setSelected(null);
          }}
          aria-label="Girar cuerpo"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-3 transition-colors hover:text-ink"
        >
          <RotateCcw size={15} />
        </button>
      </div>

      <motion.svg
        key={view}
        initial={{ opacity: 0, rotateY: -18 }}
        animate={{ opacity: 1, rotateY: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        viewBox="0 0 200 410"
        className="h-[340px] w-auto max-w-full select-none sm:h-[400px]"
        role="img"
        aria-label={`Carga muscular, vista ${view === "front" ? "frontal" : "trasera"}`}
      >
        <Silhouette />

        {regions.map((r) => {
          const value = load[r.id] ?? 0;
          const level = loadLevel(value);
          const color = LOAD_COLOR[level];
          const isSelected = selected === r.id;

          return (
            <g
              key={r.id}
              onClick={() => setSelected(isSelected ? null : r.id)}
              className="cursor-pointer"
              style={{
                fill: color,
                stroke: isSelected ? "#f6f4f0" : "transparent",
                strokeWidth: 1.6,
                opacity: level === 0 ? 0.85 : 1,
                transition: "fill 0.45s cubic-bezier(0.16,1,0.3,1), stroke 0.15s",
              }}
            >
              <title>{`${MUSCLE_LABEL[r.id]} — ${LOAD_LABEL[level]}`}</title>
              {r.shapes}
            </g>
          );
        })}
      </motion.svg>

      {/* Detalle de la zona seleccionada */}
      <div className="mt-3 min-h-[68px] w-full">
        {selected && selectedLevel !== null ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[var(--radius-sm)] border border-line-soft bg-bg-elev p-3.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold">{MUSCLE_LABEL[selected]}</span>
              <span
                className="mono text-[11px] font-semibold"
                style={{ color: LOAD_COLOR[selectedLevel] }}
              >
                {LOAD_LABEL[selectedLevel].toUpperCase()}
              </span>
            </div>
            {detail?.[selected]?.length ? (
              <ul className="mt-2 space-y-1">
                {detail[selected]!.slice(0, 4).map((t, i) => (
                  <li key={i} className="flex items-center gap-2 text-[12px] text-ink-3">
                    <span
                      className="h-1 w-1 rounded-full"
                      style={{ background: LOAD_COLOR[selectedLevel] }}
                    />
                    {t}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-[12px] text-ink-3">
                Esta semana no has trabajado esta zona.
              </p>
            )}
          </motion.div>
        ) : (
          <p className="pt-4 text-center text-[12px] text-ink-3">
            Pulsa una zona para ver qué la ha cargado.
          </p>
        )}
      </div>

      {/* Cardio + leyenda */}
      <div className="mt-3 flex w-full flex-col gap-3">
        <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-line-soft bg-bg-elev p-3">
          <Heart
            size={18}
            style={{ color: LOAD_COLOR[cardioLevel] }}
            fill={cardioLevel > 0 ? LOAD_COLOR[cardioLevel] : "none"}
          />
          <div className="flex-1">
            <div className="text-[13px] font-semibold">Sistema cardiovascular</div>
            <div className="text-[11px] text-ink-3">{LOAD_LABEL[cardioLevel]}</div>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className="h-5 w-1.5 rounded-full transition-colors"
                style={{
                  background: cardioLevel >= n ? LOAD_COLOR[cardioLevel] : "#23232a",
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          {([1, 2, 3] as const).map((l) => (
            <span key={l} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: LOAD_COLOR[l] }}
              />
              <span className="text-[11px] text-ink-3">{LOAD_LABEL[l]}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
