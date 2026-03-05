import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import { currency } from "@/lib/utils";
import { EntrySummary } from "@/types";

const cards = [
  {
    key: "totalCredit",
    label: "Total Cash In",
    icon: ArrowUpCircle,
    tone: "text-emerald-700 bg-emerald-100",
    shell: "border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_68%)]",
    valueTone: "text-emerald-800",
    labelTone: "text-emerald-700/70",
  },
  {
    key: "totalDebit",
    label: "Total Cash Out",
    icon: ArrowDownCircle,
    tone: "text-rose-700 bg-rose-100",
    shell: "border-rose-100 bg-[linear-gradient(135deg,#fff1f2_0%,#ffffff_68%)]",
    valueTone: "text-rose-800",
    labelTone: "text-rose-700/70",
  },
  {
    key: "balance",
    label: "Balance",
    icon: Wallet,
    tone: "text-brand-700 bg-brand-100",
    shell: "border-brand-100 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_68%)]",
    valueTone: "text-slate-900",
    labelTone: "text-brand-700/70",
  },
] as const;

export function SummaryCards({
  summary,
  loading = false,
}: {
  summary: EntrySummary;
  loading?: boolean;
}) {
  return (
    <div
      className="sticky top-[84px] z-20 -mt-6 rounded-[28px] bg-[linear-gradient(180deg,rgba(241,245,249,0.96)_0%,rgba(241,245,249,0.9)_72%,rgba(241,245,249,0)_100%)] px-1 pb-3 pt-1 backdrop-blur-sm"
      data-tour="summary"
    >
      <div className="grid gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const value = summary[card.key];
          return (
            <div key={card.key} className={`rounded-[24px] border p-4 shadow-soft ${card.shell}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${card.labelTone} sm:text-xs sm:tracking-[0.2em]`}>
                    {card.label}
                  </p>
                  {loading ? (
                    <div className="mt-3 h-8 w-32 animate-pulse rounded-xl bg-slate-100" />
                  ) : (
                    <p className={`mt-2 break-all text-xl font-semibold sm:text-2xl ${card.valueTone}`}>{currency(value)}</p>
                  )}
                </div>
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${card.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
