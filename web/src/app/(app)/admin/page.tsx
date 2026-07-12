"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShieldAlert, Trash2 } from "lucide-react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
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
import { db } from "@/lib/firebase";
import { createWod, deleteWod, fetchAllWods } from "@/lib/data";
import { primaryMuscles } from "@/lib/muscles";
import {
  INTENSITY_LABEL,
  SPORTS,
  SPORT_COLOR,
  SPORT_LABEL,
  type Intensity,
  type Role,
  type Sport,
  type UserProfile,
  type Wod,
} from "@/lib/types";
import { cn, formatLong, todayISO } from "@/lib/utils";

type Tab = "wods" | "atletas";

export default function AdminPage() {
  const { profile, isCoach, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("wods");

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

        <div className="mt-3 flex rounded-full border border-line p-0.5">
          {(
            [
              ["wods", "Entrenamientos"],
              ["atletas", "Atletas"],
            ] as const
          ).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-full py-2 text-[13px] font-semibold transition-colors",
                tab === t ? "bg-ink text-bg" : "text-ink-3",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-5 px-5">
        {tab === "wods" ? <WodsTab /> : <AtletasTab canEditRoles={isAdmin} />}
      </div>
    </PageFade>
  );
}

// ─── Entrenamientos ───────────────────────────────────────────────────────

function WodsTab() {
  const [wods, setWods] = useState<Wod[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Sport | "all">("all");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
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
  });

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

  const submit = async () => {
    if (!form.fecha || !form.titulo.trim() || !form.main.trim()) return;
    setSaving(true);
    try {
      // Guardamos las zonas inferidas: así el mapa corporal no depende de
      // re-analizar el texto en cada cliente.
      const muscles = primaryMuscles({ ...form } as Partial<Wod>, 8);
      await createWod({
        ...form,
        month: form.fecha.slice(0, 7),
        muscles,
        source: "coach",
      });
      setForm((f) => ({
        ...f,
        titulo: "",
        duration: "",
        volume: "",
        notes: "",
        warmup: "",
        main: "",
        metcon: "",
        cooldown: "",
      }));
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (w: Wod) => {
    if (!confirm(`¿Eliminar "${w.titulo}" del ${w.fecha}?`)) return;
    await deleteWod(w.id);
    await reload();
  };

  return (
    <div className="space-y-7">
      <div className="rounded-[var(--radius-md)] border border-line-soft bg-surface p-4">
        <SectionTitle>Nuevo entrenamiento</SectionTitle>

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
          <Plus size={16} />
          Publicar
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
                className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-line-soft bg-surface px-3.5 py-3"
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

// ─── Atletas ──────────────────────────────────────────────────────────────

function AtletasTab({ canEditRoles }: { canEditRoles: boolean }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDocs(collection(db, "users"))
      .then((snap) =>
        setUsers(snap.docs.map((d) => ({ ...(d.data() as UserProfile), uid: d.id }))),
      )
      .catch(() =>
        setError(
          "No se puede leer la lista de atletas. Revisa las reglas de Firestore (solo coach/admin deberían poder).",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const setRole = async (uid: string, role: Role) => {
    await updateDoc(doc(db, "users", uid), { role });
    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role } : u)));
  };

  if (loading) return <Skeleton className="h-40" />;
  if (error) return <EmptyState title="Sin permisos" hint={error} />;

  return (
    <div>
      <SectionTitle>{users.length} registrados</SectionTitle>
      <div className="space-y-1.5">
        {users.map((u) => (
          <div
            key={u.uid}
            className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-line-soft bg-surface px-3.5 py-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[13px] font-bold">
              {(u.name || u.email || "?").charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-medium">{u.name || "Sin nombre"}</div>
              <div className="truncate text-[11px] text-ink-3">{u.email}</div>
            </div>
            {canEditRoles ? (
              <Select
                value={u.role ?? "athlete"}
                onChange={(e) => setRole(u.uid, e.target.value as Role)}
                className="h-9 w-auto shrink-0 text-[12px]"
              >
                <option value="athlete">Atleta</option>
                <option value="coach">Coach</option>
                <option value="admin">Admin</option>
              </Select>
            ) : (
              <span className="mono shrink-0 text-[11px] text-ink-3 uppercase">
                {u.role ?? "athlete"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
