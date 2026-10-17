"use client";

import { createContext, use } from "react";
import type { FlowResult } from "@/lib/anno/calc";

export const FlowContext = createContext<FlowResult | null>(null);

export function useFlow() {
  const flow = use(FlowContext);
  if (!flow) throw new Error("useFlow must be used inside <FlowContext>");
  return flow;
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
