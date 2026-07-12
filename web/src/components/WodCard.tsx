"use client";

import { Check, Clock, Sparkles } from "lucide-react";
import { primaryMuscles } from "@/lib/muscles";
import {
  INTENSITY_COLOR,
  INTENSITY_LABEL,
  MUSCLE_LABEL,
  SPORT_COLOR,
  SPORT_LABEL,
  type Wod,
} from "@/lib/types";
import { cn } from "@/lib/utils";

export function WodCard({
  wod,
  done,
  onClick,
  className,
}: {
  wod: Wod;
  done?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const color = SPORT_COLOR[wod.sport] ?? SPORT_COLOR.running;
  const preview = (wod.main || wod.metcon || wod.warmup || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 3);
  const muscles = primaryMuscles(wod, 3);

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full overflow-hidden rounded-[var(--radius-md)] border border-line-soft bg-surface text-left",
        "transition-[transform,border-color] duration-200 active:scale-[0.985] hover:border-line",
        className,
      )}
    >
      {/* Barra de deporte */}
      <span
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: color }}
        aria-hidden
      />

      <div className="py-4 pr-4 pl-5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: color }}
              aria-hidden
            />
            <span
              className="mono text-[11px] font-semibold tracking-wider uppercase"
              style={{ color }}
            >
              {SPORT_LABEL[wod.sport] ?? wod.sport}
            </span>
            {wod.source === "ai" && (
              <Sparkles size={12} className="text-ink-3" aria-label="Generado con IA" />
            )}
          </span>

          <span className="flex items-center gap-2">
            {done && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/15">
                <Check size={12} className="text-green-400" />
              </span>
            )}
            <span
              className="rounded-md px-2 py-0.5 text-[11px] font-semibold"
              style={{
                color: INTENSITY_COLOR[wod.intensity],
                background: `color-mix(in srgb, ${INTENSITY_COLOR[wod.intensity]} 13%, transparent)`,
              }}
            >
              {INTENSITY_LABEL[wod.intensity]}
            </span>
          </span>
        </div>

        <h3
          className={cn(
            "mt-2 text-[17px] leading-tight font-semibold text-balance",
            done && "text-ink-2",
          )}
        >
          {wod.titulo}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {wod.duration && (
            <span className="flex items-center gap-1 text-[12px] text-ink-3">
              <Clock size={12} />
              {wod.duration}
            </span>
          )}
          {muscles.map((m) => (
            <span key={m} className="text-[12px] text-ink-3">
              {MUSCLE_LABEL[m]}
            </span>
          ))}
        </div>

        {preview.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-line-soft pt-3">
            {preview.map((line, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-snug text-ink-2">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-3" />
                <span className="line-clamp-1">{line}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </button>
  );
}

export function RestCard() {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-line bg-transparent px-5 py-4">
      <span className="h-2 w-2 rounded-full border border-ink-3" />
      <span className="text-[14px] font-medium text-ink-3">Descanso</span>
    </div>
  );
}
