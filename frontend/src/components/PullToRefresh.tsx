"use client";

import { useRef, useState } from "react";
import { RotateCw } from "lucide-react";

export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}) {
  const startY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (window.scrollY === 0) {
      startY.current = event.touches[0].clientY;
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (startY.current === null) {
      return;
    }
    const distance = event.touches[0].clientY - startY.current;
    if (distance > 0) {
      setPullDistance(Math.min(distance, 80));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 65 && !refreshing) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    startY.current = null;
    setPullDistance(0);
  };

  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <div className="flex items-center justify-center overflow-hidden text-xs text-slate-500 transition-all" style={{ height: pullDistance }}>
        <span className="flex items-center gap-2">
          <RotateCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Pull to refresh"}
        </span>
      </div>
      {children}
    </div>
  );
}
