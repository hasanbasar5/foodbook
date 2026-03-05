"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export function AuthCard({
  title,
  subtitle,
  footerLabel,
  footerHref,
  footerText,
  children,
}: {
  title: string;
  subtitle: string;
  footerLabel: string;
  footerHref: string;
  footerText: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-shell px-3 py-3 text-white sm:px-4 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-6xl overflow-hidden rounded-[28px] bg-white/8 shadow-shell backdrop-blur sm:min-h-[calc(100vh-3rem)] sm:rounded-[32px]">
        <section className="relative hidden flex-1 overflow-hidden bg-brand-900 lg:block">
          <div className="absolute inset-0 bg-login-art bg-cover bg-center opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/95 via-brand-800/70 to-mint/20" />
          <Image
            src="/assets/images/shape/banner-two-shape5.png"
            alt=""
            width={140}
            height={80}
            className="absolute bottom-10 right-10 animate-float opacity-80"
          />
          <div className="relative flex h-full flex-col justify-between p-10">
            <div className="inline-flex w-fit rounded-[20px] bg-white/10 px-4 py-3 text-sm font-medium text-brand-50">
              <BrandLogo tone="light" />
            </div>
            <div className="max-w-sm space-y-5">
              <h1 className="text-4xl font-semibold leading-tight">
                Daily cashflow, role controls, and mobile-first bookkeeping in one web app.
              </h1>
              <p className="text-sm leading-6 text-brand-100">
                Rebuilt on your PayOne template assets with an app-style shell instead of a marketing site.
              </p>
            </div>
          </div>
        </section>
        <section className="flex w-full flex-1 items-center justify-center bg-shell-grid px-3 py-5 sm:px-8 sm:py-8">
          <div className="w-full max-w-md animate-slide-up rounded-[24px] border border-white/70 bg-white p-5 text-ink shadow-soft sm:rounded-[28px] sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-3 sm:mb-8">
              <div className="min-w-0">
                <BrandLogo tone="dark" />
                <h2 className="mt-2 text-[1.9rem] font-semibold leading-tight sm:text-3xl">{title}</h2>
              </div>
              <div className="shrink-0 rounded-full bg-brand-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-700 sm:px-4 sm:text-xs sm:tracking-[0.24em]">
                v1.0
              </div>
            </div>
            <p className="mb-6 text-sm leading-6 text-slate-500 sm:mb-8">{subtitle}</p>
            {children}
            <p className="mt-6 flex flex-wrap items-center justify-center gap-2 text-center text-sm text-slate-500">
              {footerText}
              <Link href={footerHref} className="inline-flex items-center gap-1 font-semibold text-brand-600">
                {footerLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
