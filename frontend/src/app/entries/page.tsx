"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FilterBar } from "@/components/FilterBar";
import { AppContentSkeleton } from "@/components/AppContentSkeleton";
import { AppDrawer } from "@/components/AppDrawer";
import { EntryList } from "@/components/EntryList";
import { EntryModal } from "@/components/EntryModal";
import { InlineErrorState } from "@/components/InlineErrorState";
import { MobileShell } from "@/components/MobileShell";
import { Pagination } from "@/components/Pagination";
import { ProfileModal } from "@/components/ProfileModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PullToRefresh } from "@/components/PullToRefresh";
import { TermsModal } from "@/components/TermsModal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { exportEntriesToExcel, exportEntriesToPdf } from "@/lib/export";
import { Entry, EntryResponse } from "@/types";

const defaultPagination = { page: 1, limit: 10, total: 0, totalPages: 1 };
const defaultSummary = { totalCredit: 0, totalDebit: 0, balance: 0 };
const MIN_SKELETON_MS = 2000;

const wait = (duration: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });

export default function EntriesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [summary, setSummary] = useState(defaultSummary);
  const [pagination, setPagination] = useState(defaultPagination);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [entryScope, setEntryScope] = useState<"all" | "credit" | "debit">("all");
  const [paymentMethod, setPaymentMethod] = useState<"all" | "Cash" | "Online" | "Card" | "UPI">("all");
  const [sortOrder, setSortOrder] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const applyClientFilters = useCallback(
    (sourceEntries: Entry[]) =>
      sourceEntries
        .filter((entry) => {
          if (entryScope === "credit") {
            return entry.entry_type === "Credit";
          }
          if (entryScope === "debit") {
            return entry.entry_type === "Debit";
          }
          return true;
        })
        .filter((entry) => {
          if (paymentMethod === "all") {
            return true;
          }
          return entry.payment_method === paymentMethod;
        })
        .sort((left, right) => {
          if (sortOrder === "date-desc") {
            return new Date(right.date).getTime() - new Date(left.date).getTime();
          }
          if (sortOrder === "date-asc") {
            return new Date(left.date).getTime() - new Date(right.date).getTime();
          }
          if (sortOrder === "amount-desc") {
            return Number(right.amount) - Number(left.amount);
          }
          return Number(left.amount) - Number(right.amount);
        }),
    [entryScope, paymentMethod, sortOrder]
  );

  const fetchEntries = async (nextPage = page, append = false) => {
    const startedAt = Date.now();

    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      let response: { data: EntryResponse };

      try {
        response = await api.get<EntryResponse>("/cashbook/entries", {
          params: {
            page: nextPage,
            limit: 10,
            ...(fromDate ? { fromDate } : {}),
            ...(toDate ? { toDate } : {}),
          },
        });
      } catch {
        response = await api.get<EntryResponse>("/cashbook/entries", {
          params: {
            page: nextPage,
            limit: 10,
            ...(fromDate ? { fromDate } : {}),
            ...(toDate ? { toDate } : {}),
          },
        });
      }

      if (!append) {
        const elapsed = Date.now() - startedAt;
        if (elapsed < MIN_SKELETON_MS) {
          await wait(MIN_SKELETON_MS - elapsed);
        }
      }

      setEntries((current) => (append ? [...current, ...response.data.items] : response.data.items));
      setSummary(response.data.summary);
      setPagination(response.data.pagination);
    } catch {
      setError("We could not load entries right now. Check your connection and try again.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchEntries(1, false);
  }, [fromDate, toDate]);

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
    setPage(1);
    await fetchEntries(1, false);
  };

  const deleteEntry = async (entry: Entry) => {
    await api.delete(`/cashbook/entry/${entry.id}`);
    showToast({
      tone: "success",
      title: "Entry deleted",
      description: `${entry.entry_name} was removed.`,
    });
    setPage(1);
    await fetchEntries(1, false);
  };

  const visibleEntries = useMemo(() => {
    return applyClientFilters(entries);
  }, [applyClientFilters, entries]);

  const exportAllEntries = useCallback(async () => {
    const firstResponse = await api.get<EntryResponse>("/cashbook/entries", {
      params: {
        page: 1,
        limit: 50,
        ...(fromDate ? { fromDate } : {}),
        ...(toDate ? { toDate } : {}),
      },
    });

    const allItems = [...firstResponse.data.items];
    const totalPages = firstResponse.data.pagination.totalPages;

    for (let nextPage = 2; nextPage <= totalPages; nextPage += 1) {
      const response = await api.get<EntryResponse>("/cashbook/entries", {
        params: {
          page: nextPage,
          limit: 50,
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
        },
      });
      allItems.push(...response.data.items);
    }

    return applyClientFilters(allItems);
  }, [applyClientFilters, fromDate, toDate]);

  const hasMore = pagination.page < pagination.totalPages;

  const loadNextPage = useCallback(async () => {
    if (loading || loadingMore || !hasMore) {
      return;
    }

    const nextPage = page + 1;
    setPage(nextPage);
    await fetchEntries(nextPage, true);
  }, [fetchEntries, hasMore, loading, loadingMore, page]);

  const paginationSentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (!node || !hasMore) {
        return;
      }

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            void loadNextPage();
          }
        },
        { rootMargin: "160px 0px" }
      );

      observerRef.current.observe(node);
    },
    [hasMore, loadNextPage]
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

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
        <PullToRefresh
          onRefresh={async () => {
            setPage(1);
            await fetchEntries(1, false);
          }}
        >
          {loading && !entries.length ? (
            <AppContentSkeleton cards={1} rows={4} />
          ) : error && !entries.length ? (
            <InlineErrorState
              title="Unable to load entries"
              message={error}
              onRetry={() => {
                setPage(1);
                fetchEntries(1, false);
              }}
            />
          ) : (
            <>
              {error ? (
                <InlineErrorState
                  title="Sync issue"
                  message={error}
                  actionLabel="Refresh"
                  onRetry={() => {
                    setPage(1);
                    fetchEntries(1, false);
                  }}
                />
              ) : null}
              <FilterBar
                entryScope={entryScope}
                paymentMethod={paymentMethod}
                sortOrder={sortOrder}
                fromDate={fromDate}
                toDate={toDate}
                setEntryScope={setEntryScope}
                setPaymentMethod={setPaymentMethod}
                setSortOrder={setSortOrder}
                setFromDate={setFromDate}
                setToDate={setToDate}
                onPdfExport={async () => exportEntriesToPdf(await exportAllEntries())}
                onExcelExport={async () => exportEntriesToExcel(await exportAllEntries())}
              />
              <EntryList
                entries={visibleEntries}
                totalBalance={summary.balance}
                currentUserId={user.id}
                role={user.role}
                onEdit={(entry) => {
                  setEditingEntry(entry);
                  setOpen(true);
                }}
                onDelete={deleteEntry}
              />
              <Pagination
                pagination={pagination}
                loading={loadingMore}
                hasMore={hasMore}
                sentinelRef={paginationSentinelRef}
              />
            </>
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
      </MobileShell>
    </ProtectedRoute>
  );
}
