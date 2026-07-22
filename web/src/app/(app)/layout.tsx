"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AdminBar } from "@/components/AdminBar";
import { BottomNav } from "@/components/BottomNav";
import { Spinner } from "@/components/ui";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    // Primera vez: pasamos por el test inicial (que se puede saltar).
    if (profile && !profile.onboardingDone && !profile.onboardingSkipped) {
      router.replace("/onboarding");
    }
  }, [user, profile, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner size={22} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-24">
      <div className="mx-auto w-full max-w-[560px]">
        <AdminBar />
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
