"use client";

import { createContext, use } from "react";
import type { FlowResult, PlanEdge, PlanNode } from "@/lib/anno/calc";

export const FlowContext = createContext<FlowResult | null>(null);

export function useFlow() {
  const flow = use(FlowContext);
  if (!flow) throw new Error("useFlow must be used inside <FlowContext>");
  return flow;
}

export type Focus = { nodes: Set<string>; edges: Set<string> };

/** How the canvas is currently shown, for nodes and edges to adapt to. */
export type View = {
  /** What stays fully visible; null when nothing is selected. */
  focus: Focus | null;
  hoveredEdge: string | null;
  /** Rate labels on every edge, not just the ones worth a look. */
  showRates: boolean;
};

export const ViewContext = createContext<View>({
  focus: null,
  hoveredEdge: null,
  showRates: false,
});

export const useView = () => use(ViewContext);

/**
 * The production chain of the selection: everything that supplies it, however
 * far upstream, and everything it feeds downstream. Each direction is followed
 * on its own, so a consumer's other suppliers stay faded. A selected edge
 * focuses just the two nodes it connects.
 */
export function focusOf(nodes: PlanNode[], edges: PlanEdge[]): Focus | null {
  const selected = nodes
    .filter((n) => n.selected && n.type !== "island")
    .map((n) => n.id);
  const focus: Focus = { nodes: new Set(selected), edges: new Set() };

  const follow = (downstream: boolean) => {
    const queue = [...selected];
    const seen = new Set(selected);
    while (queue.length > 0) {
      const id = queue.shift()!;
      for (const e of edges) {
        const [from, to] = downstream
          ? [e.source, e.target]
          : [e.target, e.source];
        if (from !== id) continue;
        focus.edges.add(e.id);
        focus.nodes.add(to);
        if (!seen.has(to)) {
          seen.add(to);
          queue.push(to);
        }
      }
    }
  };
  follow(true);
  follow(false);

  for (const e of edges.filter((e) => e.selected)) {
    focus.edges.add(e.id);
    focus.nodes.add(e.source);
    focus.nodes.add(e.target);
  }
  return focus.nodes.size > 0 ? focus : null;
}

export const statusText = {
  ok: "text-emerald-600 dark:text-emerald-400",
  low: "text-amber-600 dark:text-amber-400",
  none: "text-destructive",
  surplus: "text-sky-600 dark:text-sky-400",
} as const;

export const statusStroke = {
  ok: "var(--color-emerald-500)",
  low: "var(--color-amber-500)",
  none: "var(--color-red-500)",
} as const;
