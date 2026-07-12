"use client";

import { motion } from "motion/react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Botón ────────────────────────────────────────────────────────────────

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  full?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  loading,
  full,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-full font-semibold",
        "transition-[transform,background-color,border-color,opacity] duration-150",
        "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60",
        size === "sm" && "h-9 px-4 text-[13px]",
        size === "md" && "h-11 px-5 text-[15px]",
        size === "lg" && "h-14 px-7 text-base",
        variant === "primary" && "bg-ink text-bg hover:bg-white",
        variant === "secondary" &&
          "border border-line bg-surface text-ink hover:border-ink-3 hover:bg-surface-2",
        variant === "ghost" && "text-ink-2 hover:bg-surface hover:text-ink",
        variant === "danger" && "bg-red-500/12 text-red-400 hover:bg-red-500/20",
        full && "w-full",
        className,
      )}
    >
      {loading && <Loader2 size={16} className="spin-slow" />}
      {children}
    </button>
  );
}

// ─── Contenedores ─────────────────────────────────────────────────────────

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-[var(--radius-md)] border border-line-soft bg-surface",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
  className,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-baseline justify-between gap-3", className)}>
      <h2 className="mono text-[11px] font-semibold tracking-[0.14em] text-ink-3 uppercase">
        {children}
      </h2>
      {action}
    </div>
  );
}

// ─── Píldoras / chips ─────────────────────────────────────────────────────

export function Pill({
  active,
  color,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  color?: string;
}) {
  return (
    <button
      {...props}
      style={
        active && color
          ? { backgroundColor: color, borderColor: color, color: "#08080a" }
          : undefined
      }
      className={cn(
        "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold whitespace-nowrap",
        "transition-colors duration-150 active:scale-[0.97]",
        active
          ? "border-ink bg-ink text-bg"
          : "border-line bg-transparent text-ink-2 hover:border-ink-3 hover:text-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Tag({
  color,
  children,
  className,
}: {
  color?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      style={
        color
          ? { color, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }
          : undefined
      }
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold",
        !color && "bg-surface-2 text-ink-2",
        className,
      )}
    >
      {children}
    </span>
  );
}

// ─── Campos de formulario ─────────────────────────────────────────────────

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      {label && (
        <span className="mono mb-1.5 block text-[11px] tracking-wider text-ink-3 uppercase">
          {label}
        </span>
      )}
      {children}
      {hint && <span className="mt-1.5 block text-[12px] text-ink-3">{hint}</span>}
    </label>
  );
}

const fieldBase =
  "w-full rounded-[var(--radius-sm)] border border-line bg-bg-elev px-3.5 text-[15px] text-ink placeholder:text-ink-3 transition-colors focus:border-ink-3";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(fieldBase, "h-12", className)} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(fieldBase, "min-h-24 py-3 leading-relaxed", className)} />;
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(fieldBase, "h-12 appearance-none pr-9", className)}>
      {children}
    </select>
  );
}

// ─── Estados ──────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon && <div className="text-ink-3">{icon}</div>}
      <p className="text-[15px] font-medium text-ink-2">{title}</p>
      {hint && <p className="max-w-xs text-[13px] leading-relaxed text-ink-3">{hint}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-[var(--radius-sm)]", className)} />;
}

export function Spinner({ size = 18 }: { size?: number }) {
  return <Loader2 size={size} className="spin-slow text-ink-3" />;
}

// ─── Transición de página ─────────────────────────────────────────────────

export function PageFade({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
