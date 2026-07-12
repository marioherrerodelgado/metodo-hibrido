"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { AuthShell } from "@/components/AuthShell";
import { Button, Field, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { authErrorMessage } from "@/lib/firebase";

export default function LoginPage() {
  const { user, loading, login, loginWithGoogle, resetPassword } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace("/hoy");
  }, [user, loading, router]);

  const fail = (e: unknown) =>
    setError(
      e instanceof FirebaseError
        ? authErrorMessage(e.code)
        : "No hemos podido entrar. Inténtalo de nuevo.",
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await login(email, password);
      router.replace("/hoy");
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    setBusy(true);
    try {
      await loginWithGoogle();
      router.replace("/hoy");
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const forgot = async () => {
    if (!email.trim()) {
      setError("Escribe tu email y volvemos a intentarlo.");
      return;
    }
    setError(null);
    try {
      await resetPassword(email);
      setNotice("Te hemos enviado un correo para restablecer la contraseña.");
    } catch (err) {
      fail(err);
    }
  };

  return (
    <AuthShell title={"Bienvenido\nde vuelta"} subtitle="Tu plan te está esperando.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email">
          <Input
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>

        <Field label="Contraseña">
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        {error && (
          <p className="rounded-[var(--radius-sm)] border border-red-500/25 bg-red-500/8 px-3.5 py-2.5 text-[13px] text-red-300">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-[var(--radius-sm)] border border-green-500/25 bg-green-500/8 px-3.5 py-2.5 text-[13px] text-green-300">
            {notice}
          </p>
        )}

        <Button type="submit" full size="lg" loading={busy}>
          Entrar
        </Button>
      </form>

      <button
        onClick={forgot}
        className="mt-3 block w-full text-center text-[13px] text-ink-3 transition-colors hover:text-ink"
      >
        He olvidado mi contraseña
      </button>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line-soft" />
        <span className="mono text-[10px] tracking-widest text-ink-3 uppercase">o</span>
        <span className="h-px flex-1 bg-line-soft" />
      </div>

      <Button variant="secondary" full size="lg" onClick={google} disabled={busy}>
        <GoogleIcon />
        Continuar con Google
      </Button>

      <p className="mt-8 text-center text-[14px] text-ink-3">
        ¿Aún no entrenas con nosotros?{" "}
        <Link href="/registro" className="font-semibold text-ink underline-offset-4 hover:underline">
          Crea tu cuenta
        </Link>
      </p>
    </AuthShell>
  );
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
