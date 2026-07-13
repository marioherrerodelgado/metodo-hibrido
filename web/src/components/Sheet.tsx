"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Panel deslizante desde abajo (estilo iOS sheet).
 * Se cierra con Esc, al pulsar el fondo o arrastrando hacia abajo.
 */
export function Sheet({
  open,
  onClose,
  children,
  title,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{ background: "var(--overlay)" }}
            className="fixed inset-0 z-40 backdrop-blur-[2px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 34, stiffness: 340 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 620) onClose();
            }}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 flex max-h-[92vh] flex-col",
              "rounded-t-[var(--radius-xl)] border-t border-line bg-bg-elev",
              "mx-auto w-full max-w-[560px]",
              className,
            )}
          >
            <div className="flex shrink-0 items-center justify-between px-5 pt-3 pb-1">
              <span className="mx-auto h-1 w-9 rounded-full bg-line" />
            </div>

            {title && (
              <div className="flex shrink-0 items-center justify-between px-5 pb-2">
                <h2 className="display text-[26px]">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink-2 transition-colors hover:text-ink"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <div className="no-sb flex-1 overflow-y-auto overscroll-contain px-5 pt-2 pb-[max(28px,env(safe-area-inset-bottom))]">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Modal centrado, para diálogos cortos. */
export function Modal({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ background: "var(--overlay)" }}
            className="absolute inset-0 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
            className={cn(
              "relative w-full max-w-sm rounded-[var(--radius-lg)] border border-line bg-bg-elev p-6",
              className,
            )}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
