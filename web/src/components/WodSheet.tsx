"use client";

import { useMemo } from "react";
import { Check, Clock, Gauge, Timer as TimerIcon } from "lucide-react";
import Link from "next/link";
import { Sheet } from "./Sheet";
import { Button, Tag } from "./ui";
import { primaryMuscles } from "@/lib/muscles";
import {
  INTENSITY_COLOR,
  INTENSITY_LABEL,
  MUSCLE_LABEL,
  SPORT_COLOR,
  SPORT_LABEL,
  type Wod,
} from "@/lib/types";
import { formatLong } from "@/lib/utils";

const BLOCKS: { key: keyof Wod; label: string }[] = [
  { key: "warmup", label: "Calentamiento" },
  { key: "main", label: "Parte principal" },
  { key: "metcon", label: "MetCon" },
  { key: "cooldown", label: "Vuelta a la calma" },
];

export function WodSheet({
  wod,
  open,
  onClose,
  done,
  onToggleDone,
}: {
  wod: Wod | null;
  open: boolean;
  onClose: () => void;
  done?: boolean;
  onToggleDone?: (wod: Wod) => void;
}) {
  const muscles = useMemo(() => (wod ? primaryMuscles(wod, 6) : []), [wod]);
  if (!wod) return null;

  const color = SPORT_COLOR[wod.sport] ?? SPORT_COLOR.running;

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="pb-2">
        <div className="flex items-center gap-2">
          <span
            className="mono rounded-md px-2 py-1 text-[11px] font-semibold tracking-wider uppercase"
            style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
          >
            {SPORT_LABEL[wod.sport] ?? wod.sport}
          </span>
          <span className="text-[12px] text-ink-3">{formatLong(wod.fecha)}</span>
        </div>

        <h2 className="display mt-3 text-[34px] text-balance">{wod.titulo}</h2>

        {/* Métricas */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat icon={<Clock size={13} />} label="Duración" value={wod.duration || "—"} />
          <Stat icon={<Gauge size={13} />} label="Volumen" value={wod.volume || "—"} />
          <Stat
            icon={<span className="h-2 w-2 rounded-full" style={{ background: INTENSITY_COLOR[wod.intensity] }} />}
            label="Nivel"
            value={INTENSITY_LABEL[wod.intensity]}
            valueColor={INTENSITY_COLOR[wod.intensity]}
          />
        </div>

        {muscles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {muscles.map((m) => (
              <Tag key={m}>{MUSCLE_LABEL[m]}</Tag>
            ))}
          </div>
        )}

        {wod.notes && (
          <div className="mt-4 rounded-[var(--radius-sm)] border-l-2 border-accent bg-surface p-3.5">
            <div className="mono mb-1 text-[10px] tracking-wider text-ink-3 uppercase">
              Nota del coach
            </div>
            <p className="text-[14px] leading-relaxed text-ink-2">{wod.notes}</p>
          </div>
        )}

        {/* Bloques */}
        <div className="mt-5 space-y-4">
          {BLOCKS.map(({ key, label }) => {
            const raw = wod[key];
            if (typeof raw !== "string" || !raw.trim()) return null;
            const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
            return (
              <div key={key}>
                <div className="mono mb-2 text-[10px] font-semibold tracking-[0.14em] text-ink-3 uppercase">
                  {label}
                </div>
                <ol className="space-y-1.5">
                  {lines.map((line, i) => (
                    <li
                      key={i}
                      className="flex gap-3 rounded-[var(--radius-xs)] bg-surface px-3 py-2.5"
                    >
                      <span className="mono mt-px w-4 shrink-0 text-[12px] text-ink-3">
                        {i + 1}
                      </span>
                      <span className="text-[14px] leading-snug">{line}</span>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>

        {/* Acciones */}
        <div className="sticky bottom-0 mt-6 flex gap-2 bg-linear-to-t from-bg-elev via-bg-elev pt-4 pb-1">
          <Button
            variant={done ? "secondary" : "primary"}
            full
            onClick={() => onToggleDone?.(wod)}
          >
            <Check size={16} />
            {done ? "Hecho — desmarcar" : "Marcar como hecho"}
          </Button>
          <Link href="/herramientas/timer" aria-label="Abrir timer">
            <Button variant="secondary" className="aspect-square px-0">
              <TimerIcon size={17} />
            </Button>
          </Link>
        </div>
      </div>
    </Sheet>
  );
}

function Stat({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-[var(--radius-sm)] bg-surface p-3">
      <div className="mono flex items-center gap-1 text-[10px] tracking-wider text-ink-3 uppercase">
        {icon}
        {label}
      </div>
      <div
        className="mt-1 truncate text-[14px] font-semibold"
        style={valueColor ? { color: valueColor } : undefined}
        title={value}
      >
        {value}
      </div>
    </div>
  );
}
