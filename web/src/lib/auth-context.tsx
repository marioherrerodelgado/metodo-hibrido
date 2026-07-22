"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import type { UserProfile } from "./types";

interface AuthValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  /** Rol EFECTIVO: baja a atleta si el coach está en modo "ver como atleta". */
  isAdmin: boolean;
  isCoach: boolean;
  /** Rol REAL en la base de datos, para decidir si ofrecer la vista previa. */
  realIsCoach: boolean;
  /** El coach está previsualizando la app como un atleta. */
  viewAsAthlete: boolean;
  setViewAsAthlete: (v: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfileDoc: (patch: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

const VIEW_AS_KEY = "mh-view-as-athlete";

function readViewAs(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(VIEW_AS_KEY) === "1";
  } catch {
    return false;
  }
}

/** Crea el documento users/{uid} si no existe. Nunca pisa el `role` existente. */
async function ensureProfile(user: User, name?: string) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(
    ref,
    {
      uid: user.uid,
      email: user.email ?? "",
      name: name ?? user.displayName ?? "",
      role: "athlete",
      goals: ["all"],
      onboardingDone: false,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
      // El perfil se carga en el efecto de abajo, que también escucha cambios.
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const ref = doc(db, "users", user.uid);

    // Asegura el doc antes de suscribirse, para no quedarnos en un estado sin perfil.
    ensureProfile(user).catch(() => {
      /* Reglas de Firestore o red: seguimos con perfil nulo y la UI degrada. */
    });

    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (!alive) return;
        setProfile(
          snap.exists()
            ? ({ ...(snap.data() as UserProfile), uid: user.uid })
            : {
                uid: user.uid,
                email: user.email ?? "",
                role: "athlete",
              },
        );
        setLoading(false);
      },
      () => {
        if (!alive) return;
        // Si las reglas bloquean la lectura, degradamos a atleta sin romper la app.
        setProfile({ uid: user.uid, email: user.email ?? "", role: "athlete" });
        setLoading(false);
      },
    );

    return () => {
      alive = false;
      unsub();
    };
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (name.trim()) {
        await updateProfile(cred.user, { displayName: name.trim() });
      }
      await ensureProfile(cred.user, name.trim());
    },
    [],
  );

  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    await ensureProfile(cred.user);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const updateProfileDoc = useCallback(
    async (patch: Partial<UserProfile>) => {
      if (!user) return;
      await setDoc(doc(db, "users", user.uid), patch, { merge: true });
    },
    [user],
  );

  // Vista previa "ver como atleta": solo cambia lo que muestra la UI, nunca el
  // rol real en la base de datos, así que no hay riesgo de quedarse fuera.
  // Inicialización perezosa desde localStorage (sin efecto que dispare render).
  const [viewAsAthlete, setViewAsAthleteState] = useState<boolean>(readViewAs);

  const setViewAsAthlete = useCallback((v: boolean) => {
    setViewAsAthleteState(v);
    try {
      if (v) localStorage.setItem(VIEW_AS_KEY, "1");
      else localStorage.removeItem(VIEW_AS_KEY);
    } catch {
      /* Sin almacenamiento: la vista no persiste entre recargas; no es grave. */
    }
  }, []);

  const realIsCoach = profile?.role === "coach" || profile?.role === "admin";

  const value = useMemo<AuthValue>(
    () => ({
      user,
      profile,
      loading,
      // Rol efectivo: si el coach está en vista de atleta, se comporta como uno.
      isAdmin: profile?.role === "admin" && !viewAsAthlete,
      isCoach: realIsCoach && !viewAsAthlete,
      realIsCoach,
      viewAsAthlete,
      setViewAsAthlete,
      login,
      register,
      loginWithGoogle,
      logout,
      resetPassword,
      updateProfileDoc,
    }),
    [
      user,
      profile,
      loading,
      realIsCoach,
      viewAsAthlete,
      setViewAsAthlete,
      login,
      register,
      loginWithGoogle,
      logout,
      resetPassword,
      updateProfileDoc,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
