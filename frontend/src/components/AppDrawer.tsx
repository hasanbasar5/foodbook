"use client";

import Link from "next/link";
import Image from "next/image";
import { FileText, ScrollText, ShieldCheck, UserCircle2, X } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/context/AuthContext";

export function AppDrawer({
  open,
  onClose,
  onOpenProfile,
  onOpenTerms,
  onOpenAdminCreate,
  onOpenLogs,
}: {
  open: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
  onOpenTerms: () => void;
  onOpenAdminCreate: () => void;
  onOpenLogs?: () => void;
}) {
  const { user, hasRole } = useAuth();

  if (!open || !user) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}>
      <aside
        className="absolute right-0 top-0 flex h-full w-[90%] max-w-sm animate-slide-up flex-col bg-white px-4 pb-5 pt-4 shadow-shell sm:p-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <BrandLogo tone="dark" compact />
            <h2 className="mt-2 break-words text-lg font-semibold text-slate-900 sm:text-xl">
              {user?.organizationName ? `${user.organizationName} Account panel` : "Personal Account panel"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="rounded-[24px] bg-brand-900 p-4 text-white">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <Image src={user.avatarUrl} alt={user.fullName} width={56} height={56} className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-lg font-semibold">
                {(user.fullName || user.email).slice(0, 1)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold">{user.fullName}</p>
              {/* <p className="text-sm text-brand-100">{user.email}</p>
              <p className="text-xs text-brand-100">{user.organizationName}</p> */}
              <p className="mt-1 break-words text-xs uppercase tracking-[0.18em] text-brand-200">{user.role}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <button type="button" onClick={onOpenProfile} className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 text-left text-sm font-medium text-slate-700">
            <UserCircle2 className="h-5 w-5 text-brand-700" />
            Profile
          </button>
          <button type="button" onClick={onOpenTerms} className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 text-left text-sm font-medium text-slate-700">
            <FileText className="h-5 w-5 text-brand-700" />
            Terms & Version 1.0
          </button>
          {hasRole(["SUPER_ADMIN"]) ? (
            <button type="button" onClick={onOpenAdminCreate} className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 text-left text-sm font-medium text-slate-700">
              <ShieldCheck className="h-5 w-5 text-brand-700" />
              Manage users
            </button>
          ) : null}
          {hasRole(["SUPER_ADMIN"]) ? (
            <Link
              href="/admin/logs"
              onClick={onOpenLogs}
              className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4 text-left text-sm font-medium text-slate-700"
            >
              <ScrollText className="h-5 w-5 text-brand-700" />
              Logs
            </Link>
          ) : null}
        </div>
        <div className="mt-auto rounded-[16px] bg-slate-50 p-4">
          <p className="text-[8px] uppercase tracking-[0.2em] text-slate-400">Version</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">Food Book v1.0</p>
          
        </div>
        <p className="mt-3 px-1 text-center text-[8px] tracking-[0.14em] text-slate-400 ">Mr.Sketch</p>
      </aside>
    </div>
  );
}
