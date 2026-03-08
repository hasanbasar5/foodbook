"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { AuditLogPanel } from "@/components/AuditLogPanel";
import { CreateUserModal } from "@/components/CreateUserModal";
import { InlineErrorState } from "@/components/InlineErrorState";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { currency } from "@/lib/utils";
import { AdminReportResponse, AuditLogItem, Entry, Role, UserRow } from "@/types";

type EntryWithOrganization = Entry & { organization_name?: string | null };

export function AdminPanel({
  role,
  createUserOpen,
  onToggleCreateUser,
  endpointPrefix = "/admin",
  scopeTitle,
  scopeDescription,
  membersTitle,
  canManageOverride,
  showAuditPanel = true,
}: {
  role: Role;
  createUserOpen: boolean;
  onToggleCreateUser: () => void;
  endpointPrefix?: string;
  scopeTitle?: string;
  scopeDescription?: string;
  membersTitle?: string;
  canManageOverride?: boolean;
  showAuditPanel?: boolean;
}) {
  const { user, loading: authLoading, accessToken } = useAuth();
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
  const [deletedEntries, setDeletedEntries] = useState<EntryWithOrganization[]>([]);
  const [error, setError] = useState("");
  const [passwordResetTarget, setPasswordResetTarget] = useState<UserRow | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetConfirmPasswordValue, setResetConfirmPasswordValue] = useState("");
  const [resetPasswordVisible, setResetPasswordVisible] = useState(false);
  const [resetConfirmPasswordVisible, setResetConfirmPasswordVisible] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const canManage = canManageOverride ?? role === "SUPER_ADMIN";
  const canShowAuditAndRestore = canManage && showAuditPanel;

  const loadData = async (userId?: string, nextSearch = search, nextStatus = statusFilter) => {
    setLoading(true);
    setError("");

    try {
      const usersRequest = api.get<{ items: UserRow[]; pagination: { total: number } }>(`${endpointPrefix}/users`, {
        params: {
          page: 1,
          limit: 20,
          search: nextSearch || undefined,
          status: nextStatus,
        },
      });
      const reportsRequest = api.get<AdminReportResponse>(`${endpointPrefix}/reports`, {
        params: userId ? { userId } : {},
      });
      const auditRequest = canShowAuditAndRestore
        ? api.get<{ items: AuditLogItem[] }>(`${endpointPrefix}/audit-logs`, {
            params: { limit: 12 },
          })
        : Promise.resolve(null);
      const deletedEntriesRequest = canManage
        ? api.get<{ items: EntryWithOrganization[] }>(`${endpointPrefix}/deleted-entries`, {
            params: { limit: 12 },
          })
        : Promise.resolve(null);

      const [usersResponse, reportsResponse, auditResponse, deletedEntriesResponse] = await Promise.all([
        usersRequest,
        reportsRequest,
        auditRequest,
        deletedEntriesRequest,
      ]);

      setUsers(usersResponse.data.items);
      setTotalUsers(usersResponse.data.pagination.total);
      setReport(reportsResponse.data);
      setAuditItems(auditResponse?.data?.items ?? []);
      setDeletedEntries(deletedEntriesResponse?.data?.items ?? []);
    } catch {
      setError(
        canManageOverride
          ? "We could not load owner management data right now. Try again."
          : "We could not load organization members right now. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user || !accessToken) {
      return;
    }

    void loadData();
  }, [accessToken, authLoading, user]);

  const assignRole = async (userId: number, nextRole: Role) => {
    await api.put(`${endpointPrefix}/assign-role`, { userId, role: nextRole });
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
    await api.delete(`${endpointPrefix}/users/${userId}`);
    setFeedback("User deleted.");
    showToast({
      tone: "success",
      title: "Member deleted",
      description: `${member?.full_name || "Member"} was removed successfully.`,
    });
    await loadData(selectedUserId);
  };

  const toggleUserStatus = async (userId: number, isActive: boolean) => {
    const member = users.find((item) => item.id === userId);
    await api.patch(`${endpointPrefix}/users/${userId}/status`, { isActive });
    setFeedback(`User marked as ${isActive ? "active" : "inactive"}.`);
    showToast({
      tone: "success",
      title: isActive ? "Member activated" : "Member deactivated",
      description: `${member?.full_name || "Member"} is now ${isActive ? "active" : "inactive"}.`,
    });
    await loadData(selectedUserId);
  };

  const openPasswordReset = (member: UserRow) => {
    setPasswordResetTarget(member);
    setResetPasswordValue("");
    setResetConfirmPasswordValue("");
    setResetPasswordVisible(false);
    setResetConfirmPasswordVisible(false);
  };

  const resetPassword = async () => {
    if (!passwordResetTarget) {
      return;
    }

    const manualPassword = resetPasswordValue.trim();
    const requiresManualPassword =
      passwordResetTarget.role === "ADMIN" || passwordResetTarget.role === "SUPER_ADMIN";

    if (manualPassword && manualPassword !== resetConfirmPasswordValue.trim()) {
      showToast({
        tone: "error",
        title: "Password mismatch",
        description: "Password and confirm password must match.",
      });
      return;
    }

    if (requiresManualPassword && !manualPassword) {
      showToast({
        tone: "error",
        title: "Password required",
        description: "Admin and super admin accounts require a manually entered password.",
      });
      return;
    }

    setResetSubmitting(true);
    try {
      const response = await api.post<{ temporaryPassword: string; wasAutoGenerated: boolean }>(
        `${endpointPrefix}/users/${passwordResetTarget.id}/reset-password`,
        {
          ...(manualPassword ? { password: manualPassword } : {}),
        }
      );
      setFeedback(`Temporary password: ${response.data.temporaryPassword}`);
      showToast({
        tone: "info",
        title: "Password reset",
        description: response.data.wasAutoGenerated
          ? `${passwordResetTarget.full_name || "Member"} received an auto-generated password.`
          : `${passwordResetTarget.full_name || "Member"} received the password you set.`,
      });
      setPasswordResetTarget(null);
    } catch {
      showToast({
        tone: "error",
        title: "Password reset failed",
        description: "Enter a valid password for elevated accounts or try again.",
      });
    } finally {
      setResetSubmitting(false);
    }
  };

  const restoreDeletedEntry = async (entryId: number) => {
    try {
      await api.patch(`/cashbook/entry/${entryId}/restore`);
      showToast({
        tone: "success",
        title: "Entry restored",
        description: "The deleted entry is back in the cashbook.",
      });
      await loadData(selectedUserId);
    } catch {
      showToast({
        tone: "error",
        title: "Restore failed",
        description: "We could not restore that entry right now.",
      });
    }
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
        title={canManageOverride ? "Unable to load owner panel" : "Unable to load admin panel"}
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
          <p className="mt-3 text-2xl font-semibold text-slate-900">{report?.summary.totalEntries ?? 0}</p>
        </div>
      </div>

      <div className="rounded-[24px] bg-white p-4 shadow-soft">
        <div className="mb-4 rounded-2xl bg-brand-50 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-brand-700">Scope</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {scopeTitle || user?.organizationName || "All accounts"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {scopeDescription ||
              "Roles, members, reports, and audit activity on this screen belong to this organization only."}
          </p>
        </div>
        <div className="grid gap-3">
          <label className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-500">
            <Search className="h-4 w-4 text-brand-600" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, or organization"
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
            <p className="text-xs text-slate-500">Filter by member when reviewing reports.</p>
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
            <p className="mt-2 text-sm font-semibold text-slate-900">{currency(report?.summary.totalCredit ?? 0)}</p>
          </div>
          <div className="rounded-2xl bg-rose-50 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-rose-700">Cash Out</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{currency(report?.summary.totalDebit ?? 0)}</p>
          </div>
          <div className="rounded-2xl bg-brand-50 p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-brand-700">Balance</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">{currency(report?.summary.balance ?? 0)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[24px] bg-white p-4 shadow-soft">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">{membersTitle || "Organization members"}</p>
          </div>
          {canManage ? (
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
                  {member.organization_name ? (
                    <p className="mt-1 text-xs text-slate-500">{member.organization_name}</p>
                  ) : null}
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
                {canManage ? (
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
                        onClick={() => openPasswordReset(member)}
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

      {canShowAuditAndRestore ? (
        <AuditLogPanel items={auditItems} canRestoreEntries onRestoreEntry={restoreDeletedEntry} />
      ) : null}

      {canManage ? (
        <div className="rounded-[24px] bg-white p-4 shadow-soft">
          <div className="mb-3">
            <p className="text-sm font-semibold text-slate-900">Deleted entries</p>
            <p className="text-xs text-slate-500">
              {canManageOverride
                ? "Owner can restore recently deleted cashbook entries across the app."
                : "Super admin can restore recently deleted cashbook entries here."}
            </p>
          </div>
          <div className="space-y-3">
            {deletedEntries.length ? (
              deletedEntries.map((entry) => (
                <div key={entry.id} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{entry.entry_name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {entry.full_name || entry.email || "User"} | {entry.entry_type} | {currency(Number(entry.amount))}
                    </p>
                    {entry.organization_name ? (
                      <p className="mt-1 text-xs text-slate-500">{entry.organization_name}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-slate-500">
                      Deleted {entry.deleted_at ? new Date(entry.deleted_at).toLocaleString() : "recently"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => restoreDeletedEntry(entry.id)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restore
                  </button>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                No deleted entries are waiting to be restored.
              </div>
            )}
          </div>
        </div>
      ) : null}

      {canManage ? (
        <CreateUserModal
          open={createUserOpen}
          editingUser={editingUser}
          endpointPrefix={endpointPrefix}
          modalLabel={canManageOverride ? "Owner" : "Super Admin"}
          onClose={() => {
            setEditingUser(null);
            onToggleCreateUser();
          }}
          onCreated={() => loadData(selectedUserId)}
        />
      ) : null}
      {passwordResetTarget ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-900/45 backdrop-blur-sm sm:items-center sm:justify-center">
          <div className="w-full animate-slide-up rounded-t-[28px] bg-white p-5 shadow-shell sm:max-w-md sm:rounded-[28px]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Password reset</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">{passwordResetTarget.full_name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPasswordResetTarget(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm leading-6 text-slate-500">
                {passwordResetTarget.role === "USER"
                  ? "Enter a new password manually, or leave both fields empty to auto-generate one."
                  : "Enter a new password manually for this elevated account."}
              </p>
              <div className="relative">
                <input
                  type={resetPasswordVisible ? "text" : "password"}
                  value={resetPasswordValue}
                  onChange={(event) => setResetPasswordValue(event.target.value)}
                  minLength={resetPasswordValue ? 8 : undefined}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 text-sm outline-none"
                  placeholder="New password"
                />
                <button
                  type="button"
                  onClick={() => setResetPasswordVisible((current) => !current)}
                  className="absolute inset-y-0 right-3 inline-flex items-center text-slate-400"
                >
                  {resetPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={resetConfirmPasswordVisible ? "text" : "password"}
                  value={resetConfirmPasswordValue}
                  onChange={(event) => setResetConfirmPasswordValue(event.target.value)}
                  minLength={resetConfirmPasswordValue ? 8 : undefined}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 text-sm outline-none"
                  placeholder="Confirm password"
                />
                <button
                  type="button"
                  onClick={() => setResetConfirmPasswordVisible((current) => !current)}
                  className="absolute inset-y-0 right-3 inline-flex items-center text-slate-400"
                >
                  {resetConfirmPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPasswordResetTarget(null)}
                  className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={resetPassword}
                  disabled={resetSubmitting}
                  className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
                >
                  {resetSubmitting ? "Saving..." : "Reset password"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
