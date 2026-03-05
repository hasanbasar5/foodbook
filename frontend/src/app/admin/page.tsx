"use client";

import { useState } from "react";
import { AdminPanel } from "@/components/AdminPanel";
import { AppDrawer } from "@/components/AppDrawer";
import { MobileShell } from "@/components/MobileShell";
import { ProfileModal } from "@/components/ProfileModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TermsModal } from "@/components/TermsModal";
import { useAuth } from "@/context/AuthContext";

export default function AdminPage() {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
      <MobileShell
        title="Admin"
        subtitle="Inspect system-wide cashbook activity and manage role access."
        showFab={false}
        onOpenDrawer={() => setDrawerOpen(true)}
      >
        <AdminPanel
          role={user.role}
          createUserOpen={createUserOpen}
          onToggleCreateUser={() => setCreateUserOpen((current) => !current)}
        />
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
          onOpenAdminCreate={() => {
            setDrawerOpen(false);
            setCreateUserOpen(true);
          }}
          onOpenLogs={() => setDrawerOpen(false)}
        />
        <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
        <TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
      </MobileShell>
    </ProtectedRoute>
  );
}
