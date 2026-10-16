"use client";

import { Handle, Position } from "@xyflow/react";
import { goodName } from "@/lib/anno";
import {
  formatRate,
  inHandle,
  outHandle,
  rateStatus,
  type PortRate,
} from "@/lib/anno/calc";
import { cn } from "@/lib/utils";
import { statusText } from "../flow-context";

export function PortRow({
  port,
  side,
}: {
  port: PortRate;
  side: "in" | "out";
}) {
  const isInput = side === "in";
  // Inputs: how much arrives. Outputs: how much is produced given the inputs.
  const status = rateStatus(port.actual, port.nominal);

  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-3 px-3 py-1 text-xs",
        !isInput && "flex-row-reverse",
      )}
    >
      <Handle
        type={isInput ? "target" : "source"}
        position={isInput ? Position.Left : Position.Right}
        id={isInput ? inHandle(port.good) : outHandle(port.good)}
        className="border-background! bg-primary! size-2.5!"
      />
      <span className="truncate font-medium">{goodName(port.good)}</span>
      <span className={cn("shrink-0 tabular-nums", statusText[status])}>
        {formatRate(port.actual)}
        <span className="text-muted-foreground">
          {" "}
          / {formatRate(port.nominal)}
        </span>
      </span>
    </div>
  );
}
