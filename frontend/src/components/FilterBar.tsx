"use client";

import { ArrowDownWideNarrow, CalendarDays, Download, FileSpreadsheet } from "lucide-react";

export function FilterBar({
  entryScope,
  paymentMethod,
  sortOrder,
  fromDate,
  toDate,
  setEntryScope,
  setPaymentMethod,
  setSortOrder,
  setFromDate,
  setToDate,
  onPdfExport,
  onExcelExport,
}: {
  entryScope: "all" | "credit" | "debit";
  paymentMethod: "all" | "Cash" | "Online" | "Card" | "UPI";
  sortOrder: "date-desc" | "date-asc" | "amount-desc" | "amount-asc";
  fromDate: string;
  toDate: string;
  setEntryScope: (value: "all" | "credit" | "debit") => void;
  setPaymentMethod: (value: "all" | "Cash" | "Online" | "Card" | "UPI") => void;
  setSortOrder: (value: "date-desc" | "date-asc" | "amount-desc" | "amount-asc") => void;
  setFromDate: (value: string) => void;
  setToDate: (value: string) => void;
  onPdfExport: () => void;
  onExcelExport: () => void;
}) {
  return (
    <div className="mt-4 rounded-[24px] bg-white p-4 shadow-soft" data-tour="filters">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <CalendarDays className="h-4 w-4 text-brand-600" />
        Filters & export
      </div>
      <div className="grid gap-3">
        <div className="grid grid-cols-3 gap-2 rounded-[22px] bg-slate-100 p-1">
          {[
            { value: "all", label: "All entries" },
            { value: "credit", label: "Cash In" },
            { value: "debit", label: "Cash Out" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setEntryScope(item.value as "all" | "credit" | "debit")}
              className={`rounded-[18px] px-3 py-2 text-xs font-semibold transition ${
                entryScope === item.value
                  ? "bg-white text-brand-700 shadow-soft"
                  : "text-slate-500"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-500">
          <ArrowDownWideNarrow className="h-4 w-4 text-brand-600" />
          <select
            value={sortOrder}
            onChange={(event) =>
              setSortOrder(
                event.target.value as "date-desc" | "date-asc" | "amount-desc" | "amount-asc"
              )
            }
            className="w-full bg-transparent outline-none"
          >
            <option value="date-desc">Date: Newest first</option>
            <option value="date-asc">Date: Oldest first</option>
            <option value="amount-desc">Amount: High to low</option>
            <option value="amount-asc">Amount: Low to high</option>
          </select>
        </label>
        <select
          value={paymentMethod}
          onChange={(event) =>
            setPaymentMethod(
              event.target.value as "all" | "Cash" | "Online" | "Card" | "UPI"
            )
          }
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
        >
          <option value="all">All payment methods</option>
          <option value="Cash">Cash</option>
          <option value="Online">Online</option>
          <option value="Card">Card</option>
          <option value="UPI">UPI</option>
        </select>
        <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
        <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" />
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={onPdfExport} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">
            <Download className="h-4 w-4" />
            PDF
          </button>
          <button type="button" onClick={onExcelExport} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </button>
        </div>
      </div>
    </div>
  );
}
