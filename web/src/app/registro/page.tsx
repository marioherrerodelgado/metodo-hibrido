"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";
import { AuthShell } from "@/components/AuthShell";
import { Button, Field, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { authErrorMessage } from "@/lib/firebase";

export default function RegistroPage() {
  const { user, loading, register, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace("/onboarding");
  }, [user, loading, router]);

  const fail = (e: unknown) =>
    setError(
      e instanceof FirebaseError
        ? authErrorMessage(e.code)
        : "No hemos podido crear la cuenta.",
    );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await register(name, email, password);
      router.replace("/onboarding");
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      title={"Empieza\nhoy"}
      subtitle="Un método. Cuatro disciplinas. Un solo plan."
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Nombre">
          <Input
            autoComplete="name"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>

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

        <Field label="Contraseña" hint="Mínimo 6 caracteres.">
          <Input
            type="password"
            autoComplete="new-password"
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

        <Button type="submit" full size="lg" loading={busy}>
          Crear cuenta
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-line-soft" />
        <span className="mono text-[10px] tracking-widest text-ink-3 uppercase">o</span>
        <span className="h-px flex-1 bg-line-soft" />
      </div>

      <Button
        variant="secondary"
        full
        size="lg"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await loginWithGoogle();
            router.replace("/onboarding");
          } catch (err) {
            fail(err);
          } finally {
            setBusy(false);
          }
        }}
      >
        Continuar con Google
      </Button>

      <p className="mt-8 text-center text-[14px] text-ink-3">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-semibold text-ink underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
