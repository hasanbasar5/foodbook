"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "foodbook.onboarding.seen";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (seen !== "true") {
      window.location.replace("/welcome");
      return;
    }
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return <>{children}</>;
}
