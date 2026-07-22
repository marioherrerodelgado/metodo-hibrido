"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  CalendarDays,
  PersonStanding,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui";

const FEATURES = [
  {
    icon: CalendarDays,
    title: "Tu plan, cada día",
    body: "Running, CrossFit, Hyrox y DEKA en un único calendario. Sin hojas de cálculo ni PDFs perdidos.",
  },
  {
    icon: PersonStanding,
    title: "Ve cómo se carga tu cuerpo",
    body: "Un mapa muscular que se enciende con lo que entrenas. Sabes qué has machacado y qué te queda fresco.",
  },
  {
    icon: Sparkles,
    title: "Un WOD a tu medida",
    body: "Pide el entreno que necesitas hoy. La IA respeta tu material, tu nivel y las zonas que llevas al rojo.",
  },
  {
    icon: TrendingUp,
    title: "Kilos y skills",
    body: "Registra tus marcas, mira tu 1RM estimado y desbloquea skills. El progreso, en números.",
  },
  {
    icon: Timer,
    title: "El timer del box",
    body: "AMRAP, EMOM, Tabata y For Time. Se lee desde el suelo, sudando.",
  },
];

const DISCIPLINES = [
  { name: "Running", color: "#4ade80" },
  { name: "CrossFit", color: "#fb7185" },
  { name: "Hyrox", color: "#a78bfa" },
  { name: "DEKA", color: "#fbbf24" },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px]"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 0%, rgba(255,77,23,0.20), transparent 62%)",
        }}
      />

      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 pt-[max(20px,env(safe-area-inset-top))]">
        <span className="display text-[22px] tracking-[0.04em]">Nemea</span>
        <Link
          href="/login"
          className="text-[14px] font-semibold text-ink-2 transition-colors hover:text-ink"
        >
          Entrar
        </Link>
      </nav>

      <header className="mx-auto max-w-5xl px-6 pt-16 pb-20 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="mono text-[11px] tracking-[0.24em] text-accent uppercase">
            Madrid · 2026
          </p>

          <h1 className="display mt-4 text-[clamp(56px,13vw,124px)] leading-[0.86]">
            Un método.
            <br />
            Cuatro
            <br />
            disciplinas.
          </h1>

          <p className="mt-7 max-w-lg text-[17px] leading-relaxed text-ink-2">
            El plan que combina fuerza, motor y skill en una sola semana. Deja de
            elegir entre correr y levantar: haz las dos cosas, y hazlas bien.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/registro">
              <Button size="lg" className="px-8">
                Empezar
                <ArrowRight size={17} />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary" className="px-8">
                Ya entreno aquí
              </Button>
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
            {DISCIPLINES.map((d) => (
              <span key={d.name} className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: d.color }}
                />
                <span className="mono text-[12px] tracking-wider text-ink-3 uppercase">
                  {d.name}
                </span>
              </span>
            ))}
          </div>
        </motion.div>
      </header>

      <section className="mx-auto max-w-5xl border-t border-line-soft px-6 py-16">
        <h2 className="display text-[34px]">Lo que hace la app</h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                delay: (i % 2) * 0.08,
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="rounded-[var(--radius-lg)] border border-line-soft bg-surface p-6"
            >
              <f.icon size={20} className="text-accent" />
              <h3 className="mt-4 text-[18px] font-semibold">{f.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-3">{f.body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl border-t border-line-soft px-6 py-20 text-center">
        <h2 className="display text-[clamp(40px,9vw,80px)] leading-[0.9] text-balance">
          Tu cuerpo
          <br />
          lleva la cuenta.
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[16px] leading-relaxed text-ink-2">
          Nosotros también. Regístrate y empieza a entrenar con un plan que sabe
          lo que hiciste ayer.
        </p>
        <Link href="/registro" className="mt-8 inline-block">
          <Button size="lg" className="px-10">
            Crear mi cuenta
            <ArrowRight size={17} />
          </Button>
        </Link>
      </section>

      <footer className="border-t border-line-soft px-6 py-8 pb-[max(32px,env(safe-area-inset-bottom))]">
        <p className="mono text-center text-[10px] tracking-widest text-ink-3 uppercase">
          Nemea · Madrid
        </p>
      </footer>
    </div>
  );
}
