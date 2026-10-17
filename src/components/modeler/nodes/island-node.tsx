"use client";

import { NodeResizer, type NodeProps } from "@xyflow/react";
import {
  FactoryIcon,
  GripVerticalIcon,
  ShipIcon,
  TreePalmIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { goodName, workforceById } from "@/lib/anno";
import {
  formatRate,
  rateStatus,
  type GoodRate,
  type IslandNode as IslandNodeType,
} from "@/lib/anno/calc";
import { ISLAND_HEADER, ISLAND_MIN } from "@/lib/anno/islands";
import { usePlanStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { statusText, useFlow } from "../flow-context";

const tint = (color: string, percent: number) =>
  `color-mix(in oklch, ${color} ${percent}%, transparent)`;

export function IslandNode({ id, data, selected }: NodeProps<IslandNodeType>) {
  const updateNodeData = usePlanStore((s) => s.updateNodeData);
  const selectNodes = usePlanStore((s) => s.selectNodes);
  const stats = useFlow().islands.get(id);

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={ISLAND_MIN.width}
        minHeight={ISLAND_MIN.height}
        color={data.color}
      />
      <div
        className="size-full rounded-3xl border-2"
        style={{
          borderColor: tint(data.color, selected ? 90 : 55),
          background: tint(data.color, 7),
        }}
      >
        {/* Only the header takes clicks, so box selection works inside. */}
        <div
          onClick={() => selectNodes([id])}
          className="island-drag-handle island-interactive flex cursor-grab items-center gap-3 rounded-t-[22px] px-4 active:cursor-grabbing"
          style={{
            height: ISLAND_HEADER - 16,
            background: tint(data.color, 16),
          }}
        >
          <GripVerticalIcon className="text-muted-foreground size-4 shrink-0" />
          <TreePalmIcon
            className="size-5 shrink-0"
            style={{ color: data.color }}
          />
          <input
            value={data.name}
            onChange={(e) => updateNodeData(id, { name: e.target.value })}
            className="nodrag field-sizing-content max-w-56 min-w-16 shrink-0 truncate bg-transparent text-lg font-semibold outline-none"
            aria-label="Island name"
          />
          {stats && (
            <div className="ml-auto flex shrink-0 items-center gap-1.5 text-xs">
              <Chip>
                <FactoryIcon className="size-3.5" />
                {stats.buildings}
              </Chip>
              {stats.workforce.map((w) => (
                <Chip
                  key={w.workforce}
                  className={statusText[rateStatus(w.provided, w.required)]}
                  title={`${workforceById.get(w.workforce)?.name} workforce on this island: provided / required`}
                >
                  {workforceById.get(w.workforce)?.name}{" "}
                  {w.provided.toLocaleString()}/{w.required.toLocaleString()}
                </Chip>
              ))}
              <TradeChip label="Exports" arrow="↑" goods={stats.exports} />
              <TradeChip label="Imports" arrow="↓" goods={stats.imports} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Chip({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "bg-background/80 flex h-6 items-center gap-1 rounded-md px-2 font-medium tabular-nums",
        className,
      )}
      {...props}
    />
  );
}

function TradeChip({
  label,
  arrow,
  goods,
}: {
  label: string;
  arrow: string;
  goods: GoodRate[];
}) {
  if (goods.length === 0) return null;
  return (
    <Tooltip>
      <TooltipTrigger render={<Chip className="nodrag" />}>
        <ShipIcon className="size-3.5" />
        {arrow} {goods.length}
      </TooltipTrigger>
      <TooltipContent className="flex-col items-start gap-0.5">
        <span className="font-medium">{label}</span>
        {goods.map((g) => (
          <span key={g.good} className="tabular-nums">
            {goodName(g.good)} · {formatRate(g.rate)} t/min
          </span>
        ))}
      </TooltipContent>
    </Tooltip>
  );
}
