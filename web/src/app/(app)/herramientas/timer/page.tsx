"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pause, Play, Plus, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button, PageFade } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Timer WOD.
 *
 * Un solo reloj con cuatro modos. La pantalla es el cronómetro: número enorme,
 * anillo de progreso y color que cambia con la fase, para leerlo desde el suelo
 * a tres metros y sudando.
 */

type Mode = "amrap" | "emom" | "tabata" | "fortime";

const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: "amrap", label: "AMRAP", desc: "Rondas máximas en un tiempo dado" },
  { id: "emom", label: "EMOM", desc: "Un bloque cada minuto" },
  { id: "tabata", label: "TABATA", desc: "Intervalos de trabajo y descanso" },
  { id: "fortime", label: "FOR TIME", desc: "Cronómetro ascendente con tope" },
];

interface Config {
  /** AMRAP / For Time: minutos totales. */
  minutes: number;
  /** EMOM: número de minutos (rondas). */
  rounds: number;
  /** Tabata: segundos de trabajo y descanso, y rondas. */
  work: number;
  rest: number;
  tabataRounds: number;
  /** Cuenta atrás previa. */
  prep: number;
}

const DEFAULTS: Config = {
  minutes: 12,
  rounds: 10,
  work: 20,
  rest: 10,
  tabataRounds: 8,
  prep: 10,
};

type Phase = "idle" | "prep" | "work" | "rest" | "done";

const COLOR: Record<Phase, string> = {
  idle: "#6b6b74",
  prep: "#fbbf24",
  work: "#4ade80",
  rest: "#3b82f6",
  done: "#ff4d17",
};

