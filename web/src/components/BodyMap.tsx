"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Heart, RotateCcw } from "lucide-react";
import { BACK, FRONT, SILHOUETTE, VIEWBOX } from "@/lib/body-shapes";
import { LOAD_COLOR, LOAD_LABEL, loadLevel } from "@/lib/muscles";
import { MUSCLE_LABEL, type MuscleGroup } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Mapa de carga corporal.
 *
 * El cuerpo se pinta según la carga acumulada de la semana:
 *   gris = sin trabajar · azul = suave · amarillo = cargado · rojo = muy cargado
 *
 * `cardio` no es una zona del cuerpo, así que va aparte como indicador del
 * sistema cardiovascular en vez de inventarle un músculo.
 *
 * La geometría vive en `lib/body-shapes.ts`, que comparte con el script
 * `scripts/render-body.ts`: lo que se revisa es exactamente lo que se envía.
 */

export interface BodyMapProps {
  /** Carga acumulada por zona. */
  load: Partial<Record<MuscleGroup, number>>;
  /** Qué sesiones han cargado cada zona, para el detalle al pulsar. */
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
      {/* Frente / espalda */}
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
        initial={{ opacity: 0, rotateY: -16 }}
        animate={{ opacity: 1, rotateY: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        viewBox={VIEWBOX}
        className="h-[330px] w-auto max-w-full select-none sm:h-[390px]"
        role="img"
        aria-label={`Carga muscular, vista ${view === "front" ? "frontal" : "trasera"}`}
      >
        <g fill="#17171c" stroke="#2c2c34" strokeWidth="1.1">
          {SILHOUETTE.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>

        {regions.map((r) => {
          const level = loadLevel(load[r.id] ?? 0);
          const isSelected = selected === r.id;

          return (
            <g
              key={r.id}
              onClick={() => setSelected(isSelected ? null : r.id)}
              className="cursor-pointer"
              style={{
                fill: LOAD_COLOR[level],
                // El borde oscuro separa zonas contiguas del mismo color: sin
                // él, pecho y abdomen en rojo se funden en una sola mancha.
                stroke: isSelected ? "#f6f4f0" : "#101014",
                strokeWidth: isSelected ? 2 : 1.6,
                strokeLinejoin: "round",
                opacity: level === 0 ? 0.9 : 1,
                transition: "fill 0.45s cubic-bezier(0.16,1,0.3,1), stroke 0.15s",
              }}
            >
              <title>{`${MUSCLE_LABEL[r.id]} — ${LOAD_LABEL[level]}`}</title>
              {r.d.map((d, i) => (
                <path key={i} d={d} />
              ))}
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
