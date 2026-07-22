"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Megaphone, X } from "lucide-react";
import { useActiveAnnouncements } from "@/lib/hooks";
import { ANNOUNCEMENT_TONE } from "@/lib/types";

const DISMISS_KEY = "mh-dismissed-announcements";

function readDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) || "[]");
  } catch {
    return [];
  }
}

/**
 * Muestra los avisos que el coach ha lanzado desde el panel. El atleta puede
 * descartarlos y no vuelven a salir (guardamos los ids descartados en local).
 */
export function AnnouncementBanner() {
  const announcements = useActiveAnnouncements();
  // Inicialización perezosa: leemos localStorage una vez, sin efecto.
  const [dismissed, setDismissed] = useState<string[]>(readDismissed);

  const dismiss = (id: string) => {
    const next = [...dismissed, id];
    setDismissed(next);
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify(next));
    } catch {
      /* Sin almacenamiento: se volverá a mostrar; no es grave. */
    }
  };

  const visible = announcements.filter((a) => !dismissed.includes(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="mt-4 space-y-2 px-5">
      <AnimatePresence initial={false}>
        {visible.map((a) => {
          const tone = ANNOUNCEMENT_TONE[a.tone ?? "info"];
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="relative overflow-hidden rounded-[var(--radius-md)] border border-line-soft bg-surface p-4"
            >
              <span
                className="absolute inset-y-0 left-0 w-[3px]"
                style={{ background: tone.color }}
                aria-hidden
              />
              <div className="flex items-start gap-3 pl-2">
                <Megaphone size={16} className="mt-0.5 shrink-0" style={{ color: tone.color }} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold">{a.title}</span>
                    <span
                      className="mono rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase"
                      style={{
                        color: tone.color,
                        background: `color-mix(in srgb, ${tone.color} 14%, transparent)`,
                      }}
                    >
                      {tone.label}
                    </span>
                  </div>
                  {a.body && (
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{a.body}</p>
                  )}
                </div>
                <button
                  onClick={() => dismiss(a.id)}
                  aria-label="Descartar"
                  className="shrink-0 p-0.5 text-ink-3 transition-colors hover:text-ink"
                >
                  <X size={15} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
