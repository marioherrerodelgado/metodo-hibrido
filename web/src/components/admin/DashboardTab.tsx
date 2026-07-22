"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronRight, Dumbbell, Plus, Trash2 } from "lucide-react";
import { EmptyState, Input, SectionTitle, Skeleton } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { useCoachTasks } from "@/lib/hooks";
import { addCoachTask, deleteCoachTask, fetchAdminOverview, toggleCoachTask, type RecentActivity } from "@/lib/data";
import { agoLabel, clientStatus } from "@/lib/admin";
import { SPORT_COLOR, SPORT_LABEL, type ClientOverview } from "@/lib/types";
import { cn, todayISO, weekDates } from "@/lib/utils";

/** Pantalla de inicio del panel: lo que el coach mira de un vistazo. */
export function DashboardTab({ onGoClients }: { onGoClients: () => void }) {
  const [clients, setClients] = useState<ClientOverview[]>([]);
  const [recent, setRecent] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const week = weekDates();
    fetchAdminOverview(week[0], week[6], todayISO())
      .then((o) => {
        if (!alive) return;
        setClients(o.clients.filter((c) => c.role === "athlete"));
        setRecent(o.recent);
      })
      .catch(() => alive && setError("No se pueden leer los datos del panel."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const atRisk = useMemo(
    () =>
      clients
        .map((c) => ({ c, s: clientStatus(c) }))
        .filter((x) => x.s.level >= 2)
        .sort((a, b) => b.s.level - a.s.level)
        .slice(0, 5),
    [clients],
  );

  const weekTotal = clients.reduce((n, c) => n + c.weekSessions, 0);

  return (
    <div className="space-y-6">
      <TasksCard />

      {/* Números de la semana */}
      {loading ? (
        <Skeleton className="h-20" />
      ) : error ? (
        <EmptyState title="Sin acceso" hint={error} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Stat value={clients.length} label="Clientes" />
            <Stat value={weekTotal} label="Sesiones esta semana" />
            <Stat value={atRisk.length} label="A revisar" color="var(--load-3)" />
          </div>

          {/* Cumplimiento: a quién dar un toque */}
          <div>
            <SectionTitle
              action={
                <button
                  onClick={onGoClients}
                  className="flex items-center gap-0.5 text-[12px] font-medium text-ink-3 hover:text-ink"
                >
                  Ver todos
                  <ChevronRight size={13} />
                </button>
              }
            >
              Revisar cumplimiento
            </SectionTitle>
            {atRisk.length === 0 ? (
              <div className="rounded-[var(--radius-sm)] border border-line-soft bg-surface px-4 py-5 text-center text-[13px] text-ink-3">
                Todos tus clientes van al día. 💪
              </div>
            ) : (
              <div className="space-y-1.5">
                {atRisk.map(({ c, s }) => (
                  <div
                    key={c.uid}
                    className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-line-soft bg-surface px-3.5 py-3"
                  >
                    <AlertTriangle size={15} className="shrink-0" style={{ color: s.color }} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-medium">
                        {c.name || "Sin nombre"}
                      </div>
                      <div className="truncate text-[11px] text-ink-3">
                        {c.weekSessions} esta semana · última {agoLabel(c.daysSinceActive)}
                      </div>
                    </div>
                    <span
                      className="mono shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold uppercase"
                      style={{
                        color: s.color,
                        background: `color-mix(in srgb, ${s.color} 13%, transparent)`,
                      }}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actividad reciente */}
          <div>
            <SectionTitle>Actividad reciente</SectionTitle>
            {recent.length === 0 ? (
              <div className="rounded-[var(--radius-sm)] border border-line-soft bg-surface px-4 py-5 text-center text-[13px] text-ink-3">
                Sin actividad todavía.
              </div>
            ) : (
              <div className="space-y-1.5">
                {recent.slice(0, 8).map((r) => (
                  <div
                    key={`${r.uid}-${r.session.id}`}
                    className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-line-soft bg-surface px-3.5 py-2.5"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{
                        background: `color-mix(in srgb, ${SPORT_COLOR[r.session.sport]} 16%, transparent)`,
                        color: SPORT_COLOR[r.session.sport],
                      }}
                    >
                      <Dumbbell size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px]">
                        <span className="font-semibold">{r.name}</span>
                        <span className="text-ink-3"> · {r.session.titulo}</span>
                      </div>
                      <div className="text-[11px] text-ink-3">
                        {SPORT_LABEL[r.session.sport]}
                      </div>
                    </div>
                    <span className="mono shrink-0 text-[11px] text-ink-3">
                      {r.session.fecha.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tareas del coach ─────────────────────────────────────────────────────

function TasksCard() {
  const { user } = useAuth();
  const tasks = useCoachTasks();
  const [text, setText] = useState("");
  const pending = tasks.filter((t) => !t.done).length;

  const add = async () => {
    if (!user || !text.trim()) return;
    await addCoachTask(user.uid, text.trim());
    setText("");
  };

  return (
    <div className="rounded-[var(--radius-md)] border border-line-soft bg-surface p-4">
      <SectionTitle>
        Mis tareas{pending > 0 && ` · ${pending} pendientes`}
      </SectionTitle>

      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Llamar a Carlos, preparar el WOD del lunes..."
          className="flex-1"
        />
        <button
          onClick={add}
          disabled={!text.trim()}
          aria-label="Añadir tarea"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-ink text-bg transition-opacity disabled:opacity-40"
        >
          <Plus size={18} />
        </button>
      </div>

      {tasks.length > 0 && (
        <div className="mt-3 space-y-1">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 py-1.5">
              <button
                onClick={() => user && toggleCoachTask(user.uid, t.id, !t.done)}
                aria-label={t.done ? "Marcar pendiente" : "Completar"}
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                  t.done ? "border-ink bg-ink" : "border-line",
                )}
              >
                {t.done && <Check size={12} className="text-bg" strokeWidth={3} />}
              </button>
              <span
                className={cn(
                  "flex-1 text-[14px]",
                  t.done && "text-ink-3 line-through",
                )}
              >
                {t.text}
              </span>
              <button
                onClick={() => user && deleteCoachTask(user.uid, t.id)}
                aria-label="Eliminar tarea"
                className="shrink-0 p-1 text-ink-3 transition-colors hover:text-red-400"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-line-soft bg-surface p-3 text-center">
      <div className="display text-[26px] leading-none" style={color ? { color } : undefined}>
        {value}
      </div>
      <div className="mt-1 text-[11px] leading-tight text-ink-3">{label}</div>
    </div>
  );
}
