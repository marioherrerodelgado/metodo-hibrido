"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, ShieldAlert, Trash2, X } from "lucide-react";
import { CsvImport } from "@/components/CsvImport";
import { DashboardTab } from "@/components/admin/DashboardTab";
import { ClientsTab } from "@/components/admin/ClientsTab";
import { TeamTab } from "@/components/admin/TeamTab";
import { AnnouncementsTab } from "@/components/admin/AnnouncementsTab";
import {
  Button,
  EmptyState,
  Field,
  Input,
  PageFade,
  Pill,
  Select,
  SectionTitle,
  Skeleton,
  Textarea,
} from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { createWod, deleteWod, fetchAllWods, updateWod } from "@/lib/data";
import { primaryMuscles } from "@/lib/muscles";
import {
  INTENSITY_LABEL,
  SPORTS,
  SPORT_COLOR,
  SPORT_LABEL,
  type Intensity,
  type Sport,
  type Wod,
} from "@/lib/types";
import { cn, formatLong, todayISO } from "@/lib/utils";

type Tab = "resumen" | "clientes" | "equipo" | "wods" | "avisos";

const TABS: { id: Tab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "clientes", label: "Clientes" },
  { id: "equipo", label: "Equipo" },
  { id: "wods", label: "Entrenos" },
  { id: "avisos", label: "Avisos" },
];

