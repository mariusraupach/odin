import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Bold building/house count shown at the start of a node title. */
export function CountBadge({
  count,
  children,
}: {
  count: number;
  children?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex h-6 shrink-0 items-center gap-1 rounded-md px-1.5 text-sm font-semibold tabular-nums",
        count > 0
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground",
      )}
    >
      {children}
      {count}×
    </span>
  );
}

/**
 * Cards peeking out behind a node to show it stands for several buildings:
 * one for 2, two for 3 or more. Rendered before the card, which must be
 * `relative` so it sits on top.
 */
export function StackLayers({ count }: { count: number }) {
  const layers = Math.min(2, Math.max(0, count - 1));
  return Array.from({ length: layers }, (_, i) => (
    <div
      key={i}
      aria-hidden
      className="bg-card ring-foreground/10 absolute inset-0 rounded-xl ring-1"
      style={{
        transform: `translate(${(layers - i) * 5}px, ${(layers - i) * 5}px)`,
      }}
    />
  ));
}
