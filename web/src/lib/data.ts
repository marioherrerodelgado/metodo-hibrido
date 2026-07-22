"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Announcement,
  ClientOverview,
  CoachTask,
  Competition,
  LiftEntry,
  Role,
  SessionLog,
  SkillDates,
  Sport,
  UserProfile,
  Wod,
} from "./types";
import { fixUtf, monthKey } from "./utils";

// ─── Normalización ────────────────────────────────────────────────────────
// Los documentos antiguos traen `date` en vez de `fecha`, mojibake de los CSV
// y campos ausentes. Todo entra por aquí para que la UI vea siempre un `Wod`.

function normalizeWod(snap: QueryDocumentSnapshot): Wod {
  const d = snap.data() as Record<string, unknown>;
  const str = (k: string) => {
    const v = d[k];
    return typeof v === "string" ? fixUtf(v) : "";
  };
  const fecha = str("fecha") || str("date");

  return {
    id: snap.id,
    fecha,
    month: str("month") || fecha.slice(0, 7),
    sport: ((str("sport") || "running").toLowerCase() as Sport) ?? "running",
    titulo: str("titulo") || str("title") || "Entrenamiento",
    intensity: (str("intensity") || "media") as Wod["intensity"],
    duration: str("duration"),
    volume: str("volume"),
    type: str("type"),
    sede: str("sede"),
    notes: str("notes"),
    warmup: str("warmup"),
    main: str("main"),
    metcon: str("metcon"),
    cooldown: str("cooldown"),
    muscles: Array.isArray(d.muscles) ? (d.muscles as Wod["muscles"]) : undefined,
    source: (d.source as Wod["source"]) ?? "coach",
    ownerId: typeof d.ownerId === "string" ? d.ownerId : undefined,
  };
}

// ─── WODs ─────────────────────────────────────────────────────────────────

/**
 * Un WOD sin `ownerId` es del plan del box y lo ve todo el mundo.
 * Uno con `ownerId` es personal (lo generó la IA para ese atleta) y solo lo ve
 * su dueño: sin este filtro, el entreno privado de uno saldría en el
 * calendario de todos los demás.
 */
function visibleTo(uid: string | null | undefined) {
  return (w: Wod) => Boolean(w.fecha) && (!w.ownerId || w.ownerId === uid);
}

/** WODs de un mes (YYYY-MM) visibles para `uid`. Escucha en tiempo real. */
export function watchMonthWods(
  month: string,
  uid: string | null,
  cb: (wods: Wod[]) => void,
  onError?: (e: Error) => void,
) {
  const q = query(collection(db, "wods"), where("month", "==", month));
  return onSnapshot(
    q,
    (snap) => {
      const wods = snap.docs
        .map(normalizeWod)
        .filter(visibleTo(uid))
        .sort((a, b) => a.fecha.localeCompare(b.fecha));
      cb(wods);
    },
    (e) => onError?.(e),
  );
}

/**
 * Todos los WODs visibles para `uid`. Una sola lectura.
 * `includeAllOwners` lo usa el panel del coach, que sí debe verlo todo.
 */
