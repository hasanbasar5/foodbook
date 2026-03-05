"use client";

import { useEffect, useMemo, useState } from "react";

interface GuideStep {
  selector: string;
  title: string;
  description: string;
}

export function DashboardGuide({
  userId,
  open,
  onClose,
}: {
  userId: number;
  open: boolean;
  onClose: () => void;
}) {
  const steps = useMemo<GuideStep[]>(
    () => [
      {
        selector: "summary",
        title: "Track your totals first",
        description: "This area shows total credit, total debit, and your live balance at a glance.",
      },
      {
        selector: "entries-nav",
        title: "Open Entries for full history",
        description: "Use the Entries tab below to review all records, filter by type, sort by amount, and export data.",
      },
      {
        selector: "add-entry",
        title: "Add a new entry here",
        description: "Tap the floating button to create a debit or credit entry with category and payment method.",
      },
      {
        selector: "profile-trigger",
        title: "Open your account tools here",
        description: "Use this profile button to open the drawer for profile, terms, admin tools, and logs.",
      },
    ],
    []
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const updateRect = () => {
      const target = document.querySelector<HTMLElement>(`[data-tour="${steps[stepIndex].selector}"]`);
      if (!target) {
        setRect(null);
        return;
      }

      target.scrollIntoView({ block: "center", behavior: "smooth" });
      window.setTimeout(() => {
        setRect(target.getBoundingClientRect());
      }, 160);
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [open, stepIndex, steps]);

  const finishGuide = () => {
    window.localStorage.setItem(`foodbook.dashboard.guide.${userId}`, "true");
    onClose();
  };

  if (!open) {
    return null;
  }

  const current = steps[stepIndex];

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/55 backdrop-blur-[2px]">
      {rect ? (
        <div
          className="pointer-events-none fixed rounded-[28px] border-2 border-mint shadow-[0_0_0_9999px_rgba(2,6,23,0.58)] transition-all"
          style={{
            top: rect.top - 8,
            left: rect.left - 8,
            width: rect.width + 16,
            height: rect.height + 16,
          }}
        />
      ) : null}

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md p-4">
        <div className="rounded-[28px] bg-white p-5 shadow-shell">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-600">
              Step {stepIndex + 1} of {steps.length}
            </p>
            <button
              type="button"
              onClick={finishGuide}
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              Skip
            </button>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-slate-900">{current.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{current.description}</p>
          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {steps.map((step, index) => (
                <span
                  key={step.selector}
                  className={`h-2.5 rounded-full transition-all ${index === stepIndex ? "w-8 bg-brand-700" : "w-2.5 bg-slate-300"}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                if (stepIndex === steps.length - 1) {
                  finishGuide();
                  return;
                }
                setStepIndex((currentStep) => currentStep + 1);
              }}
              className="rounded-2xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white"
            >
              {stepIndex === steps.length - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
