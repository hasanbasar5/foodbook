"use client";

import { useEffect, useState } from "react";
import { KeyRound, Pencil, Plus, Search, Trash2, Users, WalletCards } from "lucide-react";
import { AuditLogPanel } from "@/components/AuditLogPanel";
import { CreateUserModal } from "@/components/CreateUserModal";
import { InlineErrorState } from "@/components/InlineErrorState";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { currency } from "@/lib/utils";
import { AdminReportResponse, AuditLogItem, Role, UserRow } from "@/types";

export function AdminPanel({
  role,
  createUserOpen,
  onToggleCreateUser,
}: {
  role: Role;
  createUserOpen: boolean;
  onToggleCreateUser: () => void;
}) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [report, setReport] = useState<AdminReportResponse | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [auditItems, setAuditItems] = useState<AuditLogItem[]>([]);
  const [error, setError] = useState("");

  const loadData = async (userId?: string, nextSearch = search, nextStatus = statusFilter) => {
    setLoading(true);
    setError("");

    try {
      const usersRequest = api.get<{ items: UserRow[]; pagination: { total: number } }>("/admin/users", {
        params: {
          page: 1,
          limit: 20,
          search: nextSearch || undefined,
          status: nextStatus,
        },
      });
      const reportsRequest = api.get<AdminReportResponse>("/admin/reports", {
        params: userId ? { userId } : {},
      });
      const auditRequest =
        role === "SUPER_ADMIN"
          ? api.get<{ items: AuditLogItem[] }>("/admin/audit-logs", {
              params: { limit: 12 },
            })
          : Promise.resolve(null);

      const [usersResponse, reportsResponse, auditResponse] = await Promise.all([
        usersRequest,
        reportsRequest,
        auditRequest,
      ]);

      setUsers(usersResponse.data.items);
      setTotalUsers(usersResponse.data.pagination.total);
      setReport(reportsResponse.data);
      setAuditItems(auditResponse?.data?.items ?? []);
    } catch {
      setError("We could not load organization members right now. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const assignRole = async (userId: number, nextRole: Role) => {
    await api.put("/admin/assign-role", { userId, role: nextRole });
    setFeedback("User role updated.");
    const member = users.find((item) => item.id === userId);
    showToast({
      tone: "success",
      title: "Role updated",
      description: `${member?.full_name || "Member"} is now ${nextRole}.`,
    });
    await loadData(selectedUserId);
  };

  const deleteManagedUser = async (userId: number) => {
    const member = users.find((item) => item.id === userId);
    await api.delete(`/admin/users/${userId}`);
    setFeedback("User deleted.");
    showToast({
      tone: "success",
      title: "Member deleted",
      description: `${member?.full_name || "Member"} was removed from the organization.`,
    });
    await loadData(selectedUserId);
  };

  const toggleUserStatus = async (userId: number, isActive: boolean) => {
    const member = users.find((item) => item.id === userId);
    await api.patch(`/admin/users/${userId}/status`, { isActive });
    setFeedback(`User marked as ${isActive ? "active" : "inactive"}.`);
    showToast({
      tone: "success",
      title: isActive ? "Member activated" : "Member deactivated",
      description: `${member?.full_name || "Member"} is now ${isActive ? "active" : "inactive"}.`,
    });
    await loadData(selectedUserId);
  };

  const resetPassword = async (userId: number) => {
    const response = await api.post<{ temporaryPassword: string }>(`/admin/users/${userId}/reset-password`);
    setFeedback(`Temporary password: ${response.data.temporaryPassword}`);
    const member = users.find((item) => item.id === userId);
    showToast({
      tone: "info",
      title: "Password reset",
      description: `${member?.full_name || "Member"} received a new temporary password.`,
    });
  };

  if (loading) {
    return (
      <div className="rounded-[24px] bg-white p-5 text-sm text-slate-500 shadow-soft">
        Loading admin data...
      </div>
    );
  }

  if (error) {
    return (
      <InlineErrorState
        title="Unable to load admin panel"
        message={error}
        onRetry={() => loadData(selectedUserId)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {feedback ? (
        <div className="rounded-[24px] bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-soft">
          {feedback}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
        <div className="rounded-[24px] bg-white p-4 shadow-soft">
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="h-4 w-4 text-brand-600" />
            Total users
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-900">{totalUsers}</p>
        </div>
        <div className="rounded-[24px] bg-white p-4 shadow-soft">
          <div className="flex items-center gap-2 text-slate-500">
            <WalletCards className="h-4 w-4 text-brand-600" />
            Total entries
          </div>
          <p className="mt-3 text-2xl font-semibold text-slate-900">
            {report?.summary.totalEntries ?? 0}
          </p>
        </div>
      </div>

      <div className="rounded-[24px] bg-white p-4 shadow-soft">
        <div className="mb-4 rounded-2xl bg-brand-50 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-700">Organization</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{user?.organizationName}</p>
          <p className="mt-1 text-xs text-slate-500">
            Roles, members, reports, and audit activity on this screen belong to this organization only.
          </p>
        </div>
        <div className="grid gap-3">
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-500">
            <Search className="h-4 w-4 text-brand-600" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or email"
              className="w-full bg-transparent outline-none"
            />
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              type="button"
              onClick={() => loadData(selectedUserId, search, statusFilter)}
              className="fb-gradient-btn rounded-2xl px-4 py-3 text-sm font-semibold"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] bg-white p-4 shadow-soft">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Global summary</p>
            <p className="text-xs text-slate-500">Filter by member when reviewing organization reports.</p>
          </div>
          <select
            value={selectedUserId}
            onChange={async (event) => {
              const nextValue = event.target.value;
              setSelectedUserId(nextValue);
              await loadData(nextValue);
            }}
            className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none sm:w-auto"
          >
            <option value="">All users</option>
            {users.map((member) => (
              <option key={member.id} value={member.id}>
                {member.email}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3 text-center min-[380px]:grid-cols-3">
          <div className="rounded-2xl bg-emerald-50 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Cash In</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {currency(report?.summary.totalCredit ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl bg-rose-50 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-rose-700">Cash Out</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {currency(report?.summary.totalDebit ?? 0)}
            </p>
          </div>
          <div className="rounded-2xl bg-brand-50 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-700">Balance</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {currency(report?.summary.balance ?? 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] bg-white p-4 shadow-soft">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Organization members</p>
            <p className="text-xs text-slate-500">
              ADMIN can inspect members. SUPER_ADMIN can create, edit, reset, deactivate, and assign roles.
            </p>
          </div>
          {role === "SUPER_ADMIN" ? (
            <button
              type="button"
              onClick={onToggleCreateUser}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700"
            >
              <Plus className="h-4 w-4" />
              New user
            </button>
          ) : null}
        </div>
        <div className="space-y-3">
          {users.map((member) => (
            <div key={member.id} className="rounded-2xl border border-slate-100 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-slate-900">{member.full_name}</p>
                  <p className="break-all text-xs text-slate-500">{member.email}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Entries: {member.entry_count} | Cash In: {currency(Number(member.total_credit || 0))}
                  </p>
                  <p
                    className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${
                      member.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {member.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
                {role === "SUPER_ADMIN" ? (
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                    <select
                      defaultValue={member.role}
                      onChange={(event) => assignRole(member.id, event.target.value as Role)}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs font-medium outline-none sm:w-auto"
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    </select>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUser(member);
                          onToggleCreateUser();
                        }}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => resetPassword(member.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleUserStatus(member.id, !Boolean(member.is_active))}
                        className={`inline-flex rounded-2xl px-3 py-2 text-xs font-semibold ${
                          member.is_active ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {member.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteManagedUser(member.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-rose-50 text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {member.role}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {role === "SUPER_ADMIN" ? (
        <AuditLogPanel items={auditItems} />
      ) : null}

      {role === "SUPER_ADMIN" ? (
        <CreateUserModal
          open={createUserOpen}
          editingUser={editingUser}
          onClose={() => {
            setEditingUser(null);
            onToggleCreateUser();
          }}
          onCreated={() => loadData(selectedUserId)}
        />
      ) : null}
    </div>
  );
}
