"use client";

export function InlineErrorState({
  title,
  message,
  actionLabel = "Try again",
  onRetry,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-[24px] border border-rose-100 bg-white p-5 shadow-soft">
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
