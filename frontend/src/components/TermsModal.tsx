"use client";

import { X } from "lucide-react";

export function TermsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-900/45 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="max-h-[88vh] w-full animate-slide-up overflow-y-auto rounded-t-[28px] bg-white p-4 shadow-shell sm:max-h-[90vh] sm:max-w-lg sm:rounded-[28px] sm:p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Version 1.0</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Terms & app notes</h2>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 text-sm leading-7 text-slate-600">
          <p>Food Book v1.0 is designed for daily cashflow management with role-based visibility and admin controls.</p>
          <p>Users can maintain their own entries, admins can review reports, and super admins can manage platform users and roles.</p>
          <p>Use only valid financial records. Uploaded profile pictures are stored as profile data and should remain work-appropriate.</p>
        </div>
      </div>
    </div>
  );
}
