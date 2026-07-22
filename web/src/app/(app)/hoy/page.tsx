"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Flame } from "lucide-react";
import { motion } from "motion/react";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { RestCard, WodCard } from "@/components/WodCard";
import { WodSheet } from "@/components/WodSheet";
import { PageFade, Skeleton } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { logSession, unlogSession } from "@/lib/data";
import { useMonthWods, useSessions, useWeeklyLoad } from "@/lib/hooks";
import { LOAD_COLOR, loadLevel, primaryMuscles } from "@/lib/muscles";
import { MUSCLE_GROUPS, type Wod } from "@/lib/types";
import {
  DIAS_CORTO,
  MESES,
  addDays,
  cn,
  parseISODate,
  saludo,
  startOfWeek,
  toISODate,
  todayISO,
} from "@/lib/utils";

export default function HoyPage() {
  const { user, profile } = useAuth();
  const today = todayISO();
  const [selectedDate, setSelectedDate] = useState(today);
  const [openWod, setOpenWod] = useState<Wod | null>(null);

  const month = useMemo(() => selectedDate.slice(0, 7), [selectedDate]);
  const { wods, loading } = useMonthWods(month);
  const sessions = useSessions();
  const { load, sessions: weekSessions } = useWeeklyLoad();

  const doneIds = useMemo(
    () => new Set(sessions.map((s) => `${s.fecha}_${s.wodId ?? ""}`)),
    [sessions],
  );
  const isDone = (w: Wod) => doneIds.has(`${w.fecha}_${w.id}`);

  const dayWods = useMemo(
    () => wods.filter((w) => w.fecha === selectedDate),
    [wods, selectedDate],
  );

  // Días de la semana en curso, con marca si tienen entreno.
  const week = useMemo(() => {
    const start = startOfWeek(parseISODate(selectedDate) ?? new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i);
      const iso = toISODate(d);
      return {
        iso,
        dayNum: d.getDate(),
        dayName: DIAS_CORTO[d.getDay()],
        hasWod: wods.some((w) => w.fecha === iso),
        isToday: iso === today,
      };
    });
  }, [selectedDate, wods, today]);

  const toggleDone = async (w: Wod) => {
    if (!user) return;
    const id = `${w.fecha}_${w.id}`.replace(/[/\s.#$[\]]/g, "-");
    if (isDone(w)) {
      await unlogSession(user.uid, id);
    } else {
      await logSession(user.uid, {
        fecha: w.fecha,
        wodId: w.id,
        titulo: w.titulo,
        sport: w.sport,
        intensity: w.intensity,
        muscles: primaryMuscles(w, 8),
      });
    }
  };

  // Resumen de carga: zonas más cargadas de la semana.
  const hottest = useMemo(() => {
    return MUSCLE_GROUPS.filter((m) => m !== "cardio")
      .map((m) => ({ m, v: load[m] ?? 0 }))
      .filter((x) => x.v > 0)
      .sort((a, b) => b.v - a.v)
      .slice(0, 3);
  }, [load]);

  const sessionsThisWeek = weekSessions.length;
  const firstName = (profile?.name || user?.displayName || "").split(" ")[0];
  const selectedDateObj = parseISODate(selectedDate);

  return (
    <PageFade>
      <header className="px-5 pt-[max(20px,env(safe-area-inset-top))]">
        <div className="flex items-end justify-between">
          <div>
            <p className="mono text-[11px] tracking-[0.16em] text-ink-3 uppercase">
              {saludo()}
            </p>
            <h1 className="display mt-1 text-[38px]">
              {firstName || "Atleta"}
            </h1>
          </div>
          <Link
            href="/cuerpo"
            className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[12px] font-semibold text-ink-2 transition-colors hover:text-ink"
          >
            <Flame size={13} />
            {sessionsThisWeek} esta semana
          </Link>
        </div>
      </header>

      {/* Avisos del coach */}
      <AnnouncementBanner />

      {/* Tira de la semana */}
      <div className="no-sb mt-5 flex gap-2 overflow-x-auto px-5">
        {week.map((d) => {
          const active = d.iso === selectedDate;
          return (
            <button
              key={d.iso}
              onClick={() => setSelectedDate(d.iso)}
              className={cn(
                "relative flex h-[68px] w-[52px] shrink-0 flex-col items-center justify-center gap-1 rounded-[var(--radius-sm)] border transition-colors",
                active
                  ? "border-ink bg-ink text-bg"
                  : "border-line-soft bg-surface text-ink-2 hover:border-line",
              )}
            >
              <span className="mono text-[10px] opacity-70">{d.dayName}</span>
              <span className="text-[17px] font-semibold tnum">{d.dayNum}</span>
              <span
                className={cn(
                  "h-1 w-1 rounded-full",
                  d.hasWod
                    ? active
                      ? "bg-bg"
                      : "bg-accent"
                    : "bg-transparent",
                )}
              />
              {d.isToday && !active && (
                <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
              )}
            </button>
          );
        })}
      </div>

      {/* Entrenos del día */}
      <section className="mt-6 px-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[15px] font-semibold">
            {selectedDate === today
              ? "Hoy"
              : selectedDateObj
                ? `${selectedDateObj.getDate()} de ${MESES[selectedDateObj.getMonth()].toLowerCase()}`
                : ""}
          </h2>
          <Link
            href="/calendario"
            className="flex items-center gap-0.5 text-[13px] font-medium text-ink-3 transition-colors hover:text-ink"
          >
            Ver el mes
            <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        ) : dayWods.length === 0 ? (
          <RestCard />
        ) : (
          <div className="space-y-3">
            {dayWods.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <WodCard wod={w} done={isDone(w)} onClick={() => setOpenWod(w)} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Resumen de carga */}
      {hottest.length > 0 && (
        <section className="mt-6 px-5">
          <Link
            href="/cuerpo"
            className="flex items-center justify-between rounded-[var(--radius-md)] border border-line-soft bg-surface p-4 transition-colors hover:border-line"
          >
            <div className="min-w-0">
              <div className="mono text-[10px] tracking-[0.14em] text-ink-3 uppercase">
                Carga de la semana
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {hottest.map(({ m, v }) => {
                  const level = loadLevel(v);
                  return (
                    <span key={m} className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ background: LOAD_COLOR[level] }}
                      />
                      <span className="text-[13px] font-medium capitalize">{m}</span>
                    </span>
                  );
                })}
              </div>
            </div>
            <ChevronRight size={16} className="shrink-0 text-ink-3" />
          </Link>
        </section>
      )}

      <WodSheet
        wod={openWod}
        open={Boolean(openWod)}
        onClose={() => setOpenWod(null)}
        done={openWod ? isDone(openWod) : false}
        onToggleDone={toggleDone}
      />
    </PageFade>
  );
}
