"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore } from "react";

export type ThemePref = "light" | "dark" | "system";
export type Resolved = "light" | "dark";

const KEY = "mh-theme";

/**
 * El tema no es estado de React: vive en localStorage y en la preferencia del
 * sistema operativo, dos fuentes externas. Por eso lo leemos con
 * useSyncExternalStore en vez de copiarlo a un useState desde un efecto, que
 * provocaría un render extra en cada carga.
 */

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(cb: () => void) {
  listeners.add(cb);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", emit);
  // Otra pestaña puede cambiar el tema: nos enteramos por el evento storage.
  window.addEventListener("storage", emit);
  return () => {
    listeners.delete(cb);
    mq.removeEventListener("change", emit);
    window.removeEventListener("storage", emit);
  };
}

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function readTheme(): Resolved {
  const pref = readPref();
  if (pref !== "system") return pref;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// En el servidor no hay ni localStorage ni sistema: asumimos claro, que es el
// tema por defecto, y el guion del <head> corrige antes de pintar.
const serverPref = (): ThemePref => "system";
const serverTheme = (): Resolved => "light";

/**
 * Guion que se ejecuta ANTES de pintar nada, para evitar el fogonazo blanco al
 * cargar en modo oscuro: si esperáramos a que React monte, el usuario vería un
 * flash. Aplica el mismo criterio que readTheme().
 */
export const THEME_SCRIPT = `(function(){try{
var p=localStorage.getItem("${KEY}");
var d=p==="dark"||(p!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);
document.documentElement.dataset.theme=d?"dark":"light";
}catch(e){document.documentElement.dataset.theme="light";}})();`;

interface ThemeValue {
  /** Lo que ha elegido el usuario. */
  pref: ThemePref;
  /** El tema que se está pintando de verdad. */
  theme: Resolved;
  setPref: (p: ThemePref) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pref = useSyncExternalStore(subscribe, readPref, serverPref);
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);

  // Aplicamos el tema al documento y actualizamos el color de la barra del
  // navegador, que en móvil se ve alrededor de la app.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#08080a" : "#faf9f7");
  }, [theme]);

  const setPref = useCallback((p: ThemePref) => {
    try {
      if (p === "system") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, p);
    } catch {
      /* Modo incógnito con almacenamiento bloqueado: el tema no persiste. */
    }
    emit();
  }, []);

  return (
    <ThemeContext.Provider value={{ pref, theme, setPref }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
  return ctx;
}
