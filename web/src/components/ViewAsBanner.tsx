"use client";

import { motion } from "motion/react";
import { Eye } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

/**
 * Cinta flotante cuando el coach está viendo la app como atleta. Es la única
 * forma de volver, porque en ese modo la barra de admin se oculta.
 */
export function ViewAsBanner() {
  const { realIsCoach, viewAsAthlete, setViewAsAthlete } = useAuth();

  if (!realIsCoach || !viewAsAthlete) return null;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed inset-x-0 bottom-[max(84px,calc(env(safe-area-inset-bottom)+72px))] z-40 flex justify-center px-5"
    >
      <div className="glass flex items-center gap-3 rounded-full border border-line px-4 py-2 shadow-lg">
        <Eye size={15} className="text-accent" />
        <span className="text-[13px] font-medium">Viendo como atleta</span>
        <button
          onClick={() => setViewAsAthlete(false)}
          className="rounded-full bg-ink px-3 py-1 text-[12px] font-semibold text-bg transition-opacity hover:opacity-90"
        >
          Volver a admin
        </button>
      </div>
    </motion.div>
  );
}
