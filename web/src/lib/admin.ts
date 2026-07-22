import type { ClientOverview } from "./types";

/**
 * Semáforo de cumplimiento de un cliente, a partir de su actividad real.
 * El coach lo usa para saber a quién dar un toque.
 */
export interface ClientStatus {
  label: string;
  color: string;
  /** 0 sin datos · 1 al día · 2 flojo · 3 en riesgo */
  level: 0 | 1 | 2 | 3;
}

export function clientStatus(c: ClientOverview): ClientStatus {
  if (c.daysSinceActive === Infinity) {
    return { label: "Sin empezar", color: "var(--ink-3)", level: 0 };
  }
  if (c.daysSinceActive > 10) {
    return { label: "Inactivo", color: "var(--load-3)", level: 3 };
  }
  if (c.weekSessions >= 3) {
    return { label: "Al día", color: "var(--load-1)", level: 1 };
  }
  if (c.weekSessions >= 1) {
    return { label: "Flojo", color: "var(--load-2)", level: 2 };
  }
  // Estuvo activo hace poco, pero esta semana aún no ha entrenado.
  return { label: "Sin entrenar", color: "var(--load-2)", level: 2 };
}

/** "hoy", "ayer", "hace 3 días", "hace 2 semanas". */
export function agoLabel(days: number): string {
  if (days === Infinity) return "nunca";
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 14) return `hace ${days} días`;
  return `hace ${Math.floor(days / 7)} semanas`;
}
