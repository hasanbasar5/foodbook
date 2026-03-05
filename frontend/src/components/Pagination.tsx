"use client";

import { LoaderCircle } from "lucide-react";
import { PaginationMeta } from "@/types";

export function Pagination({
  pagination,
  loading = false,
  hasMore,
  sentinelRef,
}: {
  pagination: PaginationMeta;
  loading?: boolean;
  hasMore: boolean;
  sentinelRef?: (node: HTMLDivElement | null) => void;
}) {
  if (pagination.total === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-[24px] bg-white p-4 shadow-soft">
      <p className="text-center text-sm text-slate-500">
        Showing {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
      </p>
      {hasMore ? (
        <>
          <div ref={sentinelRef} className="h-3 w-full" />
          <div className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-3 py-3 text-sm font-medium text-slate-600">
            <LoaderCircle className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Loading more entries..." : "Scroll down to load more"}
          </div>
        </>
      ) : (
        <div className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700">
          All {pagination.total} entries loaded
        </div>
      )}
    </div>
  );
}
