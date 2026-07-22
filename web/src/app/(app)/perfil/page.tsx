"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Eye,
  Footprints,
  LogOut,
  MapPin,
  Monitor,
  Moon,
  Music,
  Settings2,
  Shield,
  Sun,
  Target,
  Timer,
  MessageCircle,
} from "lucide-react";
import { Modal } from "@/components/Sheet";
import { Button, PageFade, Pill, SectionTitle } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { useSkills, useWeeklyLoad } from "@/lib/hooks";
import { SKILLS } from "@/lib/catalog";
import { useTheme } from "@/lib/theme";
import { SPORTS, SPORT_COLOR, SPORT_LABEL, type Sport } from "@/lib/types";
import { cn } from "@/lib/utils";

const WHATSAPP = "https://chat.whatsapp.com/HTZqzHGVAMHCVeofrejg3f?mode=gi_t";
const SPOTIFY =
  "https://open.spotify.com/playlist/2PwTV4QsIUbGI1lYN3a3jX?si=7f026bba371d46b7";

export default function PerfilPage() {
  const {
    user,
    profile,
    realIsCoach,
    viewAsAthlete,
    setViewAsAthlete,
    logout,
    updateProfileDoc,
  } = useAuth();
  const router = useRouter();
  const skills = useSkills();
  const { sessions } = useWeeklyLoad();
  const { pref, setPref } = useTheme();

  const [goalsOpen, setGoalsOpen] = useState(false);
  const [goals, setGoals] = useState<(Sport | "all")[]>(profile?.goals ?? ["all"]);

  const name = profile?.name || user?.displayName || "Atleta";
  const initial = name.charAt(0).toUpperCase();

  const toggleGoal = (g: Sport | "all") => {
    if (g === "all") {
      setGoals(["all"]);
      return;
    }
    setGoals((prev) => {
      const rest = prev.filter((x) => x !== "all");
      const next = rest.includes(g) ? rest.filter((x) => x !== g) : [...rest, g];
      return next.length ? next : ["all"];
    });
  };

  const saveGoals = async () => {
    await updateProfileDoc({ goals });
    setGoalsOpen(false);
  };

  const signOut = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <PageFade>
      <header className="px-5 pt-[max(20px,env(safe-area-inset-top))]">
        <h1 className="display text-[38px]">Perfil</h1>
      </header>

      {/* Tarjeta de atleta */}
      <div className="mt-5 px-5">
        <div className="rounded-[var(--radius-lg)] border border-line-soft bg-surface p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink text-[22px] font-bold text-bg">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[19px] font-semibold">{name}</div>
              <div className="truncate text-[13px] text-ink-3">{user?.email}</div>
              {profile?.role && profile.role !== "athlete" && (
                <span className="mono mt-1 inline-block rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-accent uppercase">
                  {profile.role === "admin" ? "Admin" : "Coach"}
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line-soft pt-4">
            <Metric value={sessions.length} label="Esta semana" />
            <Metric value={Object.keys(skills).length} label={`De ${SKILLS.length} skills`} />
            <Metric
              value={profile?.onboarding?.level ? profile.onboarding.level.slice(0, 3) : "—"}
              label="Nivel"
            />
          </div>
        </div>
      </div>

      {/* Objetivo deportivo */}
      <section className="mt-7 px-5">
        <SectionTitle>Tu plan</SectionTitle>
        <Row
          icon={<Target size={17} />}
          title="Objetivo deportivo"
          hint={
            goals.includes("all")
              ? "Todas las disciplinas"
              : goals.map((g) => SPORT_LABEL[g as Sport]).join(", ")
          }
          onClick={() => setGoalsOpen(true)}
        />
        <Row
          icon={<Settings2 size={17} />}
          title="Repetir el test inicial"
          hint="Nivel, material, zonas a cuidar"
          href="/onboarding"
        />
      </section>

      {/* Apariencia */}
      <section className="mt-7 px-5">
        <SectionTitle>Apariencia</SectionTitle>
        <div className="flex gap-1.5 rounded-[var(--radius-md)] border border-line-soft bg-surface p-1.5">
          {(
            [
              ["light", "Claro", Sun],
              ["dark", "Oscuro", Moon],
              ["system", "Sistema", Monitor],
            ] as const
          ).map(([p, label, Icon]) => (
            <button
              key={p}
              onClick={() => setPref(p)}
              aria-pressed={pref === p}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2.5 text-[13px] font-semibold transition-colors",
                pref === p ? "bg-ink text-bg" : "text-ink-3 hover:text-ink",
              )}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Herramientas */}
      <section className="mt-7 px-5">
        <SectionTitle>Herramientas</SectionTitle>
        <Row
          icon={<Timer size={17} />}
          title="Timer WOD"
          hint="AMRAP, EMOM, Tabata y For Time"
          href="/herramientas/timer"
        />
        <Row
          icon={<Footprints size={17} />}
          title="Test de zapatillas"
          hint="Recomendación real según cómo entrenas"
          href="/herramientas/zapatillas"
        />
        <Row
          icon={<Music size={17} />}
          title="Playlist"
          hint="La música del box en Spotify"
          href={SPOTIFY}
          external
        />
      </section>

      {/* Comunidad */}
      <section className="mt-7 px-5">
        <SectionTitle>Comunidad</SectionTitle>
        <Row
          icon={<MessageCircle size={17} />}
          title="Grupo de WhatsApp"
          hint="Únete a la comunidad"
          href={WHATSAPP}
          external
        />
        <Row
          icon={<MapPin size={17} />}
          title="El centro"
          hint="Madrid — Running & Functional Fitness"
        />
      </section>

      {/* Coach / admin */}
      {realIsCoach && (
        <section className="mt-7 px-5">
          <SectionTitle>Gestión</SectionTitle>
          <Row
            icon={<Shield size={17} />}
            title="Panel del coach"
            hint="Clientes, avisos, entrenos y equipo"
            href="/admin"
          />
          {/* Ver la app como la ve un atleta, sin cambiar tu rol real. */}
          <button
            onClick={() => {
              setViewAsAthlete(!viewAsAthlete);
              if (!viewAsAthlete) router.push("/hoy");
            }}
            className="mb-2 flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-line-soft bg-surface px-4 py-3 text-left transition-colors hover:border-line"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-ink-2">
              <Eye size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium">Ver como atleta</span>
              <span className="block text-[12px] text-ink-3">
                Previsualiza la app sin cambiar tu rol
              </span>
            </span>
            <span
              className={cn(
                "relative h-6 w-10 shrink-0 rounded-full transition-colors",
                viewAsAthlete ? "bg-accent" : "bg-surface-2",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                  viewAsAthlete ? "translate-x-[18px]" : "translate-x-0.5",
                )}
              />
            </span>
          </button>
        </section>
      )}

      <div className="mt-8 px-5 pb-6">
        <Button variant="danger" full onClick={signOut}>
          <LogOut size={16} />
          Cerrar sesión
        </Button>
        <p className="mono mt-5 text-center text-[10px] tracking-wider text-ink-3 uppercase">
          Nemea · v4.0
        </p>
      </div>

      {/* Objetivo deportivo */}
      <Modal open={goalsOpen} onClose={() => setGoalsOpen(false)}>
        <h2 className="display text-[28px]">¿Qué preparas?</h2>
        <p className="mt-1.5 text-[13px] text-ink-3">
          Filtramos tu calendario con lo que elijas.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Pill active={goals.includes("all")} onClick={() => toggleGoal("all")}>
            Todos
          </Pill>
          {SPORTS.filter((s) => s !== "movilidad").map((s) => (
            <Pill
              key={s}
              active={goals.includes(s)}
              color={SPORT_COLOR[s]}
              onClick={() => toggleGoal(s)}
            >
              {SPORT_LABEL[s]}
            </Pill>
          ))}
        </div>
        <div className="mt-6 flex gap-2">
          <Button variant="secondary" full onClick={() => setGoalsOpen(false)}>
            Cancelar
          </Button>
          <Button full onClick={saveGoals}>
            Guardar
          </Button>
        </div>
      </Modal>
    </PageFade>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <div className="display text-[26px] leading-none capitalize">{value}</div>
      <div className="mt-1 text-[11px] text-ink-3">{label}</div>
    </div>
  );
}

function Row({
  icon,
  title,
  hint,
  href,
  external,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  hint?: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-surface-2 text-ink-2">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{title}</span>
        {hint && <span className="block truncate text-[12px] text-ink-3">{hint}</span>}
      </span>
      {(href || onClick) && <ChevronRight size={16} className="shrink-0 text-ink-3" />}
    </>
  );

  const cls =
    "mb-2 flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-line-soft bg-surface px-4 py-3 text-left transition-colors hover:border-line";

  if (href) {
    return external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
        {content}
      </a>
    ) : (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cls} disabled={!onClick}>
      {content}
    </button>
  );
}
