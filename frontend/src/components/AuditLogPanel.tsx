"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { AuditLogItem } from "@/types";

const formatAuditDetails = (item: AuditLogItem) => {
  if (!item.details) {
    return null;
  }

  const details = item.details as Record<string, unknown>;

  if (typeof details.email === "string") {
    return details.email;
  }

  if (typeof details.entryName === "string") {
    return `${details.entryName} - ${details.entryType ?? "Entry"}`;
  }

  if (typeof details.role === "string") {
    return `Role: ${details.role}`;
  }

  return null;
};

export function AuditLogPanel({
  items,
  title = "Organization activity",
  subtitle = "Super admin can review admin and user actions across the organization.",
  canRestoreEntries = false,
  onRestoreEntry,
}: {
  items: AuditLogItem[];
  title?: string;
  subtitle?: string;
  canRestoreEntries?: boolean;
  onRestoreEntry?: (entryId: number) => Promise<void>;
}) {
  const [pendingRestore, setPendingRestore] = useState<AuditLogItem | null>(null);

  return (
    <>
      <div className="rounded-[24px] bg-white p-4 shadow-soft">
        <div className="mb-3">
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="space-y-3">
          {items.length ? (
            items.map((item) => {
              const canRestore =
                canRestoreEntries &&
                item.action === "DELETE_ENTRY" &&
                typeof item.target_id === "number" &&
                Boolean(onRestoreEntry);

              return (
                <div key={item.id} className="rounded-2xl border border-slate-100 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.action.replaceAll("_", " ")}</p>
                      <p className="text-xs text-slate-500">
                        {item.actor_name} ({item.actor_role}) - {item.actor_email}
                      </p>
                      {formatAuditDetails(item) ? (
                        <p className="mt-1 text-xs text-slate-500">{formatAuditDetails(item)}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="rounded-full bg-brand-50 px-2 py-1 text-[10px] font-semibold text-brand-700">
                        {item.target_type}
                      </span>
                      {canRestore ? (
                        <button
                          type="button"
                          onClick={() => setPendingRestore(item)}
                          className="inline-flex items-center gap-1 rounded-2xl bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restore
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
              No organization activity yet. Member actions will appear here after entries, user changes, and role updates.
            </div>
          )}
        </div>
      </div>
      {pendingRestore && onRestoreEntry ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-900/45 backdrop-blur-sm sm:items-center sm:justify-center">
          <div className="w-full animate-slide-up rounded-t-[28px] bg-white p-5 shadow-shell sm:max-w-sm sm:rounded-[28px]">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Restore entry</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Restore this deleted entry?</h3>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {formatAuditDetails(pendingRestore) || "This deleted cashbook entry"} will be added back to the cashbook.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingRestore(null)}
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await onRestoreEntry(pendingRestore.target_id as number);
                  setPendingRestore(null);
                }}
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
