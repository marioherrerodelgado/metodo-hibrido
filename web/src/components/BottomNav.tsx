"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { CalendarDays, Home, PersonStanding, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/hoy", label: "Hoy", icon: Home },
  { href: "/calendario", label: "Plan", icon: CalendarDays },
  { href: "/buscar", label: "Buscar", icon: Search },
  { href: "/cuerpo", label: "Cuerpo", icon: PersonStanding },
  { href: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-30 border-t border-line-soft pb-safe">
      <ul className="mx-auto flex max-w-[560px] items-stretch">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-col items-center gap-1 py-2.5 transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="nav-dot"
                    transition={{ type: "spring", damping: 26, stiffness: 380 }}
                    className="absolute top-0 h-[2px] w-8 rounded-full bg-ink"
                  />
                )}
                <Icon
                  size={21}
                  strokeWidth={active ? 2.2 : 1.7}
                  className={cn(
                    "transition-colors",
                    active ? "text-ink" : "text-ink-3",
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-semibold transition-colors",
                    active ? "text-ink" : "text-ink-3",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
