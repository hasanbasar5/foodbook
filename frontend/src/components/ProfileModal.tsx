"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { KeyRound, Upload, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export function ProfileModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, updateProfile, changePassword } = useAuth();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (user && open) {
      setFullName(user.fullName || "");
      setAvatarUrl(user.avatarUrl || null);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
    }
  }, [open, user]);

  if (!open || !user) {
    return null;
  }

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileSubmitting(true);

    try {
      await updateProfile(fullName, avatarUrl);
      showToast({
        tone: "success",
        title: "Profile updated",
        description: "Your profile changes were saved successfully.",
      });
      onClose();
    } finally {
      setProfileSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation must match.");
      return;
    }

    setPasswordSubmitting(true);

    try {
      await changePassword(currentPassword, newPassword, confirmPassword);
      onClose();
    } catch (error) {
      setPasswordError(
        isAxiosError(error)
          ? error.response?.data?.message || "Unable to change password right now."
          : error instanceof Error
            ? error.message
            : "Unable to change password right now."
      );
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-900/45 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="max-h-[88vh] w-full animate-slide-up overflow-y-auto rounded-t-[28px] bg-white p-4 shadow-shell sm:max-h-[90vh] sm:max-w-md sm:rounded-[28px] sm:p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Profile</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-900">Update your account</h2>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex flex-col items-start gap-4 rounded-2xl bg-slate-50 p-4 sm:flex-row sm:items-center">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" width={64} height={64} className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                {user.fullName?.slice(0, 1) || user.email.slice(0, 1)}
              </div>
            )}
            <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-soft sm:w-auto">
              <Upload className="h-4 w-4" />
              Upload picture
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
          </div>
          <input
            type="text"
            required
            minLength={2}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            placeholder="Full name"
          />
          <input
            type="email"
            disabled
            value={user.email}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 outline-none"
          />
          <button type="submit" disabled={profileSubmitting} className="fb-gradient-btn w-full rounded-2xl px-4 py-3 text-sm font-semibold disabled:opacity-70">
            {profileSubmitting ? "Saving..." : "Save profile"}
          </button>
        </form>
        <div className="my-5 border-t border-dashed border-slate-200" />
        <form className="space-y-4" onSubmit={handlePasswordSubmit}>
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-white p-2 text-brand-700 shadow-soft">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Change password</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Update your password here. You will be asked to sign in again after saving.
                </p>
              </div>
            </div>
          </div>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            placeholder="Current password"
          />
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            placeholder="New password"
          />
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
            placeholder="Confirm new password"
          />
          {passwordError ? (
            <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {passwordError}
            </div>
          ) : null}
          <button
            type="submit"
            disabled={passwordSubmitting}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-70"
          >
            {passwordSubmitting ? "Updating password..." : "Change password"}
          </button>
        </form>
      </div>
    </div>
  );
}
