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
  CommandShortcut,
} from "@/components/ui/command";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  buildings,
  goodName,
  populationTiers,
  unlockTier,
  workforce,
  type Building,
} from "@/lib/anno";
import { usePlanStore, type PaletteGrouping } from "@/lib/store";

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

type BuildingGroup = { key: string; heading: string; buildings: Building[] };

const byName = (a: Building, b: Building) => a.name.localeCompare(b.name);
const tierIndex = (b: Building) => populationTiers.indexOf(unlockTier(b));

const buildingGroups: Record<PaletteGrouping, BuildingGroup[]> = {
  // The population tier a building unlocks with; New World chains last.
  tier: [
    ...populationTiers.map((tier) => ({
      key: tier.id,
      heading: tier.name,
      buildings: buildings
        .filter((b) => b.region === "old-world" && unlockTier(b) === tier)
        .sort(byName),
    })),
    {
      key: "new-world",
      heading: "New World",
      buildings: buildings
        .filter((b) => b.region === "new-world")
        .sort((a, b) => tierIndex(a) - tierIndex(b) || byName(a, b)),
    },
  ].filter((group) => group.buildings.length > 0),
  // The workforce that staffs a building.
  workforce: workforce
    .map((wf) => ({
      key: wf.id,
      heading: `${wf.name} workforce`,
      buildings: buildings.filter((b) => b.workforce?.type === wf.id),
    }))
    .filter((group) => group.buildings.length > 0),
};

export function Palette({
  onPick,
  className,
  autoFocus,
}: {
  /** Defaults to adding the node in the middle of the canvas. */
  onPick?: (item: PaletteItem) => void;
  className?: string;
  autoFocus?: boolean;
}) {
  const addNode = usePlanStore((s) => s.addNode);
  const grouping = usePlanStore((s) => s.paletteGrouping);
  const setGrouping = usePlanStore((s) => s.setPaletteGrouping);
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
  const pick = onPick ?? addAtCenter;

  const dragProps = (item: PaletteItem) => ({
    draggable: true,
    onDragStart: (event: DragEvent) => {
      event.dataTransfer.setData(DRAG_TYPE, JSON.stringify(item));
      event.dataTransfer.effectAllowed = "move";
    },
  });

  return (
    <Command className={className ?? "rounded-none! bg-transparent"}>
      <CommandInput
        autoFocus={autoFocus}
        placeholder="Search buildings or goods…"
      />
      <ToggleGroup
        value={[grouping]}
        onValueChange={(value) => {
          // Ignore clicks that would leave nothing pressed.
          if (value[0]) setGrouping(value[0] as PaletteGrouping);
        }}
        variant="outline"
        size="sm"
        spacing={0}
        className="mx-1 mt-2 w-[calc(100%-0.5rem)]"
      >
        <ToggleGroupItem value="tier" className="flex-1 text-xs">
          Unlock tier
        </ToggleGroupItem>
        <ToggleGroupItem value="workforce" className="flex-1 text-xs">
          Workforce
        </ToggleGroupItem>
      </ToggleGroup>
      <CommandList className="max-h-none flex-1">
        <CommandEmpty>Nothing found.</CommandEmpty>
        <CommandGroup heading="Residences">
          {populationTiers.map((tier) => (
            <CommandItem
              key={tier.id}
              value={`residence ${tier.name} ${tier.residenceName}`}
              onSelect={() => pick({ type: "residence", id: tier.id })}
              {...dragProps({ type: "residence", id: tier.id })}
            >
              <HouseIcon />
              <span className="flex-1 truncate">{tier.name}</span>
              <CommandShortcut className="tracking-normal tabular-nums">
                {tier.residentsPerHouse}/house
              </CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>
        {buildingGroups[grouping].map((group) => (
          <CommandGroup key={group.key} heading={group.heading}>
            {group.buildings.map((building) => (
              <CommandItem
                key={building.id}
                value={`${building.name} ${building.id} ${outputNames(building)}`}
                onSelect={() => pick({ type: "building", id: building.id })}
                {...dragProps({ type: "building", id: building.id })}
              >
                <FactoryIcon />
                <span className="flex-1 truncate">{building.name}</span>
                <CommandShortcut className="max-w-[45%] truncate text-right tracking-normal">
                  {outputNames(building)}
                </CommandShortcut>
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
