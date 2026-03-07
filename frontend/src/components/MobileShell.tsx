"use client";

import Image from "next/image";
import { Plus, UserCircle2 } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { BottomNav } from "@/components/BottomNav";
import { useAuth } from "@/context/AuthContext";

export function MobileShell({
  children,
  onPrimaryAction,
  showFab = true,
  onOpenDrawer,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  onPrimaryAction?: () => void;
  showFab?: boolean;
  onOpenDrawer?: () => void;
}) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-slate-100">
        <header className="sticky top-0 z-30 overflow-hidden rounded-b-[28px] bg-[linear-gradient(145deg,#082736_0%,#0b3245_52%,#14506b_100%)] px-4 pb-4 pt-4 text-white shadow-soft sm:px-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(98,202,228,0.2),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.1),transparent_28%)]" />
          <Image
            src="/assets/images/shape/my-profile-shape-1.png"
            alt=""
            width={140}
            height={140}
            className="pointer-events-none absolute -left-5 top-0 opacity-25"
          />
          <Image
            src="/assets/images/shape/my-profile-shape-2.png"
            alt=""
            width={140}
            height={140}
            priority
            className="pointer-events-none absolute right-0 top-0 opacity-30"
          />
          <div className="relative flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="rounded-[18px] border border-white/10 bg-white/10 px-3 py-2 backdrop-blur">
                <BrandLogo tone="light" compact />
              </div>
              {/* <p className="mt-2 truncate text-xs font-medium text-brand-100/80">{user?.organizationName}</p> */}
            </div>
            <button
              type="button"
              onClick={onOpenDrawer}
              className="shrink-0 rounded-2xl border border-white/10 bg-white/10 p-1.5 shadow-lg backdrop-blur transition active:scale-95"
              aria-label="Open menu"
              data-tour="profile-trigger"
            >
              <span className="inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/10 p-1">
                {user?.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.fullName || user.email}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                ) : (
                  <UserCircle2 className="h-9 w-9 text-white" />
                )}
              </span>
            </button>
          </div>
        </header>
        <div className="flex-1 px-3 pb-28 pt-4 sm:px-4">{children}</div>
        {showFab ? (
          <button
            type="button"
            onClick={onPrimaryAction}
            className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-mint text-ink shadow-soft transition active:scale-95 sm:right-6"
            aria-label="Add entry"
            data-tour="add-entry"
          >
            <Plus className="h-6 w-6" />
          </button>
        ) : null}
        <BottomNav />
      </div>
    </div>
  );
}
