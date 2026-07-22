"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "./auth-context";
import {
  watchActiveAnnouncements,
  watchCoachTasks,
  watchCompetitions,
  watchLifts,
  watchMonthWods,
  watchSessions,
  watchSkills,
} from "./data";
import { COMPETITIONS_SEED } from "./competitions-seed";
import { accumulateLoad } from "./muscles";
import type {
  Announcement,
  CoachTask,
  Competition,
  LiftEntry,
  MuscleGroup,
  SessionLog,
  SkillDates,
  Wod,
} from "./types";
import { monthKey, todayISO, weekDates } from "./utils";

// Referencias vacías estables: devolver `[]` recién creado en cada render
// provocaría renders en cascada en los consumidores.
const NO_SESSIONS: SessionLog[] = [];
const NO_LIFTS: LiftEntry[] = [];
const NO_SKILLS: SkillDates = {};
const NO_WODS: Wod[] = [];
const NO_ANNOUNCEMENTS: Announcement[] = [];
const NO_TASKS: CoachTask[] = [];

/**
 * Los hooks de abajo nunca llaman a setState en el cuerpo del efecto: solo
 * dentro del callback del listener. El estado guarda la clave (mes o uid) con
 * la que se cargó, y derivamos "cargando" comparando esa clave con la actual.
 * Así el linter del compilador de React queda contento y, de paso, evitamos
 * enseñar datos del mes anterior mientras llega el nuevo snapshot.
 */

interface MonthState {
  month: string;
  wods: Wod[];
  error: string | null;
}

export function useMonthWods(month: string) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [state, setState] = useState<MonthState | null>(null);

  useEffect(() => {
    return watchMonthWods(
      month,
      uid,
      (wods) => setState({ month, wods, error: null }),
      (e) => setState({ month, wods: [], error: e.message }),
    );
  }, [month, uid]);

  const fresh = state?.month === month ? state : null;

  return {
    wods: fresh?.wods ?? NO_WODS,
    loading: fresh === null,
    error: fresh?.error ?? null,
  };
}

export function useSessions(): SessionLog[] {
  const { user } = useAuth();
  const [state, setState] = useState<{ uid: string; list: SessionLog[] } | null>(null);

  useEffect(() => {
    if (!user) return;
    return watchSessions(user.uid, (list) => setState({ uid: user.uid, list }));
  }, [user]);

  return user && state?.uid === user.uid ? state.list : NO_SESSIONS;
}

/**
 * Carga muscular de la semana en curso, a partir de las sesiones marcadas como
 * hechas. Solo cuenta lo REALMENTE entrenado, no lo planificado.
 */
export function useWeeklyLoad(refISO: string = todayISO()) {
  const sessions = useSessions();

  return useMemo(() => {
    const week = new Set(weekDates(new Date(`${refISO}T00:00:00`)));
    const thisWeek = sessions.filter((s) => week.has(s.fecha));

    const load = accumulateLoad(
      thisWeek.map((s) => ({
        intensity: s.intensity,
        muscles: s.muscles?.length ? s.muscles : undefined,
        wod: { titulo: s.titulo, sport: s.sport },
      })),
    );

    // Qué sesión ha cargado cada zona, para el detalle al pulsar el cuerpo.
    const detail: Partial<Record<MuscleGroup, string[]>> = {};
    for (const s of thisWeek) {
      for (const m of s.muscles ?? []) {
        (detail[m] ??= []).push(s.titulo);
      }
    }

    return { load, detail, sessions: thisWeek, allSessions: sessions };
  }, [sessions, refISO]);
}

/**
 * Competiciones. Si Firestore trae datos, mandan esos; si no, caemos al
 * calendario que la app antigua llevaba escrito en el código, para no dejar
 * la pestaña en blanco.
 */
export function useCompetitions(): Competition[] {
  const [comps, setComps] = useState<Competition[] | null>(null);
  useEffect(() => watchCompetitions(setComps), []);
  return comps?.length ? comps : COMPETITIONS_SEED;
}

export function useLifts(): LiftEntry[] {
  const { user } = useAuth();
  const [state, setState] = useState<{ uid: string; list: LiftEntry[] } | null>(null);

  useEffect(() => {
    if (!user) return;
    return watchLifts(user.uid, (list) => setState({ uid: user.uid, list }));
  }, [user]);

  return user && state?.uid === user.uid ? state.list : NO_LIFTS;
}

export function useSkills(): SkillDates {
  const { user } = useAuth();
  const [state, setState] = useState<{ uid: string; map: SkillDates } | null>(null);

  useEffect(() => {
    if (!user) return;
    return watchSkills(user.uid, (map) => setState({ uid: user.uid, map }));
  }, [user]);

  return user && state?.uid === user.uid ? state.map : NO_SKILLS;
}

/** Avisos activos del coach, para el banner de la app. */
export function useActiveAnnouncements(): Announcement[] {
  const [list, setList] = useState<Announcement[]>(NO_ANNOUNCEMENTS);
  useEffect(() => watchActiveAnnouncements(setList), []);
  return list;
}

/** Tareas del coach (privadas de su usuario). */
export function useCoachTasks(): CoachTask[] {
  const { user } = useAuth();
  const [state, setState] = useState<{ uid: string; list: CoachTask[] } | null>(null);

  useEffect(() => {
    if (!user) return;
    return watchCoachTasks(user.uid, (list) => setState({ uid: user.uid, list }));
  }, [user]);

  return user && state?.uid === user.uid ? state.list : NO_TASKS;
}

export const thisMonth = () => monthKey(new Date());
