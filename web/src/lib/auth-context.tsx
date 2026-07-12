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
  isAdmin: boolean;
  isCoach: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfileDoc: (patch: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

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

  const value = useMemo<AuthValue>(
    () => ({
      user,
      profile,
      loading,
      isAdmin: profile?.role === "admin",
      isCoach: profile?.role === "coach" || profile?.role === "admin",
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
