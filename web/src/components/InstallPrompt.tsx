"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Check, Plus, Share } from "lucide-react";
import { Sheet } from "./Sheet";
import { Button } from "./ui";

/**
 * Aviso para instalar la app en el dispositivo, la primera vez que el atleta
 * entra. Se guarda que ya se mostró, así que no vuelve a salir.
 *
 * En Android/Chrome hay instalación nativa (botón "Instalar"). En iPhone no se
 * puede lanzar por código, así que mostramos los pasos manuales.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __mhInstall?: BeforeInstallPromptEvent;
  }
}

const SEEN_KEY = "mh-install-prompt-seen";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS marca las apps añadidas a la pantalla de inicio con este flag.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

export function InstallPrompt() {
  const [open, setOpen] = useState(false);
  // Inicialización perezosa: se derivan del navegador, no son estado que
  // mutemos desde un efecto (eso dispararía renders en cascada).
  const [ios] = useState(isIOS);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    () => (typeof window !== "undefined" ? window.__mhInstall ?? null : null),
  );

  useEffect(() => {
    // Ya instalada o ya avisada: no molestamos.
    if (isStandalone()) return;
    try {
      if (localStorage.getItem(SEEN_KEY) === "1") return;
    } catch {
      /* Sin almacenamiento: seguimos y mostramos el aviso. */
    }

    // El evento de Android puede llegar después de montar: lo escuchamos.
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // Solo tiene sentido enseñarlo si hay instalación nativa (Android) o si es
    // iPhone (instrucciones manuales). En escritorio sin evento, no aparece.
    const timer = setTimeout(() => {
      if (window.__mhInstall || isIOS()) setOpen(true);
    }, 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      clearTimeout(timer);
    };
  }, []);

  const remember = () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* Sin almacenamiento: podría volver a salir; no es grave. */
    }
  };

  const close = () => {
    remember();
    setOpen(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice; // aceptado o cancelado, ya no lo repetimos
    close();
  };

  return (
    <Sheet open={open} onClose={close}>
      <div className="flex flex-col items-center pb-4 text-center">
        <div className="overflow-hidden rounded-[22px] border border-line-soft shadow-lg">
          <Image src="/icon-192.png" alt="Nemea" width={84} height={84} priority />
        </div>

        <h2 className="display mt-4 text-[30px]">Instala la app</h2>
        <p className="mt-2 max-w-xs text-[14px] leading-relaxed text-ink-2">
          Añádela a tu pantalla de inicio y ábrela como una app, a pantalla
          completa y sin barra del navegador.
        </p>

        {deferred ? (
          // Android / Chrome: instalación nativa.
          <div className="mt-6 w-full">
            <Button full size="lg" onClick={install}>
              <Plus size={18} />
              Instalar ahora
            </Button>
            <button
              onClick={close}
              className="mt-3 w-full text-[13px] text-ink-3 transition-colors hover:text-ink"
            >
              Ahora no
            </button>
          </div>
        ) : ios ? (
          // iPhone: no se puede lanzar por código; explicamos los dos pasos.
          <div className="mt-6 w-full space-y-2 text-left">
            <Step n={1}>
              Pulsa <Share size={15} className="inline align-text-bottom text-accent" />{" "}
              <b>Compartir</b> en la barra de Safari.
            </Step>
            <Step n={2}>
              Elige <b>Añadir a pantalla de inicio</b> y confirma.
            </Step>
            <Button full className="mt-4" variant="secondary" onClick={close}>
              <Check size={16} />
              Entendido
            </Button>
          </div>
        ) : (
          <Button full size="lg" className="mt-6" variant="secondary" onClick={close}>
            Entendido
          </Button>
        )}
      </div>
    </Sheet>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-sm)] border border-line-soft bg-surface p-3.5">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[12px] font-bold text-bg">
        {n}
      </span>
      <span className="text-[14px] leading-relaxed text-ink-2">{children}</span>
    </div>
  );
}
