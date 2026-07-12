"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, ArrowLeft, Check, RotateCcw } from "lucide-react";
import { Button, PageFade } from "@/components/ui";
import { USE_LABEL, recommendShoes, type ShoeAnswers, type ShoeUse } from "@/lib/shoes";
import { cn } from "@/lib/utils";

const USES: ShoeUse[] = [
  "asfalto-diario",
  "asfalto-rapido",
  "trail",
  "cinta",
  "crossfit",
  "hyrox",
  "gimnasio-fuerza",
];

type Step =
  | "use"
  | "volume"
  | "weight"
  | "cushion"
  | "pronation"
  | "drop"
  | "wide"
  | "plate"
  | "budget";

/** El paso de placa solo aparece si corre rápido: preguntarlo siempre no aporta. */
function stepsFor(use: ShoeUse | null): Step[] {
  const base: Step[] = [
    "use",
    "volume",
    "weight",
    "cushion",
    "pronation",
    "drop",
    "wide",
  ];
  if (use === "asfalto-rapido") base.push("plate");
  base.push("budget");
  return base;
}

export default function ZapatillasPage() {
  const [i, setI] = useState(0);
  const [a, setA] = useState<Partial<ShoeAnswers>>({
    volume: 2,
    weight: 75,
    cushion: 2,
    pronation: "neutra",
    drop: "medio",
    wide: false,
    budget: 160,
    wantsPlate: false,
  });
  const [done, setDone] = useState(false);

  const steps = useMemo(() => stepsFor(a.use ?? null), [a.use]);
  const step = steps[i];

  const results = useMemo(
    () => (done && a.use ? recommendShoes(a as ShoeAnswers).slice(0, 3) : []),
    [done, a],
  );

  const next = () => {
    if (i === steps.length - 1) setDone(true);
    else setI((n) => n + 1);
  };

  const reset = () => {
    setDone(false);
    setI(0);
    setA({
      volume: 2,
      weight: 75,
      cushion: 2,
      pronation: "neutra",
      drop: "medio",
      wide: false,
      budget: 160,
      wantsPlate: false,
    });
  };

  if (done) {
    return (
      <PageFade>
        <Header title="Tus zapatillas" />
        <div className="space-y-4 px-5 pb-8">
          <p className="text-[13px] leading-relaxed text-ink-3">
            Ordenadas por lo cerca que quedan de lo que has contado. El porcentaje
            compara cada modelo con la que mejor te encaja, no es una nota absoluta.
          </p>

          {results.map((r, idx) => (
            <motion.div
              key={r.shoe.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "rounded-[var(--radius-md)] border p-5",
                idx === 0 ? "border-accent/50 bg-accent/6" : "border-line-soft bg-surface",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {idx === 0 && (
                    <span className="mono text-[10px] font-bold tracking-widest text-accent uppercase">
                      Tu opción
                    </span>
                  )}
                  <h3 className="display mt-1 text-[26px] leading-none">{r.shoe.name}</h3>
                  <p className="mt-1 text-[13px] text-ink-3">
                    {r.shoe.brand} · {r.shoe.price} € · {r.shoe.grams} g
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="display text-[28px] leading-none">{r.match}%</div>
                  <div className="mono text-[9px] tracking-wider text-ink-3 uppercase">
                    encaje
                  </div>
                </div>
              </div>

              <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{r.shoe.note}</p>

              <ul className="mt-3 space-y-1.5">
                {r.reasons.map((reason, n) => (
                  <li key={n} className="flex items-start gap-2 text-[13px] text-ink-2">
                    <Check size={13} className="mt-0.5 shrink-0 text-green-400" />
                    {reason}
                  </li>
                ))}
                {r.warnings.map((w, n) => (
                  <li key={`w${n}`} className="flex items-start gap-2 text-[13px] text-ink-3">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-400" />
                    {w}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          <Button variant="secondary" full onClick={reset}>
            <RotateCcw size={15} />
            Repetir el test
          </Button>
        </div>
      </PageFade>
    );
  }

  return (
    <PageFade>
      <Header title="Test de zapatillas" />

      <div className="px-5">
        <div className="h-1 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            animate={{ width: `${((i + 1) / steps.length) * 100}%` }}
            className="h-full rounded-full bg-ink"
          />
        </div>
      </div>

      <div className="px-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="pt-8"
          >
            {step === "use" && (
              <Q title="¿Para qué las quieres?" hint="Lo que vas a hacer con ellas el 80 % del tiempo.">
                {USES.map((u) => (
                  <Opt
                    key={u}
                    on={a.use === u}
                    onClick={() => setA((d) => ({ ...d, use: u }))}
                    label={USE_LABEL[u]}
                  />
                ))}
              </Q>
            )}

            {step === "volume" && (
              <Q title="¿Cuánto las vas a usar?">
                <Opt on={a.volume === 1} onClick={() => setA((d) => ({ ...d, volume: 1 }))} label="Poco" hint="1-2 sesiones por semana" />
                <Opt on={a.volume === 2} onClick={() => setA((d) => ({ ...d, volume: 2 }))} label="Bastante" hint="3-4 sesiones por semana" />
                <Opt on={a.volume === 3} onClick={() => setA((d) => ({ ...d, volume: 3 }))} label="Mucho" hint="5 o más, o +50 km semanales" />
              </Q>
            )}

            {step === "weight" && (
              <Q title="¿Cuánto pesas?" hint="Determina cuánta espuma necesitas y cuánto te durará.">
                <Slider
                  value={a.weight ?? 75}
                  min={45}
                  max={130}
                  suffix=" kg"
                  onChange={(v) => setA((d) => ({ ...d, weight: v }))}
                />
              </Q>
            )}

            {step === "cushion" && (
              <Q title="¿Cómo te gusta la pisada?">
                <Opt on={a.cushion === 1} onClick={() => setA((d) => ({ ...d, cushion: 1 }))} label="Seca y reactiva" hint="Quiero notar el suelo" />
                <Opt on={a.cushion === 2} onClick={() => setA((d) => ({ ...d, cushion: 2 }))} label="Equilibrada" hint="Ni muy blanda ni muy dura" />
                <Opt on={a.cushion === 3} onClick={() => setA((d) => ({ ...d, cushion: 3 }))} label="Blanda y protectora" hint="Que absorba todo" />
              </Q>
            )}

            {step === "pronation" && (
              <Q
                title="¿Se te va el tobillo hacia dentro?"
                hint="Míralas por detrás: si el talón de tus zapatillas viejas se desgasta por la parte interior, pronas."
              >
                <Opt on={a.pronation === "neutra"} onClick={() => setA((d) => ({ ...d, pronation: "neutra" }))} label="No, o no lo sé" hint="Pisada neutra" />
                <Opt on={a.pronation === "pronador"} onClick={() => setA((d) => ({ ...d, pronation: "pronador" }))} label="Sí, prono" hint="Necesito soporte" />
              </Q>
            )}

            {step === "drop" && (
              <Q title="¿Talón alto o bajo?" hint="El drop es la diferencia de altura entre talón y punta.">
                <Opt on={a.drop === "bajo"} onClick={() => setA((d) => ({ ...d, drop: "bajo" }))} label="Bajo (4-6 mm)" hint="Sensación natural. Exige gemelo fuerte." />
                <Opt on={a.drop === "medio"} onClick={() => setA((d) => ({ ...d, drop: "medio" }))} label="Medio (7-9 mm)" hint="El estándar. Si dudas, este." />
                <Opt on={a.drop === "alto"} onClick={() => setA((d) => ({ ...d, drop: "alto" }))} label="Alto (10+ mm)" hint="Alivia el tendón de Aquiles." />
              </Q>
            )}

            {step === "wide" && (
              <Q title="¿Tienes el pie ancho?" hint="Si se te duermen los dedos o notas presión en el metatarso, sí.">
                <Opt on={a.wide === false} onClick={() => setA((d) => ({ ...d, wide: false }))} label="Pie normal" />
                <Opt on={a.wide === true} onClick={() => setA((d) => ({ ...d, wide: true }))} label="Pie ancho" hint="Necesito horma amplia" />
              </Q>
            )}

            {step === "plate" && (
              <Q title="¿Compites?" hint="La placa de carbono te da unos segundos por km, pero es cara y dura poco.">
                <Opt on={a.wantsPlate === false} onClick={() => setA((d) => ({ ...d, wantsPlate: false }))} label="No, entreno" hint="Quiero algo que dure" />
                <Opt on={a.wantsPlate === true} onClick={() => setA((d) => ({ ...d, wantsPlate: true }))} label="Sí, busco marca" hint="Quiero placa de carbono" />
              </Q>
            )}

            {step === "budget" && (
              <Q title="¿Cuánto te quieres gastar?">
                <Slider
                  value={a.budget ?? 160}
                  min={80}
                  max={280}
                  step={10}
                  suffix=" €"
                  onChange={(v) => setA((d) => ({ ...d, budget: v }))}
                />
              </Q>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex gap-2 pb-8">
          {i > 0 && (
            <Button variant="secondary" onClick={() => setI((n) => n - 1)}>
              Atrás
            </Button>
          )}
          <Button full size="lg" disabled={step === "use" && !a.use} onClick={next}>
            {i === steps.length - 1 ? "Ver resultado" : "Siguiente"}
          </Button>
        </div>
      </div>
    </PageFade>
  );
}

function Header({ title }: { title: string }) {
  return (
    <header className="flex items-center gap-3 px-5 pt-[max(20px,env(safe-area-inset-top))] pb-5">
      <Link
        href="/perfil"
        aria-label="Volver"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2"
      >
        <ArrowLeft size={16} />
      </Link>
      <h1 className="text-[17px] font-semibold">{title}</h1>
    </header>
  );
}

function Q({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="display text-[34px] leading-[0.95] text-balance">{title}</h2>
      {hint && <p className="mt-2.5 text-[13px] leading-relaxed text-ink-3">{hint}</p>}
      <div className="mt-6 space-y-2">{children}</div>
    </div>
  );
}

function Opt({
  on,
  onClick,
  label,
  hint,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border px-4 py-3.5 text-left transition-all active:scale-[0.985]",
        on ? "border-ink bg-surface" : "border-line-soft hover:border-line",
      )}
    >
      <span>
        <span className={cn("block text-[15px] font-semibold", on ? "text-ink" : "text-ink-2")}>
          {label}
        </span>
        {hint && <span className="mt-0.5 block text-[12px] text-ink-3">{hint}</span>}
      </span>
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
          on ? "border-ink bg-ink" : "border-line",
        )}
      >
        {on && <Check size={12} className="text-bg" strokeWidth={3} />}
      </span>
    </button>
  );
}

function Slider({
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="pt-4">
      <div className="mb-6 text-center">
        <span className="display text-[64px] leading-none tabular-nums">{value}</span>
        <span className="display text-[28px] text-ink-3">{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-[var(--color-accent)]
          [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:shadow-lg"
      />
      <div className="mono mt-2 flex justify-between text-[11px] text-ink-3">
        <span>
          {min}
          {suffix}
        </span>
        <span>
          {max}
          {suffix}
        </span>
      </div>
    </div>
  );
}
