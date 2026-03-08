"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, Users } from "lucide-react";
import { AppContentSkeleton } from "@/components/AppContentSkeleton";
import { AdminPanel } from "@/components/AdminPanel";
import { AppDrawer } from "@/components/AppDrawer";
import { InlineErrorState } from "@/components/InlineErrorState";
import { MobileShell } from "@/components/MobileShell";
import { ProfileModal } from "@/components/ProfileModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TermsModal } from "@/components/TermsModal";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { OwnerDashboardResponse } from "@/types";

const summarizeUserAgent = (userAgent?: string | null) => {
  if (!userAgent) {
    return "Unknown device";
  }

  const agent = userAgent.toLowerCase();
  const browser = agent.includes("edg/")
    ? "Edge"
    : agent.includes("chrome/")
      ? "Chrome"
      : agent.includes("firefox/")
        ? "Firefox"
        : agent.includes("safari/")
          ? "Safari"
          : "Browser";
  const device = agent.includes("mobile") ? "Mobile" : "Desktop";

  return `${browser} on ${device}`;
};

export default function OwnerPage() {
  const { user, loading: authLoading, accessToken } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [data, setData] = useState<OwnerDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOwnerDashboard = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<OwnerDashboardResponse>("/owner/dashboard");
      setData(response.data);
    } catch {
      setError("We could not load owner analytics right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || !user || !accessToken || !user.isOwner) {
      return;
    }

    void loadOwnerDashboard();
  }, [accessToken, authLoading, user]);

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute requireOwner>
      <MobileShell showFab={false} onOpenDrawer={() => setDrawerOpen(true)}>
        {loading ? (
          <AppContentSkeleton cards={3} rows={5} />
        ) : error ? (
          <InlineErrorState
            title="Unable to load owner dashboard"
            message={error}
            onRetry={loadOwnerDashboard}
          />
        ) : (
          <div className="space-y-4">
            <div className="rounded-[24px] bg-white p-4 shadow-soft">
              <p className="text-sm font-semibold text-slate-900">Owner dashboard</p>
              <p className="mt-1 text-xs text-slate-500">
                Global login visibility across the app using the owner account.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[24px] bg-white p-4 shadow-soft">
                <div className="flex items-center gap-2 text-slate-500">
                  <Activity className="h-4 w-4 text-brand-600" />
                  Total events
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-900">
                  {data?.summary.totalEvents ?? 0}
                </p>
              </div>
              <div className="rounded-[24px] bg-white p-4 shadow-soft">
                <div className="flex items-center gap-2 text-slate-500">
                  <Users className="h-4 w-4 text-emerald-600" />
                  Registrations
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-900">
                  {data?.summary.totalRegistrations ?? 0}
                </p>
              </div>
              <div className="rounded-[24px] bg-white p-4 shadow-soft">
                <div className="flex items-center gap-2 text-slate-500">
                  <Activity className="h-4 w-4 text-brand-600" />
                  Successful logins
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{data?.summary.successfulLogins ?? 0}</p>
              </div>
              <div className="rounded-[24px] bg-white p-4 shadow-soft">
                <div className="flex items-center gap-2 text-slate-500">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  Failed logins
                </div>
                <p className="mt-3 text-2xl font-semibold text-slate-900">{data?.summary.failedLogins ?? 0}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-brand-50 p-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.18em] text-brand-700">Today</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{data?.summary.activeUsers1d ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-brand-50 p-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.18em] text-brand-700">7 days</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{data?.summary.activeUsers7d ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-brand-50 p-3 text-center">
                <p className="text-[10px] uppercase tracking-[0.18em] text-brand-700">30 days</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">{data?.summary.activeUsers30d ?? 0}</p>
              </div>
            </div>
            <div className="rounded-[24px] bg-white p-4 shadow-soft">
              <div className="mb-3">
                <p className="text-sm font-semibold text-slate-900">Recent login events</p>
                <p className="text-xs text-slate-500">Includes IP and device/browser summary.</p>
              </div>
              <div className="space-y-3">
                {data?.items.length ? (
                  data.items.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-100 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-all text-sm font-semibold text-slate-900">
                            {item.full_name || item.email}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.organization_name || "Personal account"} | {summarizeUserAgent(item.user_agent)}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            IP: {item.ip_address || "Unknown"} | {new Date(item.created_at).toLocaleString()}
                          </p>
                          {item.failure_reason ? (
                            <p className="mt-1 text-xs text-rose-600">Reason: {item.failure_reason}</p>
                          ) : null}
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                            item.status === "SUCCESS"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {item.event_type} {item.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                    No login events found yet.
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-[24px] bg-white p-4 shadow-soft">
              <div className="mb-3">
                <p className="text-sm font-semibold text-slate-900">Last login per user</p>
                <p className="text-xs text-slate-500">Most recent successful login for each account.</p>
              </div>
              <div className="space-y-3">
                {data?.lastLogins.length ? (
                  data.lastLogins.map((item) => (
                    <div key={`${item.email}-${item.created_at}`} className="rounded-2xl border border-slate-100 p-3">
                      <p className="break-all text-sm font-semibold text-slate-900">{item.full_name || item.email}</p>
                      <p className="mt-1 text-xs text-slate-500">{item.organization_name || "Personal account"}</p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                    No successful logins recorded yet.
                  </div>
                )}
              </div>
            </div>
            <AdminPanel
              role="SUPER_ADMIN"
              createUserOpen={createUserOpen}
              onToggleCreateUser={() => setCreateUserOpen((current) => !current)}
              endpointPrefix="/owner"
              scopeTitle="Owner global control"
              scopeDescription="This panel lets the app owner review and manage users across every organization."
              membersTitle="All registered users"
              canManageOverride
              showAuditPanel={false}
            />
          </div>
        )}
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
