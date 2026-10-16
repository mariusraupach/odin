"use client";

import { useReactFlow } from "@xyflow/react";
import { FactoryIcon, HouseIcon } from "lucide-react";
import type { DragEvent } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  buildings,
  goodName,
  populationTiers,
  workforce,
  type Building,
} from "@/lib/anno";
import { usePlanStore } from "@/lib/store";

export const DRAG_TYPE = "application/anno-node";

export type PaletteItem =
  { type: "building"; id: string } | { type: "residence"; id: string };

export function paletteNode(item: PaletteItem) {
  return item.type === "building"
    ? {
        type: "building" as const,
        data: { buildingId: item.id, count: 1, productivity: 100 },
      }
    : { type: "residence" as const, data: { tierId: item.id, houses: 10 } };
}

const buildingGroups = workforce
  .map((wf) => ({
    workforce: wf,
    buildings: buildings.filter((b) => b.workforce?.type === wf.id),
  }))
  .filter((group) => group.buildings.length > 0);

export function Palette() {
  const addNode = usePlanStore((s) => s.addNode);
  const { screenToFlowPosition } = useReactFlow();

  const addAtCenter = (item: PaletteItem) => {
    const rect = document.querySelector(".react-flow")?.getBoundingClientRect();
    const position = rect
      ? screenToFlowPosition({
          x: rect.x + rect.width / 2,
          y: rect.y + rect.height / 2,
        })
      : { x: 0, y: 0 };
    addNode(paletteNode(item), position);
  };

  const dragProps = (item: PaletteItem) => ({
    draggable: true,
    onDragStart: (event: DragEvent) => {
      event.dataTransfer.setData(DRAG_TYPE, JSON.stringify(item));
      event.dataTransfer.effectAllowed = "move";
    },
  });

  return (
    <Command className="rounded-none! bg-transparent">
      <CommandInput placeholder="Search buildings or goods…" />
      <CommandList className="max-h-none flex-1">
        <CommandEmpty>Nothing found.</CommandEmpty>
        <CommandGroup heading="Residences">
          {populationTiers.map((tier) => (
            <CommandItem
              key={tier.id}
              value={`residence ${tier.name} ${tier.residenceName}`}
              onSelect={() => addAtCenter({ type: "residence", id: tier.id })}
              {...dragProps({ type: "residence", id: tier.id })}
            >
              <HouseIcon />
              {tier.name}
              <span className="text-muted-foreground ml-auto text-xs">
                {tier.residentsPerHouse}/house
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
        {buildingGroups.map((group) => (
          <CommandGroup
            key={group.workforce.id}
            heading={`${group.workforce.name} buildings`}
          >
            {group.buildings.map((building) => (
              <CommandItem
                key={building.id}
                value={`${building.name} ${building.id} ${outputNames(building)}`}
                onSelect={() =>
                  addAtCenter({ type: "building", id: building.id })
                }
                {...dragProps({ type: "building", id: building.id })}
              >
                <FactoryIcon />
                <span className="truncate">{building.name}</span>
                <span className="text-muted-foreground ml-auto truncate text-xs">
                  {outputNames(building)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
}

const outputNames = (building: Building) =>
  building.outputs.map((o) => goodName(o.good)).join(", ");
