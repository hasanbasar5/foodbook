"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/context/AuthContext";

const STORAGE_KEY = "foodbook.onboarding.seen";

const slides = [
  {
    eyebrow: "Food Book",
    title: "Cashbook that feels native on mobile.",
    copy: "Track credit and debit entries with a focused mobile shell, bottom navigation, and fast modals.",
  },
  {
    eyebrow: "Organization Access",
    title: "Members work inside one organization space.",
    copy: "USER, ADMIN, and SUPER_ADMIN permissions stay scoped to your organization, not the whole system.",
  },
  {
    eyebrow: "Activity Logs",
    title: "Super admin can review changes clearly.",
    copy: "Entries, role changes, password resets, profile updates, and member actions stay visible in logs.",
  },
];

export default function WelcomePage() {
  const { user, loading } = useAuth();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!loading && user) {
      window.location.replace("/dashboard");
      return;
    }

    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (seen === "true") {
      window.location.replace("/login");
    }
  }, [loading, user]);

  const isLastSlide = index === slides.length - 1;
  const activeSlide = useMemo(() => slides[index], [index]);

  const completeOnboarding = () => {
    window.localStorage.setItem(STORAGE_KEY, "true");
    window.location.href = "/login";
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(47,119,150,0.14),_transparent_38%),linear-gradient(180deg,#f5f8fb_0%,#eaf0f6_100%)]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-8 pt-6">
        <div className="flex items-center justify-between">
          <BrandLogo tone="dark" compact />
          <button
            type="button"
            onClick={completeOnboarding}
            className="rounded-full bg-white/80 px-4 py-2 text-xs font-semibold text-slate-600 shadow-soft"
          >
            Skip
          </button>
        </div>

        <div className="relative mt-8 overflow-hidden rounded-[36px] bg-brand-900 px-6 pb-8 pt-6 text-white shadow-shell">
          <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.08),transparent_45%)]" />
          <Image
            src="/assets/images/shape/my-profile-shape-2.png"
            alt=""
            width={140}
            height={140}
            className="pointer-events-none absolute right-0 top-0 opacity-60"
          />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.25em] text-brand-200">{activeSlide.eyebrow}</p>
            <h1 className="mt-4 max-w-[13ch] text-4xl font-semibold leading-tight">{activeSlide.title}</h1>
            <p className="mt-4 max-w-[28ch] text-sm leading-6 text-brand-100">{activeSlide.copy}</p>
          </div>

          <div className="relative mt-8 rounded-[28px] bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint text-ink">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-semibold">Mobile-first workflow</p>
                <p className="text-xs text-brand-100">Onboarding, auth, entries, profile, and admin actions stay inside one app flow.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {slides.map((slide, slideIndex) => (
            <button
              key={slide.title}
              type="button"
              onClick={() => setIndex(slideIndex)}
              className={`h-2.5 rounded-full transition ${
                slideIndex === index ? "w-8 bg-brand-700" : "w-2.5 bg-slate-300"
              }`}
              aria-label={`Go to slide ${slideIndex + 1}`}
            />
          ))}
        </div>

        <div className="mt-auto space-y-3 pt-8">
          <button
            type="button"
            onClick={() => {
              if (isLastSlide) {
                completeOnboarding();
                return;
              }
              setIndex((current) => current + 1);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-brand-700 px-5 py-4 text-sm font-semibold text-white shadow-soft"
          >
            {isLastSlide ? "Get started" : "Continue"}
            <ArrowRight className="h-4 w-4" />
          </button>
          <Link
            href="/login"
            onClick={() => window.localStorage.setItem(STORAGE_KEY, "true")}
            className="flex w-full items-center justify-center rounded-[24px] bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-soft"
          >
            Already have an account
          </Link>
        </div>
      </div>
    </main>
  );
}
