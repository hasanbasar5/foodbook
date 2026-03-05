"use client";

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
}: {
  items: AuditLogItem[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-[24px] bg-white p-4 shadow-soft">
      <div className="mb-3">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="space-y-3">
        {items.length ? (
          items.map((item) => (
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
                <span className="rounded-full bg-brand-50 px-2 py-1 text-[10px] font-semibold text-brand-700">
                  {item.target_type}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
            No organization activity yet. Member actions will appear here after entries, user changes, and role updates.
          </div>
        )}
      </div>
    </div>
  );
}
