"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Sparkles, X } from "lucide-react";
import { Sheet } from "@/components/Sheet";
import { WodCard } from "@/components/WodCard";
import { WodSheet } from "@/components/WodSheet";
import {
  Button,
  EmptyState,
  Field,
  Input,
  PageFade,
  Pill,
  Select,
  SectionTitle,
  Skeleton,
  Textarea,
} from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { createWod, fetchAllWods, logSession } from "@/lib/data";
import { useSessions, useWeeklyLoad } from "@/lib/hooks";
import { inferMuscles, loadLevel, primaryMuscles, wodText } from "@/lib/muscles";
import { EQUIPMENT_LABEL, MUSCLE_GROUPS, MUSCLE_LABEL, SPORTS, SPORT_COLOR, SPORT_LABEL, type Equipment, type MuscleGroup, type Sport, type Wod } from "@/lib/types";
import { normalize, todayISO } from "@/lib/utils";

export default function BuscarPage() {
  const { user, profile } = useAuth();
  const [all, setAll] = useState<Wod[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [sport, setSport] = useState<Sport | "all">("all");
  const [muscle, setMuscle] = useState<MuscleGroup | "all">("all");
  const [openWod, setOpenWod] = useState<Wod | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const sessions = useSessions();
  const doneIds = useMemo(
    () => new Set(sessions.map((s) => `${s.fecha}_${s.wodId ?? ""}`)),
    [sessions],
  );

  const uid = user?.uid ?? null;

  useEffect(() => {
    let alive = true;
    fetchAllWods(uid)
      .then((w) => alive && setAll(w))
      .catch(() => alive && setAll([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [uid]);

  const results = useMemo(() => {
    const query = normalize(q);
    return all.filter((w) => {
      if (sport !== "all" && w.sport !== sport) return false;
      if (muscle !== "all") {
        const m = inferMuscles(w);
        if (!m[muscle] || m[muscle]! < 0.6) return false;
      }
      if (!query) return true;
      return normalize(wodText(w)).includes(query);
    });
  }, [all, q, sport, muscle]);

  const markDone = async (w: Wod) => {
    if (!user) return;
    await logSession(user.uid, {
      fecha: todayISO(),
      wodId: w.id,
      titulo: w.titulo,
      sport: w.sport,
      intensity: w.intensity,
      muscles: primaryMuscles(w, 8),
    });
  };

  return (
    <PageFade>
      <header className="px-5 pt-[max(20px,env(safe-area-inset-top))]">
        <h1 className="display text-[38px]">Buscar</h1>
        <p className="mt-1 text-[13px] text-ink-3">
          Encuentra un entreno del archivo o pide uno nuevo a la IA.
        </p>

        <div className="relative mt-4">
          <Search
            size={16}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-3"
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Thruster, tirada larga, pierna..."
            className="pl-10"
            aria-label="Buscar entrenamiento"
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

        <Button full className="mt-3" onClick={() => setAiOpen(true)}>
          <Sparkles size={16} />
          Crear entrenamiento con IA
        </Button>
      </header>

      {/* Filtros */}
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

      <div className="no-sb mt-2 flex gap-2 overflow-x-auto px-5">
        <Pill active={muscle === "all"} onClick={() => setMuscle("all")}>
          Todo el cuerpo
        </Pill>
        {MUSCLE_GROUPS.map((m) => (
          <Pill key={m} active={muscle === m} onClick={() => setMuscle(m)}>
            {MUSCLE_LABEL[m]}
          </Pill>
        ))}
      </div>

      {/* Resultados */}
      <div className="mt-5 px-5">
        <SectionTitle>
          {loading ? "Buscando" : `${results.length} resultado${results.length === 1 ? "" : "s"}`}
        </SectionTitle>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-36" />
            <Skeleton className="h-36" />
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={<Search size={26} />}
            title="Nada por aquí"
            hint="Prueba con otro término, o pide a la IA un entreno a medida."
            action={
              <Button variant="secondary" size="sm" onClick={() => setAiOpen(true)}>
                <Sparkles size={14} />
                Generar con IA
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {results.slice(0, 40).map((w) => (
              <WodCard
                key={w.id}
                wod={w}
                done={doneIds.has(`${w.fecha}_${w.id}`)}
                onClick={() => setOpenWod(w)}
              />
            ))}
            {results.length > 40 && (
              <p className="py-3 text-center text-[12px] text-ink-3">
                Mostrando 40 de {results.length}. Afina la búsqueda.
              </p>
            )}
          </div>
        )}
      </div>

      <WodSheet
        wod={openWod}
        open={Boolean(openWod)}
        onClose={() => setOpenWod(null)}
        done={openWod ? doneIds.has(`${openWod.fecha}_${openWod.id}`) : false}
        onToggleDone={markDone}
      />

      <AiSheet
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        defaultLevel={profile?.onboarding?.level}
        defaultEquipment={profile?.onboarding?.equipment}
      />
    </PageFade>
  );
}

// ─── Generador con IA ─────────────────────────────────────────────────────

function AiSheet({
  open,
  onClose,
  defaultLevel,
  defaultEquipment,
}: {
  open: boolean;
  onClose: () => void;
  defaultLevel?: "principiante" | "intermedio" | "avanzado";
  defaultEquipment?: Equipment[];
}) {
  const { user } = useAuth();
  const { load } = useWeeklyLoad();

  const [prompt, setPrompt] = useState("");
  const [sport, setSport] = useState<Sport>("crossfit");
  const [minutes, setMinutes] = useState(60);
  const [respectLoad, setRespectLoad] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Omit<Wod, "id" | "fecha" | "month"> | null>(null);
  const [saved, setSaved] = useState(false);

  // Zonas que la semana ya trae en rojo: la IA debe esquivarlas.
  const overloaded = useMemo(
    () =>
      MUSCLE_GROUPS.filter((m) => m !== "cardio" && loadLevel(load[m] ?? 0) === 3),
    [load],
  );

  const generate = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    setSaved(false);
    try {
      const res = await fetch("/api/generar-wod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          sport,
          minutes,
          level: defaultLevel,
          equipment: defaultEquipment,
          avoid: respectLoad ? overloaded : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error desconocido");
      setResult(data.wod);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se ha podido generar.");
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!result || !user) return;
    const fecha = todayISO();
    await createWod({
      ...result,
      fecha,
      month: fecha.slice(0, 7),
      source: "ai",
      ownerId: user.uid,
    });
    setSaved(true);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Entreno a medida">
      {!result ? (
        <div className="space-y-4 pb-4">
          <Field label="¿Qué quieres entrenar?">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej: pierna fuerte + metcon corto, tengo la espalda tocada de ayer"
              rows={3}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Disciplina">
              <Select value={sport} onChange={(e) => setSport(e.target.value as Sport)}>
                {SPORTS.map((s) => (
                  <option key={s} value={s}>
                    {SPORT_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Minutos">
              <Input
                type="number"
                inputMode="numeric"
                min={10}
                max={180}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </Field>
          </div>

          {overloaded.length > 0 && (
            <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-sm)] border border-line-soft bg-surface p-3.5">
              <input
                type="checkbox"
                checked={respectLoad}
                onChange={(e) => setRespectLoad(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]"
              />
              <span>
                <span className="block text-[13px] font-semibold">
                  Respetar mi carga semanal
                </span>
                <span className="mt-0.5 block text-[12px] text-ink-3">
                  Evitará {overloaded.map((m) => MUSCLE_LABEL[m].toLowerCase()).join(", ")}
                  , que llevas al rojo esta semana.
                </span>
              </span>
            </label>
          )}

          {defaultEquipment?.length ? (
            <p className="text-[12px] text-ink-3">
              Usará tu material: {defaultEquipment.map((e) => EQUIPMENT_LABEL[e]).join(", ")}.
            </p>
          ) : null}

          {error && (
            <div className="rounded-[var(--radius-sm)] border border-red-500/25 bg-red-500/8 p-3 text-[13px] text-red-300">
              {error}
            </div>
          )}

          <Button full loading={busy} disabled={prompt.trim().length < 3} onClick={generate}>
            <Sparkles size={16} />
            {busy ? "Diseñando la sesión..." : "Generar"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          <div>
            <span
              className="mono rounded-md px-2 py-1 text-[11px] font-semibold uppercase"
              style={{
                color: SPORT_COLOR[result.sport],
                background: `color-mix(in srgb, ${SPORT_COLOR[result.sport]} 14%, transparent)`,
              }}
            >
              {SPORT_LABEL[result.sport]}
            </span>
            <h3 className="display mt-2 text-[30px] text-balance">{result.titulo}</h3>
            <p className="mt-1 text-[13px] text-ink-3">
              {result.duration} · {result.volume}
            </p>
          </div>

          {(["warmup", "main", "metcon", "cooldown"] as const).map((k) => {
            const raw = result[k];
            if (!raw?.trim()) return null;
            return (
              <div key={k}>
                <div className="mono mb-2 text-[10px] tracking-wider text-ink-3 uppercase">
                  {
                    {
                      warmup: "Calentamiento",
                      main: "Parte principal",
                      metcon: "MetCon",
                      cooldown: "Vuelta a la calma",
                    }[k]
                  }
                </div>
                <ul className="space-y-1.5">
                  {raw
                    .split("\n")
                    .map((l) => l.trim())
                    .filter(Boolean)
                    .map((line, i) => (
                      <li
                        key={i}
                        className="rounded-[var(--radius-xs)] bg-surface px-3 py-2.5 text-[14px]"
                      >
                        {line}
                      </li>
                    ))}
                </ul>
              </div>
            );
          })}

          {result.notes && (
            <div className="rounded-[var(--radius-sm)] border-l-2 border-accent bg-surface p-3.5">
              <p className="text-[13px] leading-relaxed text-ink-2">{result.notes}</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setResult(null)}>
              Otro
            </Button>
            <Button full onClick={save} disabled={saved}>
              {saved ? "Guardado en tu plan" : "Guardar para hoy"}
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