export default function TimerPage() {
  const [mode, setMode] = useState<Mode>("amrap");
  const [cfg, setCfg] = useState<Config>(DEFAULTS);
  const [phase, setPhase] = useState<Phase>("idle");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // segundos dentro de la fase actual
  const [round, setRound] = useState(1);
  const [total, setTotal] = useState(0); // segundos totales de sesión
  const [sound, setSound] = useState(true);
  const [laps, setLaps] = useState<number[]>([]);

  const audioRef = useRef<AudioContext | null>(null);

  /** Pitido sintetizado: sin ficheros, sin descargas, funciona offline. */
  const beep = useCallback(
    (freq: number, ms: number) => {
      if (!sound) return;
      try {
        audioRef.current ??= new AudioContext();
        const ctx = audioRef.current;
        if (ctx.state === "suspended") void ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        osc.type = "sine";
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + ms / 1000);
      } catch {
        /* Sin audio disponible: el timer sigue funcionando igual. */
      }
    },
    [sound],
  );

  // Duración de la fase en curso.
  const phaseLength = useMemo(() => {
    if (phase === "prep") return cfg.prep;
    if (mode === "amrap" || mode === "fortime") return cfg.minutes * 60;
    if (mode === "emom") return 60;
    if (mode === "tabata") return phase === "rest" ? cfg.rest : cfg.work;
    return 0;
  }, [phase, mode, cfg]);

  const totalRounds = mode === "emom" ? cfg.rounds : mode === "tabata" ? cfg.tabataRounds : 1;

  // Motor del reloj: un único intervalo de 1 s que avanza la máquina de estados.
  useEffect(() => {
    if (!running || phase === "idle" || phase === "done") return;

    const id = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        const remaining = phaseLength - next;

        if (remaining === 3 || remaining === 2 || remaining === 1) beep(880, 90);

        if (next >= phaseLength) {
          // Fin de fase: decidimos la siguiente.
          if (phase === "prep") {
            beep(1320, 320);
            setPhase("work");
            return 0;
          }

          if (mode === "amrap" || mode === "fortime") {
            beep(1320, 700);
            setPhase("done");
            setRunning(false);
            return phaseLength;
          }

          if (mode === "emom") {
            if (round >= cfg.rounds) {
              beep(1320, 700);
              setPhase("done");
              setRunning(false);
              return phaseLength;
            }
            beep(1100, 220);
            setRound((r) => r + 1);
            return 0;
          }

          if (mode === "tabata") {
            if (phase === "work") {
              beep(660, 200);
              setPhase("rest");
              return 0;
            }
            if (round >= cfg.tabataRounds) {
              beep(1320, 700);
              setPhase("done");
              setRunning(false);
              return phaseLength;
            }
            beep(1100, 220);
            setRound((r) => r + 1);
            setPhase("work");
            return 0;
          }
        }
        return next;
      });

      setTotal((t) => t + 1);
    }, 1000);

    return () => clearInterval(id);
  }, [running, phase, phaseLength, mode, round, cfg, beep]);

  const start = () => {
    if (phase === "idle" || phase === "done") {
      setElapsed(0);
      setRound(1);
      setTotal(0);
      setLaps([]);
      setPhase(cfg.prep > 0 ? "prep" : "work");
      beep(880, 150);
    }
    setRunning(true);
  };

  const reset = () => {
    setRunning(false);
    setPhase("idle");
    setElapsed(0);
    setRound(1);
    setTotal(0);
    setLaps([]);
  };

  // En For Time el número grande sube; en el resto baja.
  const display =
    mode === "fortime" && phase === "work" ? elapsed : Math.max(0, phaseLength - elapsed);
  const progress = phaseLength > 0 ? elapsed / phaseLength : 0;
  const color = COLOR[phase];

  const configured = phase === "idle";

  return (
    <PageFade>
      <header className="flex items-center justify-between px-5 pt-[max(20px,env(safe-area-inset-top))]">
        <Link
          href="/perfil"
          aria-label="Volver"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2"
        >
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-[17px] font-semibold">Timer</h1>
        <button
          onClick={() => setSound((s) => !s)}
          aria-label={sound ? "Silenciar" : "Activar sonido"}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink-2"
        >
          {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </header>

      {/* Selector de modo */}
      {configured && (
        <div className="no-sb mt-5 flex gap-2 overflow-x-auto px-5">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id);
                reset();
              }}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-[13px] font-bold tracking-wide transition-colors",
                mode === m.id
                  ? "border-ink bg-ink text-bg"
                  : "border-line text-ink-3 hover:text-ink",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {/* Reloj */}
      <div className="mt-6 flex flex-col items-center px-5">
        <div className="relative flex h-[300px] w-[300px] items-center justify-center">
          <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-90">
            <circle cx="100" cy="100" r="92" fill="none" stroke="#1e1e23" strokeWidth="7" />
            <circle
              cx="100"
              cy="100"
              r="92"
              fill="none"
              stroke={color}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 92}
              strokeDashoffset={2 * Math.PI * 92 * (1 - progress)}
              style={{ transition: "stroke-dashoffset 0.95s linear, stroke 0.3s" }}
            />
          </svg>

          <div className="flex flex-col items-center">
            <span
              className="mono text-[11px] font-bold tracking-[0.2em] uppercase"
              style={{ color }}
            >
              {phase === "idle"
                ? MODES.find((m) => m.id === mode)?.label
                : phase === "prep"
                  ? "Preparados"
                  : phase === "work"
                    ? mode === "tabata"
                      ? "Trabajo"
                      : "En marcha"
                    : phase === "rest"
                      ? "Descanso"
                      : "Terminado"}
            </span>

            <span className="display mt-1 text-[76px] leading-none tabular-nums">
              {fmt(configured ? initialSeconds(mode, cfg) : display)}
            </span>

            {totalRounds > 1 && (
              <span className="mono mt-2 text-[13px] text-ink-3">
                Ronda {Math.min(round, totalRounds)} / {totalRounds}
              </span>
            )}
            {phase !== "idle" && (
              <span className="mono mt-1 text-[11px] text-ink-3">
                Total {fmt(total)}
              </span>
            )}
          </div>
        </div>

        {/* Controles */}
        <div className="mt-6 flex w-full max-w-sm items-center gap-3">
          <button
            onClick={reset}
            aria-label="Reiniciar"
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:text-ink"
          >
            <RotateCcw size={19} />
          </button>

          <Button
            full
            size="lg"
            onClick={() => (running ? setRunning(false) : start())}
            className={cn("h-16 text-[17px]", running && "bg-surface-2 text-ink")}
          >
            {running ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
            {running ? "Pausa" : phase === "idle" ? "Empezar" : "Seguir"}
          </Button>

          {mode === "fortime" && phase === "work" && (
            <button
              onClick={() => setLaps((l) => [...l, elapsed])}
              aria-label="Marcar vuelta"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:text-ink"
            >
              <Plus size={19} />
            </button>
          )}
        </div>
      </div>

      {/* Vueltas */}
      {laps.length > 0 && (
        <div className="mt-6 px-5">
          <div className="mono mb-2 text-[10px] tracking-widest text-ink-3 uppercase">
            Vueltas
          </div>
          <div className="space-y-1">
            {laps.map((l, i) => (
              <div
                key={i}
                className="flex justify-between rounded-[var(--radius-xs)] bg-surface px-3.5 py-2.5"
              >
                <span className="mono text-[12px] text-ink-3">Ronda {i + 1}</span>
                <span className="mono text-[14px] font-semibold">{fmt(l)}</span>
                {i > 0 && (
                  <span className="mono text-[12px] text-ink-3">
                    +{fmt(l - laps[i - 1])}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ajustes: solo antes de arrancar, para no estorbar durante el WOD */}
      {configured && (
        <div className="mt-8 space-y-4 px-5 pb-10">
          <p className="text-[13px] text-ink-3">
            {MODES.find((m) => m.id === mode)?.desc}
          </p>

          {(mode === "amrap" || mode === "fortime") && (
            <Stepper
              label="Minutos"
              value={cfg.minutes}
              min={1}
              max={60}
              onChange={(v) => setCfg((c) => ({ ...c, minutes: v }))}
            />
          )}

          {mode === "emom" && (
            <Stepper
              label="Minutos (rondas)"
              value={cfg.rounds}
              min={2}
              max={40}
              onChange={(v) => setCfg((c) => ({ ...c, rounds: v }))}
            />
          )}

          {mode === "tabata" && (
            <>
              <Stepper
                label="Trabajo (s)"
                value={cfg.work}
                min={5}
                max={120}
                step={5}
                onChange={(v) => setCfg((c) => ({ ...c, work: v }))}
              />
              <Stepper
                label="Descanso (s)"
                value={cfg.rest}
                min={0}
                max={120}
                step={5}
                onChange={(v) => setCfg((c) => ({ ...c, rest: v }))}
              />
              <Stepper
                label="Rondas"
                value={cfg.tabataRounds}
                min={2}
                max={30}
                onChange={(v) => setCfg((c) => ({ ...c, tabataRounds: v }))}
              />
            </>
          )}

          <Stepper
            label="Cuenta atrás previa (s)"
            value={cfg.prep}
            min={0}
            max={30}
            step={5}
            onChange={(v) => setCfg((c) => ({ ...c, prep: v }))}
          />
        </div>
      )}
    </PageFade>
  );
}

function initialSeconds(mode: Mode, cfg: Config) {
  if (mode === "amrap" || mode === "fortime") return cfg.minutes * 60;
  if (mode === "emom") return 60;
  return cfg.work;
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-line-soft bg-surface px-4 py-3">
      <span className="text-[14px] font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - step))}
          aria-label={`Bajar ${label}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-[18px] text-ink-2 active:scale-90"
        >
          −
        </button>
        <span className="mono w-10 text-center text-[17px] font-semibold">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + step))}
          aria-label={`Subir ${label}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-[18px] text-ink-2 active:scale-90"
        >
          +
        </button>
      </div>
    </div>
  );
}
