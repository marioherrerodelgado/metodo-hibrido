"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { EmptyState, Input, Pill, SectionTitle, Skeleton } from "@/components/ui";
import { agoLabel, clientStatus } from "@/lib/admin";
import { fetchAdminOverview } from "@/lib/data";
import type { ClientOverview } from "@/lib/types";
import { normalize, todayISO, weekDates } from "@/lib/utils";

/**
 * Lista de clientes con su cumplimiento de la semana. Lee las sesiones reales
 * de cada atleta (una consulta por cliente), así que solo se carga al abrir.
 */
export function ClientsTab() {
  const [clients, setClients] = useState<ClientOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [onlyRisk, setOnlyRisk] = useState(false);

  useEffect(() => {
    let alive = true;
    const week = weekDates();
    fetchAdminOverview(week[0], week[6], todayISO())
      .then(({ clients: all }) => {
        if (!alive) return;
        // Solo atletas; el equipo va en su propia pestaña.
        setClients(all.filter((c) => c.role === "athlete"));
      })
      .catch(() => {
        if (!alive) return;
        setError(
          "No se pueden leer los clientes. Revisa que tu usuario sea coach o admin y que las reglas de Firestore estén desplegadas.",
        );
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const query = normalize(q);
    return clients
      .map((c) => ({ c, s: clientStatus(c) }))
      .filter(({ c, s }) => {
        if (onlyRisk && s.level < 2) return false;
        if (!query) return true;
        return normalize(`${c.name} ${c.email}`).includes(query);
      })
      // A quien más lo necesita, arriba: primero los de mayor riesgo.
      .sort((a, b) => b.s.level - a.s.level || a.c.name.localeCompare(b.c.name));
  }, [clients, q, onlyRisk]);

  const atRisk = clients.filter((c) => clientStatus(c).level >= 2).length;

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  if (error) {
    return <EmptyState title="Sin acceso" hint={error} />;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <Stat value={clients.length} label="Clientes" />
        <Stat
          value={clients.filter((c) => clientStatus(c).level === 1).length}
          label="Al día"
          color="var(--load-1)"
        />
        <Stat value={atRisk} label="A revisar" color="var(--load-3)" />
      </div>

      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3"
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar cliente..."
          className="pl-10"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            aria-label="Limpiar"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-3 hover:text-ink"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <Pill active={!onlyRisk} onClick={() => setOnlyRisk(false)}>
          Todos
        </Pill>
        <Pill active={onlyRisk} onClick={() => setOnlyRisk(true)}>
          A revisar ({atRisk})
        </Pill>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={clients.length === 0 ? "Aún no hay clientes" : "Nadie por aquí"}
          hint={
            clients.length === 0
              ? "Cuando alguien se registre en la app, aparecerá aquí."
              : "Prueba con otro término o quita el filtro."
          }
        />
      ) : (
        <div className="space-y-1.5">
          <SectionTitle>{filtered.length} clientes</SectionTitle>
          {filtered.map(({ c, s }) => (
            <div
              key={c.uid}
              className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-line-soft bg-surface px-3.5 py-3"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold"
                style={{
                  background: `color-mix(in srgb, ${s.color} 16%, transparent)`,
                  color: s.color,
                }}
              >
                {(c.name || c.email || "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium">
                  {c.name || "Sin nombre"}
                </div>
                <div className="truncate text-[11px] text-ink-3">
                  {c.weekSessions} esta semana · última {agoLabel(c.daysSinceActive)}
                </div>
              </div>
              <span
                className="mono shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold tracking-wide uppercase"
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
      <div className="mt-1 text-[11px] text-ink-3">{label}</div>
    </div>
  );
}
