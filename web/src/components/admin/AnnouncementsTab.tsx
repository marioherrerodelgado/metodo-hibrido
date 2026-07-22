"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Megaphone, Trash2 } from "lucide-react";
import {
  Button,
  EmptyState,
  Field,
  Input,
  Pill,
  SectionTitle,
  Textarea,
} from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import {
  createAnnouncement,
  deleteAnnouncement,
  setAnnouncementActive,
  watchAnnouncements,
} from "@/lib/data";
import { ANNOUNCEMENT_TONE, type Announcement } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tone = NonNullable<Announcement["tone"]>;
const TONES: Tone[] = ["info", "importante", "logro"];

/**
 * Avisos: el coach escribe un mensaje y, al activarlo, aparece en la app de
 * todos los atletas como banner. Es el canal de "marketing" del MVP: novedades,
 * cambios de horario, retos.
 */
export function AnnouncementsTab() {
  const { profile } = useAuth();
  const [list, setList] = useState<Announcement[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tone, setTone] = useState<Tone>("info");
  const [publishNow, setPublishNow] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => watchAnnouncements(setList), []);

  const publish = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        tone,
        active: publishNow,
        authorEmail: profile?.email,
      });
      setTitle("");
      setBody("");
      setTone("info");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a: Announcement) => {
    if (!confirm(`¿Eliminar el aviso "${a.title}"?`)) return;
    await deleteAnnouncement(a.id);
  };

  const activos = list.filter((a) => a.active).length;

  return (
    <div className="space-y-7">
      <div className="rounded-[var(--radius-md)] border border-line-soft bg-surface p-4">
        <SectionTitle>Nuevo aviso</SectionTitle>
        <p className="mb-3 text-[12px] leading-relaxed text-ink-3">
          Si lo publicas, aparece en la pantalla de inicio de todos los atletas
          hasta que lo desactives.
        </p>

        <Field label="Título" className="mb-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Cambio de horario el viernes"
            maxLength={80}
          />
        </Field>

        <Field label="Mensaje" className="mb-3">
          <Textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="El box abre a las 8:00 en vez de las 7:00."
            maxLength={280}
          />
        </Field>

        <Field label="Tono" className="mb-3">
          <div className="flex gap-2">
            {TONES.map((t) => {
              const meta = ANNOUNCEMENT_TONE[t];
              return (
                <Pill
                  key={t}
                  active={tone === t}
                  color={meta.color}
                  onClick={() => setTone(t)}
                >
                  {meta.label}
                </Pill>
              );
            })}
          </div>
        </Field>

        <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-[var(--radius-sm)] border border-line-soft bg-bg-elev p-3">
          <input
            type="checkbox"
            checked={publishNow}
            onChange={(e) => setPublishNow(e.target.checked)}
            className="h-4 w-4 accent-[var(--color-accent)]"
          />
          <span className="text-[13px]">
            Publicar ya en la app
            <span className="block text-[11px] text-ink-3">
              Si lo dejas sin marcar, se guarda como borrador.
            </span>
          </span>
        </label>

        <Button full loading={saving} disabled={!title.trim()} onClick={publish}>
          <Megaphone size={16} />
          {publishNow ? "Publicar aviso" : "Guardar borrador"}
        </Button>
      </div>

      <div>
        <SectionTitle>
          {list.length} avisos · {activos} activos
        </SectionTitle>
        {list.length === 0 ? (
          <EmptyState
            icon={<Megaphone size={24} />}
            title="Aún no hay avisos"
            hint="Lanza el primero: un cambio de horario, un reto de la semana, una novedad."
          />
        ) : (
          <div className="space-y-2">
            {list.map((a) => {
              const meta = ANNOUNCEMENT_TONE[a.tone ?? "info"];
              return (
                <div
                  key={a.id}
                  className={cn(
                    "relative overflow-hidden rounded-[var(--radius-md)] border bg-surface p-4",
                    a.active ? "border-line" : "border-line-soft opacity-70",
                  )}
                >
                  <span
                    className="absolute inset-y-0 left-0 w-[3px]"
                    style={{ background: a.active ? meta.color : "var(--ink-3)" }}
                  />
                  <div className="flex items-start gap-3 pl-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold">{a.title}</span>
                        <span
                          className="mono rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase"
                          style={{
                            color: a.active ? meta.color : "var(--ink-3)",
                            background: `color-mix(in srgb, ${a.active ? meta.color : "var(--ink-3)"} 13%, transparent)`,
                          }}
                        >
                          {a.active ? "Activo" : "Borrador"}
                        </span>
                      </div>
                      {a.body && (
                        <p className="mt-1 text-[13px] leading-relaxed text-ink-2">
                          {a.body}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => setAnnouncementActive(a.id, !a.active)}
                        aria-label={a.active ? "Desactivar" : "Activar"}
                        className="p-1.5 text-ink-3 transition-colors hover:text-ink"
                      >
                        {a.active ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        onClick={() => remove(a)}
                        aria-label="Eliminar"
                        className="p-1.5 text-ink-3 transition-colors hover:text-red-400"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
