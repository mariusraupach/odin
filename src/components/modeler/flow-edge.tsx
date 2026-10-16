"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { goodName } from "@/lib/anno";
import { formatRate, handleGood, rateStatus } from "@/lib/anno/calc";
import { cn } from "@/lib/utils";
import { statusStroke, statusText, useFlow } from "./flow-context";

export function FlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  targetHandleId,
  selected,
}: EdgeProps) {
  const flow = useFlow().edges.get(id) ?? { rate: 0, requested: 0 };
  const status = rateStatus(flow.rate, flow.requested);
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        style={{ stroke: statusStroke[status], strokeWidth: selected ? 3 : 2 }}
      />
      <EdgeLabelRenderer>
        <div
          className={cn(
            "nodrag nopan bg-background pointer-events-auto absolute rounded-md border px-1.5 py-0.5 text-[10px] tabular-nums shadow-sm",
            statusText[status],
          )}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
          title={goodName(handleGood(targetHandleId))}
        >
          {formatRate(flow.rate)} t/min
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
