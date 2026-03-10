"use client";

import { useMemo, useState } from "react";
import { Delete } from "lucide-react";
import { AppDrawer } from "@/components/AppDrawer";
import { MobileShell } from "@/components/MobileShell";
import { ProfileModal } from "@/components/ProfileModal";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { TermsModal } from "@/components/TermsModal";

const buttons = [
  ["C", "+/-", "%", "/"],
  ["7", "8", "9", "*"],
  ["4", "5", "6", "-"],
  ["1", "2", "3", "+"],
  ["0", ".", "DEL", "="],
] as const;

const formatNumber = (value: string) => {
  if (!value || value === "-") {
    return value || "0";
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return value;
  }

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 8,
  }).format(numericValue);
};

const operate = (left: number, right: number, operator: string) => {
  switch (operator) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
      return left * right;
    case "/":
      return right === 0 ? NaN : left / right;
    default:
      return right;
  }
};

export default function CalculatorPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [display, setDisplay] = useState("0");
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState(true);

  const expression = useMemo(() => {
    if (storedValue === null || !operator) {
      return "Ready";
    }

    return `${formatNumber(String(storedValue))} ${operator}`;
  }, [operator, storedValue]);

  const resetCalculator = () => {
    setDisplay("0");
    setStoredValue(null);
    setOperator(null);
    setOverwrite(true);
  };

  const commitOperation = (nextOperator?: string) => {
    const currentValue = Number(display);
    if (Number.isNaN(currentValue)) {
      setDisplay("Error");
      setStoredValue(null);
      setOperator(null);
      setOverwrite(true);
      return;
    }

    if (storedValue === null || !operator) {
      setStoredValue(currentValue);
    } else {
      const result = operate(storedValue, currentValue, operator);
      if (!Number.isFinite(result)) {
        setDisplay("Error");
        setStoredValue(null);
        setOperator(null);
        setOverwrite(true);
        return;
      }
      setStoredValue(result);
      setDisplay(String(result));
    }

    setOperator(nextOperator || null);
    setOverwrite(true);
  };

  const handlePress = (value: string) => {
    if (value === "C") {
      resetCalculator();
      return;
    }

    if (value === "DEL") {
      if (overwrite || display.length === 1 || display === "Error") {
        setDisplay("0");
        setOverwrite(true);
        return;
      }

      setDisplay((current) => current.slice(0, -1));
      return;
    }

    if (value === "+/-") {
      if (display === "0" || display === "Error") {
        return;
      }
      setDisplay((current) => (current.startsWith("-") ? current.slice(1) : `-${current}`));
      return;
    }

    if (value === "%") {
      const numericValue = Number(display);
      if (Number.isNaN(numericValue)) {
        return;
      }
      setDisplay(String(numericValue / 100));
      setOverwrite(true);
      return;
    }

    if (["+", "-", "*", "/"].includes(value)) {
      commitOperation(value);
      return;
    }

    if (value === "=") {
      commitOperation();
      return;
    }

    if (display === "Error") {
      setDisplay(value === "." ? "0." : value);
      setOverwrite(false);
      return;
    }

    if (overwrite) {
      setDisplay(value === "." ? "0." : value);
      setOverwrite(false);
      return;
    }

    if (value === "." && display.includes(".")) {
      return;
    }

    setDisplay((current) => `${current === "0" && value !== "." ? "" : current}${value}`);
  };

  return (
    <ProtectedRoute>
      <MobileShell showFab={false} onOpenDrawer={() => setDrawerOpen(true)}>
        <div className="space-y-4">
          <div className="rounded-[24px] bg-white p-4 shadow-soft">
            <p className="text-sm font-semibold text-slate-900">Calculator</p>
            <p className="mt-1 text-xs text-slate-500">
              Quick calculations for entries, balance checks, and manual totals.
            </p>
          </div>

          <div className="rounded-[28px] bg-[#0b2230] p-4 text-white shadow-soft">
            <p className="text-right text-xs uppercase tracking-[0.18em] text-white/50">{expression}</p>
            <p className="mt-3 break-all text-right text-4xl font-semibold">{formatNumber(display)}</p>
          </div>

          <div className="rounded-[24px] bg-white p-3 shadow-soft">
            <div className="grid grid-cols-4 gap-3">
              {buttons.flat().map((button) => {
                const isOperator = ["/", "*", "-", "+", "="].includes(button);
                const isUtility = ["C", "+/-", "%", "DEL"].includes(button);

                return (
                  <button
                    key={button}
                    type="button"
                    onClick={() => handlePress(button)}
                    className={`flex h-14 items-center justify-center rounded-2xl text-sm font-semibold transition active:scale-95 ${
                      isOperator
                        ? "bg-brand-700 text-white"
                        : isUtility
                          ? "bg-slate-100 text-slate-700"
                          : "bg-slate-50 text-slate-900"
                    }`}
                  >
                    {button === "DEL" ? <Delete className="h-4 w-4" /> : button}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

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
