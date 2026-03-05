"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LogOut, ReceiptText, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const { hasRole, logout } = useAuth();
  const items = [
    { href: "/dashboard", label: "Home", visible: true },
    { href: "/entries", label: "Entries", visible: true },
    { href: "/admin", label: "Manage", visible: hasRole(["ADMIN", "SUPER_ADMIN"]) },
  ];
  const columns = items.filter((item) => item.visible).length + 1;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md border-t border-slate-200 bg-white/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.9rem)] pt-3 backdrop-blur sm:px-4">
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {items.filter((item) => item.visible).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            data-tour={item.href === "/entries" ? "entries-nav" : undefined}
            className={cn(
              "flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1.5 py-2 text-[10px] font-medium leading-tight transition sm:px-2 sm:text-[11px]",
              pathname === item.href ? "bg-brand-50 text-brand-700" : "text-slate-500"
            )}
          >
            {item.href === "/dashboard" ? (
              <Home className="h-5 w-5" />
            ) : item.href === "/entries" ? (
              <ReceiptText className="h-5 w-5" />
            ) : (
              <ShieldCheck className="h-5 w-5" />
            )}
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => logout()}
          className="flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1.5 py-2 text-[10px] font-medium leading-tight text-slate-500 transition hover:bg-slate-100 sm:px-2 sm:text-[11px]"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </nav>
  );
}
