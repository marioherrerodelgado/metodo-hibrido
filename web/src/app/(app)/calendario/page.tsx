"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { WodCard } from "@/components/WodCard";
import { WodSheet } from "@/components/WodSheet";
import { EmptyState, PageFade, Pill, Skeleton } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { logSession, unlogSession } from "@/lib/data";
import { useCompetitions, useMonthWods, useSessions } from "@/lib/hooks";
import { primaryMuscles } from "@/lib/muscles";
import { SPORTS, SPORT_COLOR, SPORT_LABEL, type Sport, type Wod } from "@/lib/types";
import {
  MESES,
  MESES_CORTO,
  cn,
  formatLong,
  parseISODate,
  todayISO,
} from "@/lib/utils";

type Tab = "plan" | "competiciones";

export default function CalendarioPage() {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-11
  const [sport, setSport] = useState<Sport | "all">("all");
  const [tab, setTab] = useState<Tab>("plan");
  const [openWod, setOpenWod] = useState<Wod | null>(null);

  const key = `${year}-${String(month + 1).padStart(2, "0")}`;
  const { wods, loading } = useMonthWods(key);
  const sessions = useSessions();
  const comps = useCompetitions();
  const today = todayISO();

  const doneIds = useMemo(
    () => new Set(sessions.map((s) => `${s.fecha}_${s.wodId ?? ""}`)),
    [sessions],
  );
  const isDone = (w: Wod) => doneIds.has(`${w.fecha}_${w.id}`);

  const filtered = useMemo(
    () => (sport === "all" ? wods : wods.filter((w) => w.sport === sport)),
    [wods, sport],
  );

  const byDate = useMemo(() => {
    const map = new Map<string, Wod[]>();
    for (const w of filtered) {
      const list = map.get(w.fecha) ?? [];
      list.push(w);
      map.set(w.fecha, list);
    }
    return map;
  }, [filtered]);

  // Rejilla del mes (empieza en lunes)
  const grid = useMemo(() => {
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7; // 0 = lunes
    const cells: ({ day: number; iso: string } | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        iso: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      });
    }
    return cells;
  }, [year, month]);

  const shift = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  const toggleDone = async (w: Wod) => {
    if (!user) return;
    const id = `${w.fecha}_${w.id}`.replace(/[/\s.#$[\]]/g, "-");
    if (isDone(w)) await unlogSession(user.uid, id);
    else
      await logSession(user.uid, {
        fecha: w.fecha,
        wodId: w.id,
        titulo: w.titulo,
        sport: w.sport,
        intensity: w.intensity,
        muscles: primaryMuscles(w, 8),
      });
  };

  const upcoming = comps.filter((c) => c.date >= today);
  const past = comps.filter((c) => c.date < today).reverse();

  return (
    <PageFade>
      <header className="px-5 pt-[max(20px,env(safe-area-inset-top))]">
        <h1 className="display text-[38px]">Plan</h1>

        <div className="mt-3 flex rounded-full border border-line p-0.5">
          {(["plan", "competiciones"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-full py-2 text-[13px] font-semibold transition-colors",
                tab === t ? "bg-ink text-bg" : "text-ink-3 hover:text-ink-2",
              )}
            >
              {t === "plan" ? "Entrenamientos" : "Competiciones"}
            </button>
          ))}
        </div>
      </header>

      {tab === "plan" ? (
        <>
          {/* Selector de mes */}
          <div className="mt-5 flex items-center justify-between px-5">
            <button
              onClick={() => shift(-1)}
              aria-label="Mes anterior"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:text-ink"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-center">
              <div className="text-[17px] font-semibold">{MESES[month]}</div>
              <div className="mono text-[11px] text-ink-3">{year}</div>
            </div>
            <button
              onClick={() => shift(1)}
              aria-label="Mes siguiente"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:text-ink"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Rejilla */}
          <div className="mt-4 px-5">
            <div className="grid grid-cols-7 gap-1">
              {["L", "M", "X", "J", "V", "S", "D"].map((d, i) => (
                <div
                  key={i}
                  className="mono pb-1 text-center text-[10px] text-ink-3"
                >
                  {d}
                </div>
              ))}
              {grid.map((cell, i) => {
                if (!cell) return <div key={`e${i}`} />;
                const dayWods = byDate.get(cell.iso) ?? [];
                const isToday = cell.iso === today;
                const hasComp = comps.some((c) => c.date === cell.iso);

                return (
                  <button
                    key={cell.iso}
                    onClick={() => {
                      const el = document.getElementById(`d-${cell.iso}`);
                      el?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                    className={cn(
                      "relative flex aspect-square flex-col items-center justify-center gap-1 rounded-[10px] border text-[13px] transition-colors",
                      isToday
                        ? "border-ink bg-ink font-bold text-bg"
                        : dayWods.length
                          ? "border-line-soft bg-surface text-ink"
                          : "border-transparent text-ink-3",
                    )}
                  >
                    <span className="tnum">{cell.day}</span>
                    <span className="flex h-1 gap-0.5">
                      {dayWods.slice(0, 3).map((w) => (
                        <span
                          key={w.id}
                          className="h-1 w-1 rounded-full"
                          style={{
                            background: isToday ? "#08080a" : SPORT_COLOR[w.sport],
                          }}
                        />
                      ))}
                    </span>
                    {hasComp && (
                      <Trophy
                        size={9}
                        className="absolute top-1 right-1 text-accent"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtros de deporte */}
          <div className="no-sb mt-5 flex gap-2 overflow-x-auto px-5">
            <Pill active={sport === "all"} onClick={() => setSport("all")}>
              Todos
            </Pill>
            {SPORTS.map((s) => (
              <Pill
                key={s}
                active={sport === s}
                color={SPORT_COLOR[s]}
                onClick={() => setSport(s)}
              >
                {SPORT_LABEL[s]}
              </Pill>
            ))}
          </div>

          {/* Lista */}
          <div className="mt-5 space-y-5 px-5">
            {loading ? (
              <>
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </>
            ) : filtered.length === 0 ? (
              <EmptyState
                title="Sin entrenamientos este mes"
                hint={
                  sport === "all"
                    ? "Cuando tu coach suba el plan, aparecerá aquí."
                    : `No hay sesiones de ${SPORT_LABEL[sport]} en ${MESES[month]}.`
                }
              />
            ) : (
              [...byDate.entries()].map(([date, list]) => (
                <div key={date} id={`d-${date}`} className="scroll-mt-24">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[13px] font-semibold",
                        date === today ? "text-accent" : "text-ink-2",
                      )}
                    >
                      {formatLong(date)}
                      {date === today && " — hoy"}
                    </span>
                    <span className="h-px flex-1 bg-line-soft" />
                  </div>
                  <div className="space-y-3">
                    {list.map((w) => (
                      <WodCard
                        key={w.id}
                        wod={w}
                        done={isDone(w)}
                        onClick={() => setOpenWod(w)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="mt-5 space-y-6 px-5">
          {comps.length === 0 ? (
            <EmptyState
              icon={<Trophy size={28} />}
              title="Sin competiciones"
              hint="Aquí verás las carreras y eventos de la temporada."
            />
          ) : (
            <>
              {upcoming.length > 0 && (
                <CompSection title="Próximas" comps={upcoming} />
              )}
              {past.length > 0 && <CompSection title="Pasadas" comps={past} past />}
            </>
          )}
        </div>
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

function CompSection({
  title,
  comps,
  past,
}: {
  title: string;
  comps: ReturnType<typeof useCompetitions>;
  past?: boolean;
}) {
  return (
    <div>
      <h2 className="mono mb-3 text-[11px] tracking-[0.14em] text-ink-3 uppercase">
        {title}
      </h2>
      <div className="space-y-2">
        {comps.map((c) => {
          const d = parseISODate(c.date);
          const color = SPORT_COLOR[c.cat] ?? SPORT_COLOR.running;
          return (
            <div
              key={c.id ?? c.date + c.name}
              className={cn(
                "flex items-center gap-4 rounded-[var(--radius-md)] border border-line-soft bg-surface p-4",
                past && "opacity-45",
              )}
            >
              <div className="w-11 shrink-0 text-center">
                <div className="display text-[24px] leading-none">
                  {d?.getDate() ?? "—"}
                </div>
                <div className="mono mt-0.5 text-[10px] text-ink-3 uppercase">
                  {d ? MESES_CORTO[d.getMonth()] : ""}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold">{c.name}</div>
                <div className="truncate text-[12px] text-ink-3">
                  {c.lugar}
                  {c.note ? ` — ${c.note}` : ""}
                </div>
              </div>
              <span
                className="mono shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold"
                style={{
                  color,
                  background: `color-mix(in srgb, ${color} 13%, transparent)`,
                }}
              >
                {c.dist}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
