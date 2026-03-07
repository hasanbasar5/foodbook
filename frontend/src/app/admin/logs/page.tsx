"use client";

import { useEffect, useState } from "react";
import { AppContentSkeleton } from "@/components/AppContentSkeleton";
import { AppDrawer } from "@/components/AppDrawer";
import { AuditLogPanel } from "@/components/AuditLogPanel";
import { InlineErrorState } from "@/components/InlineErrorState";
import { MobileShell } from "@/components/MobileShell";
import { ProfileModal } from "@/components/ProfileModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TermsModal } from "@/components/TermsModal";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { AuditLogItem } from "@/types";

export default function AdminLogsPage() {
  const { user, loading: authLoading, accessToken } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading || !user || !accessToken) {
      return;
    }

    api
      .get<{ items: AuditLogItem[] }>("/admin/audit-logs", { params: { limit: 30 } })
      .then(({ data }) => setItems(data.items))
      .catch(() => setError("We could not load organization logs right now."))
      .finally(() => setLoading(false));
  }, [accessToken, authLoading, user]);

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute roles={["SUPER_ADMIN"]}>
      <MobileShell
        title="Logs"
        subtitle="Review member, admin, and system activity across your organization."
        showFab={false}
        onOpenDrawer={() => setDrawerOpen(true)}
      >
        {loading ? (
          <AppContentSkeleton cards={2} rows={5} />
        ) : error ? (
          <InlineErrorState
            title="Unable to load logs"
            message={error}
            onRetry={() => window.location.reload()}
          />
        ) : (
          <AuditLogPanel
            items={items}
            title="Logs"
            subtitle="Super admin can inspect who updated profiles, managed users, reset passwords, and edited entries."
          />
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
