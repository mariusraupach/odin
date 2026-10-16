"use client";

import type { NodeProps } from "@xyflow/react";
import { FactoryIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { buildingsById, workforceById } from "@/lib/anno";
import type { BuildingNode as BuildingNodeType } from "@/lib/anno/calc";
import { usePlanStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useFlow } from "../flow-context";
import { PortRow } from "./port-row";

export function BuildingNode({
  id,
  data,
  selected,
}: NodeProps<BuildingNodeType>) {
  const updateNodeData = usePlanStore((s) => s.updateNodeData);
  const flow = useFlow().nodes.get(id);
  const building = buildingsById.get(data.buildingId);
  if (!building || !flow) return null;

  const workforce = building.workforce;

  return (
    <Card
      size="sm"
      className={cn(
        "w-64 gap-2 overflow-visible py-2",
        selected && "ring-primary ring-2",
      )}
    >
      <CardHeader className="px-3">
        <CardTitle className="flex items-center gap-2">
          <FactoryIcon className="text-muted-foreground size-4" />
          <span className="truncate">{building.name}</span>
          {building.region === "new-world" && (
            <Badge variant="secondary" className="ml-auto">
              New World
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <div className="flex items-center gap-2 px-3 text-xs">
        <label className="flex items-center gap-1">
          <span className="text-muted-foreground">×</span>
          <Input
            type="number"
            min={0}
            value={data.count}
            onChange={(e) =>
              updateNodeData(id, {
                count: Math.max(0, e.target.valueAsNumber || 0),
              })
            }
            className="nodrag h-7 w-16 px-2 text-xs"
            aria-label="Building count"
          />
        </label>
        <label className="flex items-center gap-1">
          <Input
            type="number"
            min={0}
            step={25}
            value={data.productivity}
            onChange={(e) =>
              updateNodeData(id, {
                productivity: Math.max(0, e.target.valueAsNumber || 0),
              })
            }
            className="nodrag h-7 w-16 px-2 text-xs"
            aria-label="Productivity percent"
          />
          <span className="text-muted-foreground">%</span>
        </label>
        {flow.efficiency < 0.999 && (
          <Badge variant="destructive" className="ml-auto">
            {Math.round(flow.efficiency * 100)}% eff.
          </Badge>
        )}
      </div>

      <div className="flex flex-col">
        {flow.inputs.map((port) => (
          <PortRow key={port.good} port={port} side="in" />
        ))}
        {flow.outputs.map((port) => (
          <PortRow key={port.good} port={port} side="out" />
        ))}
      </div>

      {workforce && (
        <div className="text-muted-foreground border-t px-3 pt-2 text-xs">
          {workforce.count * data.count}{" "}
          {workforceById.get(workforce.type)?.name} workforce
        </div>
      )}
    </Card>
  );
}
