"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Check } from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import {
  EQUIPMENT_LABEL,
  MUSCLE_LABEL,
  SPORTS,
  SPORT_COLOR,
  SPORT_LABEL,
  type Equipment,
  type Level,
  type MuscleGroup,
  type Onboarding,
  type Sport,
} from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Test inicial. Seis pasos, todos saltables — el botón "Saltar" está siempre
 * visible y guarda `onboardingSkipped` para no volver a preguntar.
 */

type StepId = "sports" | "level" | "goal" | "days" | "equipment" | "limits";

const STEPS: StepId[] = ["sports", "level", "goal", "days", "equipment", "limits"];

const GOALS: { id: NonNullable<Onboarding["goal"]>; label: string; hint: string }[] = [
  { id: "hibrido", label: "Ser híbrido", hint: "Fuerte y con motor. El método completo." },
  { id: "fuerza", label: "Ganar fuerza", hint: "Más kilos en la barra." },
  { id: "resistencia", label: "Aguantar más", hint: "Correr y competir más lejos." },
  { id: "perder-grasa", label: "Perder grasa", hint: "Composición corporal." },
  { id: "competir", label: "Competir", hint: "Hyrox, DEKA o CrossFit." },
];

const LEVELS: { id: Level; label: string; hint: string }[] = [
  { id: "principiante", label: "Empiezo ahora", hint: "Menos de 6 meses entrenando." },
  { id: "intermedio", label: "Tengo base", hint: "Domino la técnica básica." },
  { id: "avanzado", label: "Avanzado", hint: "Años de entreno, compito o quiero hacerlo." },
];

const EQUIPMENT: Equipment[] = [
  "barra",
  "mancuernas",
  "kettlebell",
  "anillas",
  "cajon",
  "remo",
  "assault-bike",
  "cinta",
  "sled",
  "sandbag",
  "comba",
  "sin-material",
];

const LIMB_ZONES: MuscleGroup[] = [
  "hombros",
  "espalda",
  "core",
  "gluteos",
  "cuadriceps",
  "isquios",
  "gemelos",
];

