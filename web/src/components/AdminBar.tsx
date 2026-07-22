"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

/**
 * Barra de acceso al panel, arriba y solo para coach/admin. El atleta normal
 * no la ve nunca, así que su app no cambia. Dentro del propio panel no se
 * pinta, para no ofrecer un atajo a donde ya estás.
 */
export function AdminBar() {
  const { isCoach, isAdmin } = useAuth();
  const pathname = usePathname();

  if (!isCoach || pathname.startsWith("/admin")) return null;

  return (
    <div className="px-5 pt-[max(12px,env(safe-area-inset-top))]">
      <Link
        href="/admin"
        className="flex items-center gap-2.5 rounded-full border border-accent/30 bg-accent/8 px-4 py-2 text-accent transition-colors hover:bg-accent/14"
      >
        <Settings2 size={16} />
        <span className="text-[13px] font-semibold">
          {isAdmin ? "Panel de administración" : "Panel del coach"}
        </span>
        <span className="mono ml-auto text-[10px] tracking-wider uppercase opacity-70">
          Subir · editar
        </span>
      </Link>
    </div>
  );
}
