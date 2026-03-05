"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppContentSkeleton } from "@/components/AppContentSkeleton";
import { useAuth } from "@/context/AuthContext";
import { Role } from "@/types";

export function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: Role[];
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
        return;
      }
      router.replace("/login");
    } else if (!loading && user && roles && !roles.includes(user.role)) {
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard";
        return;
      }
      router.replace("/dashboard");
    }
  }, [loading, roles, router, user]);

  if (loading || !user || (roles && !roles.includes(user.role))) {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className="mx-auto flex min-h-screen max-w-md flex-col bg-slate-100">
          <div className="overflow-hidden rounded-b-[30px] bg-[linear-gradient(145deg,#082736_0%,#0b3245_52%,#14506b_100%)] px-5 pb-4 pt-4 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-7 w-28 animate-pulse rounded-full bg-white/15" />
                <div className="h-3 w-40 animate-pulse rounded-full bg-white/10" />
              </div>
              <div className="h-14 w-14 animate-pulse rounded-full bg-white/15" />
            </div>
          </div>
          <div className="flex-1 px-4 pb-28 pt-4">
            <AppContentSkeleton />
          </div>
          <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md border-t border-slate-200 bg-white/95 px-4 pb-5 pt-3 backdrop-blur">
            <div className="grid grid-cols-3 gap-3">
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
