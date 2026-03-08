"use client";

import { FormEvent, useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useRouter } from "next/navigation";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function AuthForm({
  mode,
  ownerOnly = false,
}: {
  mode: "login" | "register";
  ownerOnly?: boolean;
}) {
  const { login, ownerLogin, register, user } = useAuth();
  const router = useRouter();
  const [accountType, setAccountType] = useState<"user" | "business">("user");
  const [organizationName, setOrganizationName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      router.replace(user.isOwner ? "/owner" : "/dashboard");
    }
  }, [router, user]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (mode === "login") {
        if (ownerOnly) {
          await ownerLogin(email, password);
        } else {
          await login(email, password);
        }
      } else {
        await register({
          email,
          password,
          fullName,
          accountType,
          organizationName: accountType === "business" ? organizationName : undefined,
        });
      }
    } catch (err: unknown) {
      setError(
        isAxiosError(err)
          ? err.response?.data?.message || (ownerOnly ? "Unable to access owner login right now." : "Unable to continue right now.")
          : err instanceof Error
            ? err.message
            : ownerOnly
              ? "Unable to access owner login right now."
              : "Unable to continue right now."
      );
      setSubmitting(false);
    }
  };

  return (
    <form className="space-y-4 sm:space-y-5" onSubmit={onSubmit}>
      {mode === "register" ? (
        <>
          <div className="grid grid-cols-2 gap-1.5 rounded-[20px] bg-slate-100 p-1 sm:gap-2 sm:rounded-[22px]">
            <button
              type="button"
              onClick={() => setAccountType("user")}
              className={`rounded-[18px] px-3 py-3 text-sm font-semibold transition ${
                accountType === "user" ? "bg-white text-brand-700 shadow-soft" : "text-slate-500"
              }`}
            >
              Normal user
            </button>
            <button
              type="button"
              onClick={() => setAccountType("business")}
              className={`rounded-[18px] px-3 py-3 text-sm font-semibold transition ${
                accountType === "business" ? "bg-white text-brand-700 shadow-soft" : "text-slate-500"
              }`}
            >
              New business
            </button>
          </div>
          {accountType === "business" ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Business name</span>
              <input
                type="text"
                required
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:bg-white"
                placeholder="Your business name"
              />
            </label>
          ) : null}
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">
              {accountType === "business" ? "Owner name" : "Full name"}
            </span>
            <input
              type="text"
              required
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:bg-white"
              placeholder={accountType === "business" ? "Business owner name" : "Your name"}
            />
          </label>
          {/* {accountType === "business" ? (
            <div className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
              This option creates a new organization and makes this account the `SUPER_ADMIN`.
            </div>
          ) : null} */}
        </>
      ) : null}
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Email address</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:bg-white"
          placeholder="you@example.com"
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium text-slate-700">Password</span>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-brand-400 focus:bg-white"
          placeholder="Minimum 8 characters"
        />
      </label>
      {error ? (
        <div className="flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="fb-gradient-btn flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:opacity-70"
      >
        {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        {mode === "login" ? (ownerOnly ? "Sign in as owner" : "Sign in") : "Create account"}
      </button>
      {/* {ownerOnly ? (
        <div className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
          Only the owner account from the users table with `id = 3` can use this page.
        </div>
      ) : null} */}
    </form>
  );
}
