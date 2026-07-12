"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";

/**
 * Fondo compartido de las pantallas de acceso.
 * Sin imágenes: la marca se sostiene sola con tipografía y un degradado sutil,
 * así la app no depende de assets externos y carga instantánea.
 */
export function AuthShell({
  children,
  title,
  subtitle,
  back = "/",
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  back?: string;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Atmósfera */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, rgba(255,77,23,0.16), transparent 60%), radial-gradient(90% 60% at 90% 110%, rgba(96,165,250,0.10), transparent 65%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.035]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #fff 0 1px, transparent 1px 64px)",
        }}
      />

      <header className="px-5 pt-[max(20px,env(safe-area-inset-top))]">
        <Link
          href={back}
          aria-label="Volver"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink-2 transition-colors hover:text-ink"
        >
          <ArrowLeft size={17} />
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center px-6 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="display text-[46px] leading-[0.9] whitespace-pre-line">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{subtitle}</p>
          )}
          <div className="mt-8">{children}</div>
        </motion.div>
      </main>
    </div>
  );
}
