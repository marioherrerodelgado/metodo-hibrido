"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2, Lock, Plus, Trash2, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { BodyMap } from "@/components/BodyMap";
import {
  Button,
  EmptyState,
  Field,
  Input,
  PageFade,
  Select,
  SectionTitle,
} from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { ALL_MOVEMENTS, MOVEMENT_CATEGORIES, SKILLS, SKILL_TIER_LABEL, movementColor } from "@/lib/catalog";
import { addLift, deleteLift, setSkills } from "@/lib/data";
import { useLifts, useSkills, useWeeklyLoad } from "@/lib/hooks";
import { useTheme } from "@/lib/theme";
import { LOAD_COLOR, loadLevel } from "@/lib/muscles";
import { MUSCLE_GROUPS, MUSCLE_LABEL } from "@/lib/types";
import { cn, estimate1RM, todayISO } from "@/lib/utils";

type Tab = "carga" | "cargas" | "skills";

export default function CuerpoPage() {
  const [tab, setTab] = useState<Tab>("carga");

  return (
    <PageFade>
      <header className="px-5 pt-[max(20px,env(safe-area-inset-top))]">
        <h1 className="display text-[38px]">Cuerpo</h1>
        <p className="mt-1 text-[13px] text-ink-3">
          Cómo va tu carga, tus kilos y tus skills.
        </p>

        <div className="mt-3 flex rounded-full border border-line p-0.5">
          {(
            [
              ["carga", "Carga"],
              ["cargas", "Kilos"],
              ["skills", "Skills"],
            ] as const
          ).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-full py-2 text-[13px] font-semibold transition-colors",
                tab === t ? "bg-ink text-bg" : "text-ink-3 hover:text-ink-2",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-5 px-5">
        {tab === "carga" && <CargaTab />}
        {tab === "cargas" && <KilosTab />}
        {tab === "skills" && <SkillsTab />}
      </div>
    </PageFade>
  );
}

// ─── Mapa de carga semanal ────────────────────────────────────────────────

function CargaTab() {
  const { load, detail, sessions } = useWeeklyLoad();

  const ranked = useMemo(
    () =>
      MUSCLE_GROUPS.map((m) => ({ m, v: load[m] ?? 0 }))
        .filter((x) => x.v > 0)
        .sort((a, b) => b.v - a.v),
    [load],
  );

  return (
    <div className="space-y-6">
      <BodyMap load={load} detail={detail} />

      <div>
        <SectionTitle>Esta semana</SectionTitle>
        {sessions.length === 0 ? (
          <EmptyState
            title="Aún no has marcado ningún entreno"
            hint="Marca una sesión como hecha en Hoy y verás cómo se carga tu cuerpo."
          />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-line-soft bg-surface px-4 py-3">
              <span className="text-[13px] text-ink-2">Sesiones completadas</span>
              <span className="display text-[22px]">{sessions.length}</span>
            </div>

            {ranked.map(({ m, v }) => {
              const level = loadLevel(v);
              const pct = Math.min(100, (v / 4) * 100);
              return (
                <div
                  key={m}
                  className="rounded-[var(--radius-sm)] border border-line-soft bg-surface px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium">{MUSCLE_LABEL[m]}</span>
                    <span
                      className="mono text-[11px]"
                      style={{ color: LOAD_COLOR[level] }}
                    >
                      {v.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full"
                      style={{ background: LOAD_COLOR[level] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Kilos / 1RM ──────────────────────────────────────────────────────────

const CHART = {
  light: { grid: "#e4e1db", tick: "#8b8b82", tip: "#ffffff", tipLine: "#dedad3", ref: "#a1a1a8" },
  dark: { grid: "#23232a", tick: "#6b6b74", tip: "#101013", tipLine: "#2a2a31", ref: "#6b6b74" },
} as const;

function KilosTab() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const c = CHART[theme];
  const lifts = useLifts();
  const [movement, setMovement] = useState("Back Squat");
  const [form, setForm] = useState({
    movement: "Back Squat",
    weight: "",
    reps: "",
    date: todayISO(),
  });
  const [saving, setSaving] = useState(false);

  const entries = useMemo(
    () =>
      lifts
        .filter((l) => l.movement === movement)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [lifts, movement],
  );

  const chartData = useMemo(
    () =>
      entries.map((e) => ({
        date: e.date.slice(5),
        peso: e.weight,
        e1rm: estimate1RM(e.weight, e.reps),
      })),
    [entries],
  );

  const best = useMemo(() => {
    const vals = entries.map((e) => estimate1RM(e.weight, e.reps));
    return vals.length ? Math.max(...vals) : null;
  }, [entries]);

  const color = movementColor(movement);

  const submit = async () => {
    if (!user || !form.weight || !form.reps) return;
    setSaving(true);
    try {
      await addLift(user.uid, {
        movement: form.movement,
        weight: parseFloat(form.weight),
        reps: parseInt(form.reps, 10),
        date: form.date,
      });
      setMovement(form.movement);
      setForm((f) => ({ ...f, weight: "", reps: "" }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Nueva marca */}
      <div className="rounded-[var(--radius-md)] border border-line-soft bg-surface p-4">
        <SectionTitle>Nueva marca</SectionTitle>

        <Field label="Movimiento" className="mb-3">
          <Select
            value={form.movement}
            onChange={(e) => setForm((f) => ({ ...f, movement: e.target.value }))}
          >
            {Object.entries(MOVEMENT_CATEGORIES).map(([k, cat]) => (
              <optgroup key={k} label={cat.label}>
                {cat.movements.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>

        <div className="mb-3 grid grid-cols-3 gap-2">
          <Field label="Peso (kg)">
            <Input
              type="number"
              inputMode="decimal"
              step="0.5"
              placeholder="0"
              value={form.weight}
              onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
            />
          </Field>
          <Field label="Reps">
            <Input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={form.reps}
              onChange={(e) => setForm((f) => ({ ...f, reps: e.target.value }))}
            />
          </Field>
          <Field label="Fecha">
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </Field>
        </div>

        <Button full onClick={submit} loading={saving} disabled={!form.weight || !form.reps}>
          <Plus size={16} />
          Añadir marca
        </Button>
      </div>

      {/* Progreso */}
      <div className="rounded-[var(--radius-md)] border border-line-soft bg-surface p-4">
        <Field label="Ver progreso de" className="mb-4">
          <Select value={movement} onChange={(e) => setMovement(e.target.value)}>
            {ALL_MOVEMENTS.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="mb-3 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} style={{ color }} />
            <span className="text-[15px] font-semibold">{movement}</span>
          </div>
          {best !== null && (
            <div className="text-right">
              <div className="mono text-[10px] tracking-wider text-ink-3 uppercase">
                1RM estimado
              </div>
              <div className="display text-[26px]" style={{ color }}>
                {best} kg
              </div>
            </div>
          )}
        </div>

        {chartData.length > 1 ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 6, right: 6, left: -18, bottom: 0 }}>
                <CartesianGrid stroke={c.grid} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: c.tick, fontSize: 11 }}
                  axisLine={{ stroke: c.grid }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: c.tick, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  unit="kg"
                />
                <Tooltip
                  contentStyle={{
                    background: c.tip,
                    border: `1px solid ${c.tipLine}`,
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: c.tick }}
                />
                <Line
                  type="monotone"
                  dataKey="peso"
                  name="Peso levantado"
                  stroke={color}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: color }}
                />
                <Line
                  type="monotone"
                  dataKey="e1rm"
                  name="1RM estimado"
                  stroke={c.ref}
                  strokeWidth={1.4}
                  strokeDasharray="4 3"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            title="Faltan datos"
            hint="Añade al menos 2 marcas de este movimiento para ver la curva."
          />
        )}
      </div>

      {/* Histórico */}
      {entries.length > 0 && (
        <div>
          <SectionTitle>Histórico</SectionTitle>
          <div className="space-y-1.5">
            {[...entries].reverse().map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-[var(--radius-xs)] bg-surface px-3.5 py-2.5"
              >
                <span className="mono text-[12px] text-ink-3">{e.date}</span>
                <span className="mono text-[13px] font-semibold">
                  {e.weight} kg × {e.reps}
                </span>
                <button
                  onClick={() => user && deleteLift(user.uid, e.id)}
                  aria-label="Eliminar marca"
                  className="p-1 text-ink-3 transition-colors hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Skills ───────────────────────────────────────────────────────────────

function SkillsTab() {
  const { user } = useAuth();
  const skills = useSkills();
  const unlocked = Object.keys(skills).length;

  const toggle = async (id: string) => {
    if (!user) return;
    const next = { ...skills };
    if (next[id]) delete next[id];
    else next[id] = todayISO();
    await setSkills(user.uid, next);
  };

  const tiers = [1, 2, 3] as const;

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius-md)] border border-line-soft bg-surface p-5">
        <div className="flex items-end justify-between">
          <div>
            <div className="mono text-[10px] tracking-wider text-ink-3 uppercase">
              Desbloqueados
            </div>
            <div className="display mt-1 text-[40px]">
              {unlocked}
              <span className="text-ink-3">/{SKILLS.length}</span>
            </div>
          </div>
          <div className="mb-1 text-right text-[12px] text-ink-3">
            {Math.round((unlocked / SKILLS.length) * 100)}% del camino
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(unlocked / SKILLS.length) * 100}%` }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-accent"
          />
        </div>
      </div>

      {tiers.map((tier) => (
        <div key={tier}>
          <SectionTitle>{SKILL_TIER_LABEL[tier]}</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            {SKILLS.filter((s) => s.tier === tier).map((s) => {
              const on = Boolean(skills[s.id]);
              return (
                <button
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className={cn(
                    "flex flex-col gap-2 rounded-[var(--radius-md)] border p-4 text-left transition-colors active:scale-[0.98]",
                    on
                      ? "border-accent/60 bg-accent/8"
                      : "border-line-soft bg-surface hover:border-line",
                  )}
                >
                  <div className="flex items-center justify-between">
                    {on ? (
                      <CheckCircle2 size={17} className="text-accent" />
                    ) : (
                      <Lock size={15} className="text-ink-3" />
                    )}
                    <span className="mono text-[9px] text-ink-3 uppercase">{s.cat}</span>
                  </div>
                  <div
                    className={cn(
                      "text-[13px] leading-tight font-semibold text-balance",
                      on ? "text-ink" : "text-ink-2",
                    )}
                  >
                    {s.name}
                  </div>
                  <div
                    className={cn(
                      "mono text-[10px]",
                      on ? "text-accent" : "text-ink-3",
                    )}
                  >
                    {on ? skills[s.id] : "bloqueado"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