export async function fetchAllWods(
  uid: string | null,
  includeAllOwners = false,
): Promise<Wod[]> {
  const snap = await getDocs(collection(db, "wods"));
  return snap.docs
    .map(normalizeWod)
    .filter(includeAllOwners ? (w) => Boolean(w.fecha) : visibleTo(uid))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export async function createWod(w: Omit<Wod, "id">) {
  const ref = await addDoc(collection(db, "wods"), {
    ...w,
    month: w.month || w.fecha.slice(0, 7),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateWod(id: string, patch: Partial<Wod>) {
  await updateDoc(doc(db, "wods", id), patch);
}

export async function deleteWod(id: string) {
  await deleteDoc(doc(db, "wods", id));
}

// ─── Competiciones ────────────────────────────────────────────────────────

export function watchCompetitions(
  cb: (comps: Competition[]) => void,
  onError?: (e: Error) => void,
) {
  return onSnapshot(
    collection(db, "competiciones"),
    (snap) => {
      const comps = snap.docs
        .map((s) => {
          const d = s.data() as Record<string, unknown>;
          const str = (k: string) =>
            typeof d[k] === "string" ? fixUtf(d[k] as string) : "";
          return {
            id: s.id,
            date: str("date"),
            name: str("name"),
            dist: str("dist"),
            lugar: str("lugar"),
            cat: (str("cat").toLowerCase() || "running") as Sport,
            note: str("note"),
          } satisfies Competition;
        })
        .filter((c) => c.date && c.name)
        .sort((a, b) => a.date.localeCompare(b.date));
      cb(comps);
    },
    (e) => onError?.(e),
  );
}

// ─── Sesiones completadas (users/{uid}/sessions) ──────────────────────────

export function watchSessions(uid: string, cb: (s: SessionLog[]) => void) {
  return onSnapshot(
    collection(db, "users", uid, "sessions"),
    (snap) => {
      const list = snap.docs.map((s) => ({ id: s.id, ...s.data() }) as SessionLog);
      list.sort((a, b) => b.fecha.localeCompare(a.fecha));
      cb(list);
    },
    () => cb([]),
  );
}

/** Marca un WOD como hecho. El id del doc es `${fecha}_${wodId}` → idempotente. */
export async function logSession(uid: string, s: Omit<SessionLog, "id" | "createdAt">) {
  const id = `${s.fecha}_${s.wodId ?? s.titulo.slice(0, 20)}`.replace(/[/\s.#$[\]]/g, "-");
  await setDoc(doc(db, "users", uid, "sessions", id), {
    ...s,
    createdAt: Date.now(),
  });
  return id;
}

export async function unlogSession(uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "sessions", id));
}

// ─── Cargas (users/{uid}/lifts) ───────────────────────────────────────────

export function watchLifts(uid: string, cb: (l: LiftEntry[]) => void) {
  return onSnapshot(
    query(collection(db, "users", uid, "lifts"), orderBy("date", "asc")),
    (snap) => cb(snap.docs.map((s) => ({ id: s.id, ...s.data() }) as LiftEntry)),
    () => cb([]),
  );
}

export async function addLift(uid: string, entry: Omit<LiftEntry, "id">) {
  const ref = await addDoc(collection(db, "users", uid, "lifts"), {
    ...entry,
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function deleteLift(uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "lifts", id));
}

// ─── Skills (users/{uid}/meta/skills) ─────────────────────────────────────

export function watchSkills(uid: string, cb: (s: SkillDates) => void) {
  return onSnapshot(
    doc(db, "users", uid, "meta", "skills"),
    (snap) => cb((snap.data()?.unlocked ?? {}) as SkillDates),
    () => cb({}),
  );
}

export async function setSkills(uid: string, unlocked: SkillDates) {
  await setDoc(doc(db, "users", uid, "meta", "skills"), { unlocked }, { merge: false });
}

// ─── Avisos (announcements) ───────────────────────────────────────────────

/** Todos los avisos, para el panel del coach. */
export function watchAnnouncements(
  cb: (a: Announcement[]) => void,
  onError?: (e: Error) => void,
) {
  return onSnapshot(
    query(collection(db, "announcements"), orderBy("createdAt", "desc")),
    (snap) => cb(snap.docs.map((s) => ({ id: s.id, ...s.data() }) as Announcement)),
    (e) => onError?.(e),
  );
}

/** Solo los avisos activos, para el banner de la app del atleta. */
export function watchActiveAnnouncements(cb: (a: Announcement[]) => void) {
  return onSnapshot(
    query(collection(db, "announcements"), where("active", "==", true)),
    (snap) => {
      const list = snap.docs.map((s) => ({ id: s.id, ...s.data() }) as Announcement);
      list.sort((a, b) => b.createdAt - a.createdAt);
      cb(list);
    },
    () => cb([]),
  );
}

export async function createAnnouncement(
  a: Omit<Announcement, "id" | "createdAt">,
) {
  const ref = await addDoc(collection(db, "announcements"), {
    ...a,
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function setAnnouncementActive(id: string, active: boolean) {
  await updateDoc(doc(db, "announcements", id), { active });
}

export async function deleteAnnouncement(id: string) {
  await deleteDoc(doc(db, "announcements", id));
}

// ─── Tareas del coach (users/{uid}/tasks) ─────────────────────────────────

export function watchCoachTasks(uid: string, cb: (t: CoachTask[]) => void) {
  return onSnapshot(
    collection(db, "users", uid, "tasks"),
    (snap) => {
      const list = snap.docs.map((s) => ({ id: s.id, ...s.data() }) as CoachTask);
      // Sin terminar primero; dentro de cada grupo, las más nuevas arriba.
      list.sort(
        (a, b) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt,
      );
      cb(list);
    },
    () => cb([]),
  );
}

export async function addCoachTask(uid: string, text: string, due?: string) {
  const ref = await addDoc(collection(db, "users", uid, "tasks"), {
    text,
    done: false,
    ...(due ? { due } : {}),
    createdAt: Date.now(),
  });
  return ref.id;
}

export async function toggleCoachTask(uid: string, id: string, done: boolean) {
  await updateDoc(doc(db, "users", uid, "tasks", id), { done });
}

export async function deleteCoachTask(uid: string, id: string) {
  await deleteDoc(doc(db, "users", uid, "tasks", id));
}

// ─── Clientes y cumplimiento ──────────────────────────────────────────────

export interface RecentActivity {
  uid: string;
  name: string;
  session: SessionLog;
}

export interface AdminOverview {
  clients: ClientOverview[];
  recent: RecentActivity[];
}

/**
 * Panorama del panel: todos los usuarios con su actividad de la semana, más las
 * últimas sesiones de todo el mundo para el feed de actividad. Se hace en una
 * sola pasada sobre users + sus sesiones (una consulta por cliente): con un box
 * de decenas de clientes es asumible, y solo se lee al abrir el panel.
 *
 * `todayISO` se pasa desde fuera para no llamar a `new Date()` aquí y que el
 * cálculo sea determinista respecto al día que ve el coach.
 */
export async function fetchAdminOverview(
  weekStart: string,
  weekEnd: string,
  todayISO: string,
): Promise<AdminOverview> {
  const usersSnap = await getDocs(collection(db, "users"));
  const today = new Date(`${todayISO}T00:00:00`);
  const recent: RecentActivity[] = [];

  const clients = await Promise.all(
    usersSnap.docs.map(async (u): Promise<ClientOverview> => {
      const data = u.data() as UserProfile;
      const name = data.name || data.email || "Sin nombre";

      let weekSessions = 0;
      let lastActive: string | null = null;
      try {
        const sessSnap = await getDocs(collection(db, "users", u.id, "sessions"));
        for (const s of sessSnap.docs) {
          const session = { id: s.id, ...s.data() } as SessionLog;
          const fecha = session.fecha;
          if (!fecha) continue;
          if (fecha >= weekStart && fecha <= weekEnd) weekSessions++;
          if (!lastActive || fecha > lastActive) lastActive = fecha;
          recent.push({ uid: u.id, name, session });
        }
      } catch {
        /* Sin permiso o sin datos: dejamos el cliente a cero. */
      }

      const daysSinceActive = lastActive
        ? Math.floor(
            (today.getTime() - new Date(`${lastActive}T00:00:00`).getTime()) /
              86_400_000,
          )
        : Infinity;

      return {
        uid: u.id,
        name: data.name || "",
        email: data.email || "",
        role: (data.role ?? "athlete") as Role,
        weekSessions,
        lastActive,
        daysSinceActive,
      };
    }),
  );

  // Lo más reciente arriba: por fecha y, a igualdad, por el sello de guardado.
  recent.sort(
    (a, b) =>
      b.session.fecha.localeCompare(a.session.fecha) ||
      (b.session.createdAt ?? 0) - (a.session.createdAt ?? 0),
  );

  return { clients, recent: recent.slice(0, 15) };
}

export async function updateUserRole(uid: string, role: Role) {
  await updateDoc(doc(db, "users", uid), { role });
}

// ─── Utilidades ───────────────────────────────────────────────────────────

export const currentMonthKey = () => monthKey(new Date());
