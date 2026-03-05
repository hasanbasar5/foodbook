"use client";

import { FormEvent, useEffect, useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { Entry } from "@/types";

const initialForm = {
  entryName: "",
  category: "",
  amount: "",
  date: new Date().toISOString().slice(0, 10),
  description: "",
  entryType: "Debit" as "Debit" | "Credit",
  paymentMethod: "Cash" as "Cash" | "Online" | "Card" | "UPI",
};

export function EntryModal({
  open,
  entry,
  onClose,
  onSubmit,
}: {
  open: boolean;
  entry: Entry | null;
  onClose: () => void;
  onSubmit: (payload: {
    entryName: string;
    category: string;
    amount: number;
    date: string;
    description: string;
    entryType: "Debit" | "Credit";
    paymentMethod: "Cash" | "Online" | "Card" | "UPI";
  }) => Promise<void>;
}) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (entry) {
      setForm({
        entryName: entry.entry_name,
        category: entry.category,
        amount: String(entry.amount),
        date: entry.date.slice(0, 10),
        description: entry.description,
        entryType: entry.entry_type,
        paymentMethod: entry.payment_method,
      });
    } else {
      setForm(initialForm);
    }
  }, [entry, open]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    await onSubmit({
      entryName: form.entryName,
      category: form.category,
      amount: Number(form.amount),
      date: form.date,
      description: form.description,
      entryType: form.entryType,
      paymentMethod: form.paymentMethod,
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-900/45 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="max-h-[88vh] w-full animate-slide-up overflow-y-auto rounded-t-[28px] bg-white p-4 shadow-shell sm:max-h-[90vh] sm:max-w-md sm:rounded-[28px] sm:p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Cashbook</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">{entry ? "Edit entry" : "Add new entry"}</h2>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input type="text" required minLength={2} value={form.entryName} onChange={(event) => setForm((current) => ({ ...current, entryName: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="Entry name" />
          <input type="text" required minLength={2} value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="Category" />
          <input type="number" min="0.01" step="0.01" required value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="Amount" />
          <input type="date" required value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
          <textarea required minLength={3} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="Description" />
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setForm((current) => ({ ...current, entryType: "Debit" }))}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                form.entryType === "Debit"
                  ? "bg-[linear-gradient(135deg,#e11d48_0%,#fb7185_100%)] text-white shadow-soft ring-2 ring-rose-100"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
              }`}
            >
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                form.entryType === "Debit" ? "bg-white/20" : "bg-rose-100"
              }`}>
                <Minus className="h-4 w-4" />
              </span>
              Cash Out
            </button>
            <button
              type="button"
              onClick={() => setForm((current) => ({ ...current, entryType: "Credit" }))}
              className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                form.entryType === "Credit"
                  ? "bg-[linear-gradient(135deg,#059669_0%,#10b981_100%)] text-white shadow-soft ring-2 ring-emerald-100"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                form.entryType === "Credit" ? "bg-white/20" : "bg-emerald-100"
              }`}>
                <Plus className="h-4 w-4" />
              </span>
              Cash In
            </button>
          </div>
          <select value={form.paymentMethod} onChange={(event) => setForm((current) => ({ ...current, paymentMethod: event.target.value as "Cash" | "Online" | "Card" | "UPI" }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
            <option value="Cash">Cash</option>
            <option value="Online">Online</option>
            <option value="Card">Card</option>
            <option value="UPI">UPI</option>
          </select>
          <button type="submit" disabled={submitting} className="fb-gradient-btn w-full rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-70">
            {submitting ? "Saving..." : entry ? "Save changes" : "Create entry"}
          </button>
        </form>
      </div>
    </div>
  );
}
