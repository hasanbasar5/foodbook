"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { currency, formatDate } from "@/lib/utils";
import { Entry, Role } from "@/types";

const getEntryDescriptionLabel = (entry: Entry) => {
  const cleanDescription = entry.description.trim().replace(/\s+/g, " ");
  if (!cleanDescription) {
    return entry.entry_name;
  }

  if (entry.category === "Imported") {
    return cleanDescription.replace(/\s+Abdul Ajees$/i, "").trim() || cleanDescription;
  }

  return cleanDescription;
};

export function EntryList({
  entries,
  totalBalance,
  currentUserId,
  role,
  onEdit,
  onDelete,
}: {
  entries: Entry[];
  totalBalance: number;
  currentUserId: number;
  role: Role;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}) {
  const [pendingDelete, setPendingDelete] = useState<Entry | null>(null);
  const rowBalances = entries.reduce<number[]>((accumulator, entry, index) => {
    if (index === 0) {
      accumulator.push(totalBalance);
      return accumulator;
    }

    const previousEntry = entries[index - 1];
    const previousBalance = accumulator[index - 1];
    const revertedBalance =
      previousEntry.entry_type === "Credit"
        ? previousBalance - Number(previousEntry.amount)
        : previousBalance + Number(previousEntry.amount);

    accumulator.push(revertedBalance);
    return accumulator;
  }, []);

  return (
    <div className="mt-4 space-y-3" data-tour="entries">
      {entries.map((entry, index) => {
        const canEdit = role === "ADMIN" || role === "SUPER_ADMIN";
        const canDelete = role === "ADMIN" || role === "SUPER_ADMIN";
        const entryOwner = entry.user_id === currentUserId ? "You" : entry.email || "User";
        const typeLabel = entry.entry_type === "Credit" ? "Cash In" : "Cash Out";
        const entryTime = new Date(entry.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        const rowBalance = rowBalances[index] ?? totalBalance;
        const displayDescription = getEntryDescriptionLabel(entry);

        return (
          <article key={entry.id} className="rounded-[24px] bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <div>
               
                <p className="text-sm font-semibold text-slate-900"> {formatDate(entry.date)} <span className="rounded-full bg-brand-50 px-3 py-1 ms-2 text-xs font-semibold text-brand-700">
                  {entry.payment_method}
                </span></p>
                {/* <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                  {entry.category} | {entry.payment_method}
                </p> */}
                <p className="mt-1 text-xs text-slate-800 mt-2">
                  {displayDescription}
                </p>
                <p
                  className={`mt-2 text-xs font-bold ${
                    rowBalance >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  Balance {rowBalance >= 0 ? currency(rowBalance) : `-${currency(Math.abs(rowBalance))}`}
                </p>
                
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  entry.entry_type === "Credit"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {currency(entry.amount)}
              </span>
            </div>
            <hr style={{marginTop:'10px', border:'1px dashed #f2f2f2 '}}></hr>
            <div className="mt-2 flex items-center justify-between">
              <div>
                {/* <p className="text-lg font-semibold text-slate-900">{currency(entry.amount)}</p> */}
                <p className="mt-1 text-xs text-slate-400">
                 Entry at {entryTime} | by {entryOwner}
                </p>
               
              </div>
              <div className="flex items-center gap-2">
                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => onEdit(entry)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                ) : null}
                {canDelete ? (
                  <button
                    type="button"
                    onClick={() => setPendingDelete(entry)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-900/45 backdrop-blur-sm sm:items-center sm:justify-center">
          <div className="w-full animate-slide-up rounded-t-[28px] bg-white p-5 shadow-shell sm:max-w-sm sm:rounded-[28px]">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Confirm delete</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">Delete this entry?</h3>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              "{pendingDelete.entry_name}" will be removed from the cashbook.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(pendingDelete);
                  setPendingDelete(null);
                }}
                className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
