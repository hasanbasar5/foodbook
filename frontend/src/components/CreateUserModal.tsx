"use client";

import { FormEvent, useEffect, useState } from "react";
import { Copy, X } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { ManagedUserPayload, Role, UserRow } from "@/types";

export function CreateUserModal({
  open,
  onClose,
  onCreated,
  editingUser,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
  editingUser?: UserRow | null;
}) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "ADMIN" as Role,
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (editingUser) {
      setForm({
        fullName: editingUser.full_name,
        email: editingUser.email,
        password: "",
        role: editingUser.role,
        isActive: Boolean(editingUser.is_active),
      });
      setMessage("");
    } else if (open) {
      setForm({
        fullName: "",
        email: "",
        password: "",
        role: "ADMIN",
        isActive: true,
      });
      setMessage("");
    }
  }, [editingUser, open]);

  if (!open) {
    return null;
  }

  const generatePassword = () => {
    const random = Math.random().toString(36).slice(-10);
    setForm((current) => ({ ...current, password: `Fb@${random}` }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const payload: ManagedUserPayload = {
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      role: form.role,
      isActive: form.isActive,
    };
    if (editingUser) {
      await api.put(`/admin/users/${editingUser.id}`, {
        fullName: payload.fullName,
        password: payload.password || undefined,
        role: payload.role,
        isActive: payload.isActive,
      });
      setMessage("User updated successfully.");
      showToast({
        tone: "success",
        title: "Member updated",
        description: `${payload.fullName} was updated successfully.`,
      });
    } else {
      await api.post("/admin/users", payload);
      setMessage(`User created. Temporary password: ${payload.password}`);
      showToast({
        tone: "success",
        title: "Member created",
        description: `${payload.fullName} was added to the organization.`,
      });
    }
    setSubmitting(false);
    await onCreated();
    if (!editingUser) {
      setForm({ fullName: "", email: "", password: "", role: "ADMIN", isActive: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-900/45 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="max-h-[88vh] w-full animate-slide-up overflow-y-auto rounded-t-[28px] bg-white p-4 shadow-shell sm:max-h-[90vh] sm:max-w-md sm:rounded-[28px] sm:p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Super Admin</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">
              {editingUser ? "Edit managed user" : "Create managed user"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {message ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <div className="flex items-start justify-between gap-3">
                <span>{message}</span>
                {message.includes("Temporary password:") ? (
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(form.password)}
                    className="inline-flex items-center gap-1 rounded-xl bg-white px-2 py-1 text-xs font-semibold text-emerald-700"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
          <input type="text" required value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder="Full name" />
          <input type="email" required disabled={Boolean(editingUser)} value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none disabled:bg-slate-50 disabled:text-slate-400" placeholder="Email" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
            <input type="text" required={!editingUser} minLength={8} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none" placeholder={editingUser ? "Leave blank to keep current password" : "Temporary password"} />
            <button type="button" onClick={generatePassword} className="rounded-2xl bg-slate-100 px-4 py-3 text-xs font-semibold text-slate-700">
              Generate
            </button>
          </div>
          <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none">
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
          </select>
          <label className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Active user
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              className="h-4 w-4"
            />
          </label>
          <button type="submit" disabled={submitting} className="fb-gradient-btn w-full rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-70">
            {submitting ? (editingUser ? "Saving..." : "Creating...") : editingUser ? "Save user" : "Create user"}
          </button>
        </form>
      </div>
    </div>
  );
}
