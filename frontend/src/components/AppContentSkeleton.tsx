"use client";

export function AppContentSkeleton({
  cards = 3,
  rows = 4,
}: {
  cards?: number;
  rows?: number;
}) {
  return (
    <div className="space-y-4">
      <div className={`grid gap-3 ${cards === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
        {Array.from({ length: cards }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-[24px] bg-white shadow-soft" />
        ))}
      </div>
      <div className="h-20 animate-pulse rounded-[24px] bg-white shadow-soft" />
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-[24px] bg-white shadow-soft" />
      ))}
    </div>
  );
}
