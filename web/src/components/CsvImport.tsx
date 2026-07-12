"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Upload } from "lucide-react";
import { Button, SectionTitle } from "./ui";
import { parseWodsCSV, type ImportResult } from "@/lib/csv";
import { createWod } from "@/lib/data";
import { primaryMuscles } from "@/lib/muscles";
import { SPORT_COLOR, SPORT_LABEL, type Wod } from "@/lib/types";
import { formatLong } from "@/lib/utils";

/**
 * Carga masiva de entrenamientos desde CSV, como tenía el admin antiguo.
 * Primero muestra lo que ha entendido; solo publica cuando el coach lo confirma.
 */
export function CsvImport({ onDone }: { onDone: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<number | null>(null);
  const [failed, setFailed] = useState(0);

  const onFile = async (file: File) => {
    setPublished(null);
    setFailed(0);
    setFileName(file.name);
    setResult(parseWodsCSV(await file.text()));
  };

  const publish = async () => {
    if (!result?.wods.length) return;
    setPublishing(true);
    let ok = 0;
    let ko = 0;
    for (const w of result.wods) {
      try {
        // Guardamos las zonas inferidas para que el mapa corporal las tenga
        // sin re-analizar el texto en cada cliente.
        await createWod({ ...w, muscles: primaryMuscles(w as Partial<Wod>, 8) });
        ok++;
      } catch {
        ko++;
      }
    }
    setPublished(ok);
    setFailed(ko);
    setPublishing(false);
    setResult(null);
    onDone();
  };

  return (
    <div className="rounded-[var(--radius-md)] border border-line-soft bg-surface p-4">
      <SectionTitle>Carga masiva (CSV)</SectionTitle>

      <p className="mb-3 text-[12px] leading-relaxed text-ink-3">
        Columnas: <span className="mono">fecha, sport, titulo, intensity, duration,
        volume, type, sede, notes, warmup, main, metcon, cooldown</span>. Solo
        hacen falta <span className="mono">fecha</span>,{" "}
        <span className="mono">titulo</span> y <span className="mono">main</span>.
        Si tu plan está en Excel, guárdalo como CSV (UTF-8).
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />

      <Button variant="secondary" full onClick={() => inputRef.current?.click()}>
        <Upload size={16} />
        Elegir fichero CSV
      </Button>

      {published !== null && (
        <div className="mt-3 flex items-start gap-2 rounded-[var(--radius-sm)] border border-green-500/25 bg-green-500/8 p-3 text-[13px] text-green-300">
          <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
          <span>
            Publicados {published} entrenamientos.
            {failed > 0 && ` ${failed} fallaron al guardar.`}
          </span>
        </div>
      )}

      {result && (
        <div className="mt-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[13px] font-semibold">{fileName}</span>
            <span className="mono text-[11px] text-ink-3">
              {result.wods.length} válidos · {result.errors.length} con problemas
            </span>
          </div>

          {result.errors.length > 0 && (
            <div className="mb-3 rounded-[var(--radius-sm)] border border-amber-500/25 bg-amber-500/8 p-3">
              <div className="mb-1 flex items-center gap-2 text-[12px] font-semibold text-amber-300">
                <AlertTriangle size={13} />
                Filas que se van a saltar
              </div>
              <ul className="space-y-0.5">
                {result.errors.slice(0, 6).map((e, i) => (
                  <li key={i} className="text-[12px] text-amber-200/70">
                    Fila {e.row}: {e.reason}
                  </li>
                ))}
                {result.errors.length > 6 && (
                  <li className="text-[12px] text-amber-200/50">
                    …y {result.errors.length - 6} más
                  </li>
                )}
              </ul>
            </div>
          )}

          {result.wods.length > 0 && (
            <>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {result.wods.slice(0, 30).map((w, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 rounded-[var(--radius-xs)] bg-bg-elev px-3 py-2"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: SPORT_COLOR[w.sport] }}
                    />
                    <span className="mono w-[86px] shrink-0 text-[11px] text-ink-3">
                      {w.fecha}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px]">{w.titulo}</span>
                    <span className="mono shrink-0 text-[10px] text-ink-3 uppercase">
                      {SPORT_LABEL[w.sport]}
                    </span>
                  </div>
                ))}
                {result.wods.length > 30 && (
                  <p className="py-2 text-center text-[11px] text-ink-3">
                    …y {result.wods.length - 30} más
                  </p>
                )}
              </div>

              <p className="mt-2 text-[11px] text-ink-3">
                Del {formatLong(result.wods[0].fecha)} al{" "}
                {formatLong(result.wods[result.wods.length - 1].fecha)}.
              </p>

              <div className="mt-3 flex gap-2">
                <Button variant="secondary" onClick={() => setResult(null)}>
                  Cancelar
                </Button>
                <Button full loading={publishing} onClick={publish}>
                  Publicar {result.wods.length}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
