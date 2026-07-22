"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { EmptyState, Select, SectionTitle, Skeleton } from "@/components/ui";
import { db } from "@/lib/firebase";
import { updateUserRole } from "@/lib/data";
import type { Role, UserProfile } from "@/lib/types";

const ROLE_LABEL: Record<Role, string> = {
  athlete: "Atleta",
  coach: "Coach",
  admin: "Admin",
};

/**
 * Equipo: coaches y admins. Desde aquí el admin asciende o retira roles sin
 * tocar la consola de Firebase. Un admin no puede quitarse el rol a sí mismo,
 * para no quedarse fuera por error.
 */
export function TeamTab({
  canEditRoles,
  myUid,
}: {
  canEditRoles: boolean;
  myUid: string;
}) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getDocs(collection(db, "users"))
      .then((snap) => {
        if (!alive) return;
        setUsers(snap.docs.map((d) => ({ ...(d.data() as UserProfile), uid: d.id })));
      })
      .catch(() => {
        if (!alive) return;
        setError(
          "No se puede leer el equipo. Revisa que tu usuario sea coach o admin.",
        );
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const team = useMemo(
    () => users.filter((u) => u.role === "coach" || u.role === "admin"),
    [users],
  );
  const athletes = useMemo(
    () => users.filter((u) => (u.role ?? "athlete") === "athlete"),
    [users],
  );

  const setRole = async (uid: string, role: Role) => {
    await updateUserRole(uid, role);
    setUsers((prev) => prev.map((u) => (u.uid === uid ? { ...u, role } : u)));
  };

  if (loading) return <Skeleton className="h-40" />;
  if (error) return <EmptyState title="Sin acceso" hint={error} />;

  return (
    <div className="space-y-6">
      <div>
        <SectionTitle>Equipo · {team.length}</SectionTitle>
        <div className="space-y-1.5">
          {team.map((u) => (
            <UserRow
              key={u.uid}
              u={u}
              canEditRoles={canEditRoles}
              isMe={u.uid === myUid}
              onRole={setRole}
            />
          ))}
        </div>
      </div>

      {canEditRoles && (
        <div>
          <SectionTitle>Ascender a alguien</SectionTitle>
          <p className="mb-2 text-[12px] text-ink-3">
            Convierte a un atleta en coach para que pueda subir entrenos.
          </p>
          <div className="space-y-1.5">
            {athletes.slice(0, 30).map((u) => (
              <UserRow
                key={u.uid}
                u={u}
                canEditRoles={canEditRoles}
                isMe={u.uid === myUid}
                onRole={setRole}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UserRow({
  u,
  canEditRoles,
  isMe,
  onRole,
}: {
  u: UserProfile;
  canEditRoles: boolean;
  isMe: boolean;
  onRole: (uid: string, role: Role) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-line-soft bg-surface px-3.5 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[13px] font-bold">
        {(u.name || u.email || "?").charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-medium">
          {u.name || "Sin nombre"}
          {isMe && <span className="text-ink-3"> · tú</span>}
        </div>
        <div className="truncate text-[11px] text-ink-3">{u.email}</div>
      </div>
      {canEditRoles && !isMe ? (
        <Select
          value={u.role ?? "athlete"}
          onChange={(e) => onRole(u.uid, e.target.value as Role)}
          className="h-9 w-auto shrink-0 text-[12px]"
        >
          <option value="athlete">Atleta</option>
          <option value="coach">Coach</option>
          <option value="admin">Admin</option>
        </Select>
      ) : (
        <span className="mono shrink-0 text-[11px] text-ink-3 uppercase">
          {ROLE_LABEL[u.role ?? "athlete"]}
        </span>
      )}
    </div>
  );
}
