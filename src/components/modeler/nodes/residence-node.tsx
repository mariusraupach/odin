"use client";

import type { NodeProps } from "@xyflow/react";
import { HouseIcon } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { tiersById, workforceById } from "@/lib/anno";
import type { ResidenceNode as ResidenceNodeType } from "@/lib/anno/calc";
import { usePlanStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useFlow } from "../flow-context";
import { PortRow } from "./port-row";

export function ResidenceNode({
  id,
  data,
  selected,
}: NodeProps<ResidenceNodeType>) {
  const updateNodeData = usePlanStore((s) => s.updateNodeData);
  const flow = useFlow().nodes.get(id);
  const tier = tiersById.get(data.tierId);
  if (!tier || !flow) return null;

  const residents = data.houses * tier.residentsPerHouse;

  return (
    <Card
      size="sm"
      className={cn(
        "bg-secondary w-64 gap-2 overflow-visible py-2",
        selected && "ring-primary ring-2",
      )}
    >
      <CardHeader className="px-3">
        <CardTitle className="flex items-center gap-2">
          <HouseIcon className="text-muted-foreground size-4" />
          <span className="truncate">{tier.name}</span>
        </CardTitle>
      </CardHeader>

      <div className="flex items-center gap-2 px-3 text-xs">
        <Input
          type="number"
          min={0}
          value={data.houses}
          onChange={(e) =>
            updateNodeData(id, {
              houses: Math.max(0, e.target.valueAsNumber || 0),
            })
          }
          className="nodrag h-7 w-16 px-2 text-xs"
          aria-label="Number of residences"
        />
        <span className="text-muted-foreground">
          houses · {residents.toLocaleString()} residents
        </span>
      </div>

      <div className="flex flex-col">
        {flow.inputs.map((port) => (
          <PortRow key={port.good} port={port} side="in" />
        ))}
      </div>

      <div className="text-muted-foreground border-t px-3 pt-2 text-xs">
        Provides {residents.toLocaleString()}{" "}
        {workforceById.get(tier.workforce)?.name} workforce
      </div>
    </Card>
  );
}