export default function AdminPage() {
  const { user, profile, isCoach, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("resumen");

  useEffect(() => {
    if (!loading && profile && !isCoach) router.replace("/hoy");
  }, [profile, isCoach, loading, router]);

  if (loading) {
    return (
      <div className="space-y-3 p-5">
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!isCoach) {
    return (
      <EmptyState
        icon={<ShieldAlert size={28} />}
        title="Sin acceso"
        hint="Esta zona es solo para el equipo de coaches."
      />
    );
  }

  return (
    <PageFade>
      <header className="px-5 pt-[max(20px,env(safe-area-inset-top))]">
        <h1 className="display text-[38px]">Panel</h1>
        <p className="mt-1 text-[13px] text-ink-3">
          {isAdmin ? "Administrador" : "Coach"} · {profile?.email}
        </p>

        {/* Cinco pestañas: no caben en un segmentado, así que van en fila
            deslizable con la activa resaltada. */}
        <div className="no-sb mt-3 flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold transition-colors",
                tab === t.id
                  ? "border-ink bg-ink text-bg"
                  : "border-line text-ink-3 hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-5 px-5">
        {tab === "resumen" && (
          <DashboardTab onGoClients={() => setTab("clientes")} />
        )}
        {tab === "clientes" && <ClientsTab />}
        {tab === "equipo" && (
          <TeamTab canEditRoles={isAdmin} myUid={user?.uid ?? ""} />
        )}
        {tab === "wods" && <WodsTab />}
        {tab === "avisos" && <AnnouncementsTab />}
      </div>
    </PageFade>
  );
}

// ─── Entrenamientos ───────────────────────────────────────────────────────

const EMPTY_FORM = {
  fecha: todayISO(),
  sport: "crossfit" as Sport,
  titulo: "",
  intensity: "media" as Intensity,
  duration: "",
  volume: "",
  type: "",
  notes: "",
  warmup: "",
  main: "",
  metcon: "",
  cooldown: "",
};

function WodsTab() {
  const [wods, setWods] = useState<Wod[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Sport | "all">("all");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  // Id del WOD en edición. Si es null, el formulario crea uno nuevo.
  const [editingId, setEditingId] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // El coach ve todo el archivo, incluidos los WODs personales de los atletas.
  const reload = async () => {
    setLoading(true);
    try {
      setWods(await fetchAllWods(null, true));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    fetchAllWods(null, true)
      .then((w) => alive && setWods(w))
      .catch(() => alive && setWods([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(
    () => (filter === "all" ? wods : wods.filter((w) => w.sport === filter)),
    [wods, filter],
  );

  // Carga un WOD existente en el formulario y sube hasta él para editarlo.
  const startEdit = (w: Wod) => {
    setEditingId(w.id);
    setForm({
      fecha: w.fecha,
      sport: w.sport,
      titulo: w.titulo,
      intensity: w.intensity,
      duration: w.duration ?? "",
      volume: w.volume ?? "",
      type: w.type ?? "",
      notes: w.notes ?? "",
      warmup: w.warmup ?? "",
      main: w.main ?? "",
      metcon: w.metcon ?? "",
      cooldown: w.cooldown ?? "",
    });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const submit = async () => {
    if (!form.fecha || !form.titulo.trim() || !form.main.trim()) return;
    setSaving(true);
    try {
      // Guardamos las zonas inferidas: así el mapa corporal no depende de
      // re-analizar el texto en cada cliente.
      const muscles = primaryMuscles({ ...form } as Partial<Wod>, 8);
      const data = { ...form, month: form.fecha.slice(0, 7), muscles };
      if (editingId) {
        await updateWod(editingId, data);
        setEditingId(null);
      } else {
        await createWod({ ...data, source: "coach" });
      }
      setForm(EMPTY_FORM);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (w: Wod) => {
    if (!confirm(`¿Eliminar "${w.titulo}" del ${w.fecha}?`)) return;
    if (editingId === w.id) cancelEdit();
    await deleteWod(w.id);
    await reload();
  };

  return (
    <div className="space-y-7">
      <CsvImport onDone={reload} />

      <div
        ref={formRef}
        className={cn(
          "scroll-mt-4 rounded-[var(--radius-md)] border bg-surface p-4",
          editingId ? "border-accent/50" : "border-line-soft",
        )}
      >
        <SectionTitle
          action={
            editingId ? (
              <button
                onClick={cancelEdit}
                className="flex items-center gap-1 text-[12px] font-semibold text-ink-3 hover:text-ink"
              >
                <X size={13} />
                Cancelar
              </button>
            ) : undefined
          }
        >
          {editingId ? "Editar entrenamiento" : "Nuevo entrenamiento"}
        </SectionTitle>

        <div className="mb-3 grid grid-cols-2 gap-3">
          <Field label="Fecha">
            <Input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
            />
          </Field>
          <Field label="Disciplina">
            <Select
              value={form.sport}
              onChange={(e) => setForm((f) => ({ ...f, sport: e.target.value as Sport }))}
            >
              {SPORTS.map((s) => (
                <option key={s} value={s}>
                  {SPORT_LABEL[s]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Título" className="mb-3">
          <Input
            placeholder="Strength + BREATH — Lunes Box"
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
          />
        </Field>

        <div className="mb-3 grid grid-cols-3 gap-3">
          <Field label="Intensidad">
            <Select
              value={form.intensity}
              onChange={(e) =>
                setForm((f) => ({ ...f, intensity: e.target.value as Intensity }))
              }
            >
              {(Object.keys(INTENSITY_LABEL) as Intensity[]).map((i) => (
                <option key={i} value={i}>
                  {INTENSITY_LABEL[i]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Duración">
            <Input
              placeholder="60 min"
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
            />
          </Field>
          <Field label="Tipo">
            <Input
              placeholder="AMRAP"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            />
          </Field>
        </div>

        {(
          [
            ["warmup", "Calentamiento"],
            ["main", "Parte principal *"],
            ["metcon", "MetCon"],
            ["cooldown", "Vuelta a la calma"],
          ] as const
        ).map(([k, label]) => (
          <Field key={k} label={label} className="mb-3">
            <Textarea
              rows={3}
              placeholder="Una línea por ejercicio"
              value={form[k]}
              onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
            />
          </Field>
        ))}

        <Field label="Nota del coach" className="mb-4">
          <Textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </Field>

        <Button
          full
          loading={saving}
          disabled={!form.titulo.trim() || !form.main.trim()}
          onClick={submit}
        >
          {editingId ? <Check size={16} /> : <Plus size={16} />}
          {editingId ? "Guardar cambios" : "Publicar"}
        </Button>
      </div>

      <div>
        <SectionTitle>{wods.length} entrenamientos</SectionTitle>

        <div className="no-sb mb-3 flex gap-2 overflow-x-auto">
          <Pill active={filter === "all"} onClick={() => setFilter("all")}>
            Todos
          </Pill>
          {SPORTS.map((s) => (
            <Pill
              key={s}
              active={filter === s}
              color={SPORT_COLOR[s]}
              onClick={() => setFilter(s)}
            >
              {SPORT_LABEL[s]}
            </Pill>
          ))}
        </div>

        {loading ? (
          <Skeleton className="h-40" />
        ) : (
          <div className="space-y-1.5">
            {filtered.slice(0, 60).map((w) => (
              <div
                key={w.id}
                className={cn(
                  "flex items-center gap-3 rounded-[var(--radius-sm)] border bg-surface px-3.5 py-3",
                  editingId === w.id ? "border-accent/60" : "border-line-soft",
                )}
              >
                {/* Tocar el entreno lo carga en el formulario para editarlo. */}
                <button
                  onClick={() => startEdit(w)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: SPORT_COLOR[w.sport] }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium">{w.titulo}</div>
                    <div className="truncate text-[11px] text-ink-3">
                      {formatLong(w.fecha)}
                      {w.source === "ai" && " · IA"}
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => startEdit(w)}
                  aria-label="Editar"
                  className="shrink-0 p-1.5 text-ink-3 transition-colors hover:text-ink"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => remove(w)}
                  aria-label="Eliminar"
                  className="shrink-0 p-1.5 text-ink-3 transition-colors hover:text-red-400"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
