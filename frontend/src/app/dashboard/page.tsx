"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";
import { DashboardGuide } from "@/components/DashboardGuide";
import { AppContentSkeleton } from "@/components/AppContentSkeleton";
import { AppDrawer } from "@/components/AppDrawer";
import { EntryModal } from "@/components/EntryModal";
import { InlineErrorState } from "@/components/InlineErrorState";
import { MobileShell } from "@/components/MobileShell";
import { ProfileModal } from "@/components/ProfileModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PullToRefresh } from "@/components/PullToRefresh";
import { SummaryCards } from "@/components/SummaryCards";
import { TermsModal } from "@/components/TermsModal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { Entry, EntryResponse } from "@/types";

const defaultSummary = { totalCredit: 0, totalDebit: 0, balance: 0 };
const MIN_SKELETON_MS = 2000;

const wait = (duration: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });

export default function DashboardPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [summary, setSummary] = useState(defaultSummary);
  const [recentEntries, setRecentEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const fetchDashboard = async () => {
    const startedAt = Date.now();
    setLoading(true);
    setError("");

    try {
      let response: { data: EntryResponse };

      try {
        response = await api.get<EntryResponse>("/cashbook/entries", {
          params: {
            page: 1,
            limit: 5,
          },
        });
      } catch {
        response = await api.get<EntryResponse>("/cashbook/entries", {
          params: {
            page: 1,
            limit: 5,
          },
        });
      }

      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_SKELETON_MS) {
        await wait(MIN_SKELETON_MS - elapsed);
      }

      setSummary(response.data.summary);
      setRecentEntries(response.data.items);
    } catch {
      setError("We could not load your dashboard right now. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (!user || loading || error) {
      return;
    }

    const guideSeen = window.localStorage.getItem(`foodbook.dashboard.guide.${user.id}`);
    if (guideSeen === "true") {
      return;
    }

    const timeout = window.setTimeout(() => {
      setShowGuide(true);
    }, 500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [error, loading, user]);

  const submitEntry = async (payload: {
    entryName: string;
    category: string;
    amount: number;
    date: string;
    description: string;
    entryType: "Debit" | "Credit";
    paymentMethod: "Cash" | "Online" | "Card" | "UPI";
  }) => {
    if (editingEntry) {
      await api.put(`/cashbook/entry/${editingEntry.id}`, payload);
      showToast({
        tone: "success",
        title: "Entry updated",
        description: `${payload.entryName} was updated successfully.`,
      });
    } else {
      await api.post("/cashbook/entry", payload);
      showToast({
        tone: "success",
        title: "Entry created",
        description: `${payload.entryName} was added to your cashbook.`,
      });
    }

    setEditingEntry(null);
    await fetchDashboard();
  };

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute>
      <MobileShell
        onOpenDrawer={() => setDrawerOpen(true)}
        onPrimaryAction={() => {
          setEditingEntry(null);
          setOpen(true);
        }}
      >
        <PullToRefresh onRefresh={fetchDashboard}>
          {loading ? (
            <AppContentSkeleton cards={3} rows={2} />
          ) : error ? (
            <InlineErrorState
              title="Unable to load dashboard"
              message={error}
              onRetry={fetchDashboard}
            />
          ) : (
            <div className="space-y-4">
              <SummaryCards summary={summary} />

              <div className="rounded-[24px] bg-white p-4 shadow-soft" data-tour="entries-nav">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">All entries</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Open the entries tab to filter by date, type, amount, and export your records.
                    </p>
                  </div>
                  <Link
                    href="/entries"
                    className="inline-flex items-center gap-2 rounded-2xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700"
                  >
                    Open
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="rounded-[24px] bg-white p-4 shadow-soft">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">Recent activity</p>
                    <p className="mt-1 text-xs text-slate-500">Your last few entries appear here for a quick check.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEntry(null);
                      setOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:ml-0"
                  >
                    <Plus className="h-4 w-4" />
                    Add new
                  </button>
                </div>

                <div className="space-y-3">
                  {recentEntries.length ? (
                    recentEntries.map((entry) => (
                      <div key={entry.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{entry.entry_name}</p>
                            <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                              {entry.category} | {entry.payment_method}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                              {new Date(entry.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              | by {entry.user_id === user.id ? "You" : entry.email || "User"}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                entry.entry_type === "Credit"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {entry.entry_type === "Credit" ? "Cash In" : "Cash Out"}
                            </span>
                            <p
                              className={`text-sm font-semibold ${
                                entry.entry_type === "Credit" ? "text-emerald-700" : "text-rose-700"
                              }`}
                            >
                              {entry.entry_type === "Credit" ? "" : ""}
                              {Intl.NumberFormat("en-IN", {
                                style: "currency",
                                currency: "INR",
                                maximumFractionDigits: 2,
                              }).format(Number(entry.amount))}
                            </p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">{entry.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                      No entries yet. Tap the add button to create your first cash in or cash out record.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <EntryModal
            open={open}
            entry={editingEntry}
            onClose={() => {
              setOpen(false);
              setEditingEntry(null);
            }}
            onSubmit={submitEntry}
          />
        </PullToRefresh>

        <AppDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onOpenProfile={() => {
            setDrawerOpen(false);
            setProfileOpen(true);
          }}
          onOpenTerms={() => {
            setDrawerOpen(false);
            setTermsOpen(true);
          }}
          onOpenAdminCreate={() => setDrawerOpen(false)}
          onOpenLogs={() => setDrawerOpen(false)}
        />
        <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
        <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
        <DashboardGuide userId={user.id} open={showGuide} onClose={() => setShowGuide(false)} />
      </MobileShell>
    </ProtectedRoute>
  );
}
