"use client";

import type { NodeProps } from "@xyflow/react";
import { CopyIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { buildingsById, workforceById } from "@/lib/anno";
import {
  nodesOfBuilding,
  type BuildingNode as BuildingNodeType,
} from "@/lib/anno/calc";
import { usePlanStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useFlow } from "../flow-context";
import { CountBadge, StackLayers } from "./count-badge";
import { PortRow } from "./port-row";

export function BuildingNode({
  id,
  data,
  selected,
}: NodeProps<BuildingNodeType>) {
  const updateNodeData = usePlanStore((s) => s.updateNodeData);
  const selectNodes = usePlanStore((s) => s.selectNodes);
  // Ids of every node of this building type, joined so the selector is stable.
  const sameBuilding = usePlanStore((s) =>
    nodesOfBuilding(s.nodes, data.buildingId).join(),
  ).split(",");
  const flow = useFlow().nodes.get(id);
  const building = buildingsById.get(data.buildingId);
  if (!building || !flow) return null;

  return (
    <div className="relative">
      <StackLayers count={data.count} />
      <Card
        size="sm"
        className={cn(
          "relative w-64 gap-2 overflow-visible py-2",
          selected && "ring-primary ring-2",
        )}
      >
        <CardHeader className="px-3">
          <CardTitle className="flex items-center gap-2">
            <CountBadge count={data.count} />
            <span className="truncate">{building.name}</span>
            <span className="ml-auto flex items-center gap-1">
              {sameBuilding.length > 1 && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        className="nodrag flex h-5 items-center gap-1 rounded-md bg-amber-500/15 px-1.5 text-xs font-medium text-amber-700 dark:text-amber-300"
                        onClick={(event) => {
                          // Keep React Flow from re-selecting just this node.
                          event.stopPropagation();
                          selectNodes(sameBuilding);
                        }}
                      />
                    }
                  >
                    <CopyIcon className="size-3" />
                    {sameBuilding.length}
                  </TooltipTrigger>
                  <TooltipContent>
                    {sameBuilding.length} {building.name} nodes on the canvas.
                    Click to select them all.
                  </TooltipContent>
                </Tooltip>
              )}
              {building.region === "new-world" && (
                <Badge variant="secondary">New World</Badge>
              )}
            </span>
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

        {building.workforce && (
          <div className="text-muted-foreground border-t px-3 pt-2 text-xs">
            {building.workforce.count * data.count}{" "}
            {workforceById.get(building.workforce.type)?.name} workforce
          </div>
        )}
      </Card>
    </div>
  );
}
