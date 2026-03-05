"use client";

import { cn } from "@/lib/utils";

export function BrandLogo({
  tone = "light",
  compact = false,
  iconOnly = false,
  className,
}: {
  tone?: "light" | "dark";
  compact?: boolean;
  iconOnly?: boolean;
  className?: string;
}) {
  const light = tone === "light";

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <span
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl border",
          compact ? "h-9 w-9 rounded-xl" : "h-11 w-11",
          light
            ? "border-white/12 bg-white/10 text-white"
            : "border-brand-100 bg-brand-50 text-brand-800"
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            "absolute inset-x-1 top-1 h-[3px] rounded-full",
            compact ? "inset-x-1 top-1" : "inset-x-1.5 top-1.5",
            light ? "bg-mint/95" : "bg-brand-500"
          )}
        />
        <svg
          viewBox="0 0 24 24"
          className={cn(compact ? "h-5 w-5" : "h-6 w-6")}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 5.5h8.5a2.5 2.5 0 0 1 2.5 2.5v10.5H9.5A2.5 2.5 0 0 0 7 21V5.5Z" />
          <path d="M7 5.5H6A2 2 0 0 0 4 7.5v11A2.5 2.5 0 0 0 6.5 21H17" />
          <path d="M10 10h5" />
          <path d="M10 13.5h5" />
        </svg>
      </span>
      {!iconOnly ? (
      <span className="min-w-0">
        <span
          className={cn(
            "block truncate font-semibold leading-none",
            compact ? "text-sm" : "text-base",
            light ? "text-white" : "text-slate-900"
          )}
        >
          Food Book
        </span>
        {!compact ? (
          <span
            className={cn(
              "mt-1 block truncate text-[10px] font-medium uppercase tracking-[0.24em]",
              light ? "text-brand-100/85" : "text-brand-600"
            )}
          >
            Cashbook
          </span>
        ) : null}
      </span>
      ) : null}
    </div>
  );
}