export default function OnboardingPage() {
  const { user, profile, loading, updateProfileDoc } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Onboarding>({
    sports: [],
    equipment: [],
    limitations: [],
    daysPerWeek: 4,
    sessionMinutes: 60,
  });

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (profile?.onboardingDone || profile?.onboardingSkipped) router.replace("/hoy");
  }, [user, profile, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner size={22} />
      </div>
    );
  }

  const finish = async (skipped: boolean) => {
    setSaving(true);
    await updateProfileDoc(
      skipped
        ? { onboardingSkipped: true }
        : {
            onboarding: { ...data, updatedAt: Date.now() },
            onboardingDone: true,
            goals: data.sports?.length ? data.sports : ["all"],
          },
    );
    router.replace("/hoy");
  };

  const next = () => {
    if (step === STEPS.length - 1) finish(false);
    else setStep((s) => s + 1);
  };

  const toggle = <T,>(list: T[] | undefined, v: T): T[] => {
    const arr = list ?? [];
    return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
  };

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Progreso */}
      <div className="px-5 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            aria-label="Anterior"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-ink-2 transition-opacity disabled:opacity-25"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full bg-ink"
            />
          </div>
          <button
            onClick={() => finish(true)}
            className="shrink-0 text-[13px] font-semibold text-ink-3 transition-colors hover:text-ink"
          >
            Saltar
          </button>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col px-5 pb-[max(24px,env(safe-area-inset-bottom))]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-1 flex-col pt-8"
          >
            {current === "sports" && (
              <Step
                title="¿Qué te mueve?"
                hint="Puedes elegir varias. Adaptamos tu plan a lo que quieras preparar."
              >
                <div className="space-y-2">
                  {SPORTS.filter((s) => s !== "movilidad").map((s) => (
                    <Choice
                      key={s}
                      selected={data.sports?.includes(s) ?? false}
                      color={SPORT_COLOR[s]}
                      onClick={() =>
                        setData((d) => ({ ...d, sports: toggle(d.sports, s as Sport) }))
                      }
                      label={SPORT_LABEL[s]}
                    />
                  ))}
                </div>
              </Step>
            )}

            {current === "level" && (
              <Step title="¿Por dónde andas?" hint="Sin postureo: así calibramos las cargas.">
                <div className="space-y-2">
                  {LEVELS.map((l) => (
                    <Choice
                      key={l.id}
                      selected={data.level === l.id}
                      onClick={() => setData((d) => ({ ...d, level: l.id }))}
                      label={l.label}
                      hint={l.hint}
                    />
                  ))}
                </div>
              </Step>
            )}

            {current === "goal" && (
              <Step title="¿Cuál es el objetivo?" hint="El principal. Solo uno.">
                <div className="space-y-2">
                  {GOALS.map((g) => (
                    <Choice
                      key={g.id}
                      selected={data.goal === g.id}
                      onClick={() => setData((d) => ({ ...d, goal: g.id }))}
                      label={g.label}
                      hint={g.hint}
                    />
                  ))}
                </div>
              </Step>
            )}

            {current === "days" && (
              <Step title="¿Cuánto tiempo tienes?" hint="Sé realista. Un plan que no cabe en tu semana no sirve.">
                <div className="space-y-8 pt-4">
                  <Counter
                    label="Días por semana"
                    value={data.daysPerWeek ?? 4}
                    min={1}
                    max={7}
                    onChange={(v) => setData((d) => ({ ...d, daysPerWeek: v }))}
                  />
                  <Counter
                    label="Minutos por sesión"
                    value={data.sessionMinutes ?? 60}
                    min={20}
                    max={150}
                    step={15}
                    suffix=" min"
                    onChange={(v) => setData((d) => ({ ...d, sessionMinutes: v }))}
                  />
                </div>
              </Step>
            )}

            {current === "equipment" && (
              <Step title="¿Con qué cuentas?" hint="La IA solo prescribirá lo que puedas hacer de verdad.">
                <div className="grid grid-cols-2 gap-2">
                  {EQUIPMENT.map((e) => (
                    <Choice
                      key={e}
                      compact
                      selected={data.equipment?.includes(e) ?? false}
                      onClick={() =>
                        setData((d) => ({ ...d, equipment: toggle(d.equipment, e) }))
                      }
                      label={EQUIPMENT_LABEL[e]}
                    />
                  ))}
                </div>
              </Step>
            )}

            {current === "limits" && (
              <Step
                title="¿Algo que cuidar?"
                hint="Zonas con molestias o lesiones. Las esquivaremos al proponerte trabajo."
              >
                <div className="grid grid-cols-2 gap-2">
                  {LIMB_ZONES.map((m) => (
                    <Choice
                      key={m}
                      compact
                      selected={data.limitations?.includes(m) ?? false}
                      onClick={() =>
                        setData((d) => ({ ...d, limitations: toggle(d.limitations, m) }))
                      }
                      label={MUSCLE_LABEL[m]}
                    />
                  ))}
                </div>
              </Step>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="pt-6">
          <Button full size="lg" loading={saving} onClick={next}>
            {step === STEPS.length - 1 ? "Empezar" : "Siguiente"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Piezas ───────────────────────────────────────────────────────────────

function Step({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="display text-[40px] leading-[0.95] text-balance">{title}</h1>
      <p className="mt-3 mb-7 text-[14px] leading-relaxed text-ink-3">{hint}</p>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Choice({
  selected,
  onClick,
  label,
  hint,
  color,
  compact,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
  color?: string;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border text-left transition-all duration-150 active:scale-[0.985]",
        compact ? "px-3.5 py-3" : "px-4 py-4",
        selected
          ? "border-ink bg-surface"
          : "border-line-soft bg-transparent hover:border-line",
      )}
    >
      <span className="flex min-w-0 items-center gap-3">
        {color && (
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: color }}
          />
        )}
        <span className="min-w-0">
          <span
            className={cn(
              "block truncate font-semibold",
              compact ? "text-[13px]" : "text-[16px]",
              selected ? "text-ink" : "text-ink-2",
            )}
          >
            {label}
          </span>
          {hint && <span className="mt-0.5 block text-[12px] text-ink-3">{hint}</span>}
        </span>
      </span>

      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border transition-colors",
          compact ? "h-5 w-5" : "h-6 w-6",
          selected ? "border-ink bg-ink" : "border-line",
        )}
      >
        {selected && <Check size={compact ? 12 : 14} className="text-bg" strokeWidth={3} />}
      </span>
    </button>
  );
}

function Counter({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mono mb-3 text-[11px] tracking-widest text-ink-3 uppercase">
        {label}
      </div>
      <div className="flex items-center justify-between">
        <RoundBtn
          onClick={() => onChange(Math.max(min, value - step))}
          disabled={value <= min}
          label="Menos"
        >
          −
        </RoundBtn>
        <span className="display text-[54px] tabular-nums">
          {value}
          <span className="text-[24px] text-ink-3">{suffix}</span>
        </span>
        <RoundBtn
          onClick={() => onChange(Math.min(max, value + step))}
          disabled={value >= max}
          label="Más"
        >
          +
        </RoundBtn>
      </div>
    </div>
  );
}

function RoundBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-12 w-12 items-center justify-center rounded-full border border-line text-[22px] text-ink-2 transition-all active:scale-90 disabled:opacity-25"
    >
      {children}
    </button>
  );
}
