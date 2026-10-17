"use client";

import type { XYPosition } from "@xyflow/react";
import { FactoryIcon, HouseIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  consumersOf,
  goodName,
  producersOf,
  tiersNeeding,
  type Building,
} from "@/lib/anno";
import {
  buildingsFor,
  inHandle,
  outHandle,
  spareOutput,
} from "@/lib/anno/calc";
import { usePlanStore, type NewNode } from "@/lib/store";
import { useFlow } from "./flow-context";

export type ConnectMenuState = {
  /** Where to draw the menu, relative to the canvas container. */
  screen: XYPosition;
  /** Size of the canvas container, to keep the menu inside it. */
  bounds: { width: number; height: number };
  /** Where the new node goes, in flow coordinates. */
  flow: XYPosition;
  nodeId: string;
  good: string;
  /** Which side the drag started from: an input looks for producers. */
  side: "in" | "out";
};

const MENU_WIDTH = 288;
const MENU_HEIGHT = 340;
const NODE_WIDTH = 256;

type Option = { key: string; label: string; detail: string; node: NewNode };

const buildingOption = (building: Building, count: number): Option => ({
  key: building.id,
  label: building.name,
  detail: `×${count}${building.region === "new-world" ? " · New World" : ""}`,
  node: {
    type: "building",
    data: { buildingId: building.id, count, productivity: 100 },
  },
});

export function ConnectMenu({
  menu,
  onClose,
}: {
  menu: ConnectMenuState;
  onClose: () => void;
}) {
  const flow = useFlow();
  const addNode = usePlanStore((s) => s.addNode);
  const onConnect = usePlanStore((s) => s.onConnect);
  const edges = usePlanStore((s) => s.edges);

  const nodeFlow = flow.nodes.get(menu.nodeId);
  const options: { heading: string; items: Option[] }[] = [];

  if (menu.side === "in") {
    // Size producers to cover whatever this input is still missing.
    const port = nodeFlow?.inputs.find((p) => p.good === menu.good);
    const missing = port ? Math.max(0, port.nominal - port.actual) : 0;
    options.push({
      heading: `Produce ${goodName(menu.good)}`,
      items: producersOf(menu.good).map((b) =>
        buildingOption(b, missing > 0 ? buildingsFor(missing, b.id) : 1),
      ),
    });
  } else {
    // Size consumers to use up what this output has left over.
    const surplus = Math.max(
      0,
      spareOutput(flow, edges, menu.nodeId, menu.good),
    );

    options.push({
      heading: "Residences",
      items: tiersNeeding(menu.good).map((tier) => {
        const perHouse =
          tier.residentsPerHouse *
          (tier.needs.find((n) => n.good === menu.good)?.perResidentPerMinute ??
            0);
        const houses =
          surplus > 0 && perHouse > 0
            ? Math.max(1, Math.floor(surplus / perHouse))
            : 10;
        return {
          key: tier.id,
          label: tier.name,
          detail: `${houses} houses`,
          node: { type: "residence", data: { tierId: tier.id, houses } },
        };
      }),
    });
    options.push({
      heading: `Use ${goodName(menu.good)}`,
      items: consumersOf(menu.good).map((b) => {
        const perBuilding =
          b.tpmin * (b.inputs.find((i) => i.good === menu.good)?.amount ?? 0);
        return buildingOption(
          b,
          surplus > 0 && perBuilding > 0
            ? Math.max(1, Math.floor(surplus / perBuilding))
            : 1,
        );
      }),
    });
  }

  const pick = (option: Option) => {
    // Producers go left of the drop point so their output faces the input.
    const id = addNode(option.node, {
      x: menu.side === "in" ? menu.flow.x - NODE_WIDTH : menu.flow.x,
      y: menu.flow.y - 40,
    });
    const [source, target] =
      menu.side === "in" ? [id, menu.nodeId] : [menu.nodeId, id];
    onConnect({
      source,
      target,
      sourceHandle: outHandle(menu.good),
      targetHandle: inHandle(menu.good),
    });
    onClose();
  };

  // Keep the menu inside the canvas.
  const left = Math.max(
    8,
    Math.min(menu.screen.x, menu.bounds.width - MENU_WIDTH - 8),
  );
  const top = Math.max(
    8,
    Math.min(menu.screen.y, menu.bounds.height - MENU_HEIGHT - 8),
  );

  return (
    <div
      className="absolute z-10 shadow-lg"
      style={{ left, top, width: MENU_WIDTH }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Command
        className="ring-foreground/10 h-auto ring-1"
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <CommandInput
          autoFocus
          placeholder={`Search for ${goodName(menu.good)}…`}
        />
        <CommandList style={{ maxHeight: MENU_HEIGHT - 48 }}>
          <CommandEmpty>
            Nothing {menu.side === "in" ? "produces" : "uses"}{" "}
            {goodName(menu.good)}.
          </CommandEmpty>
          {options
            .filter((group) => group.items.length > 0)
            .map((group) => (
              <CommandGroup key={group.heading} heading={group.heading}>
                {group.items.map((option) => (
                  <CommandItem
                    key={option.key}
                    value={`${option.label} ${option.key}`}
                    onSelect={() => pick(option)}
                  >
                    {option.node.type === "residence" ? (
                      <HouseIcon />
                    ) : (
                      <FactoryIcon />
                    )}
                    <span className="flex-1 truncate">{option.label}</span>
                    <CommandShortcut className="tracking-normal tabular-nums">
                      {option.detail}
                    </CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
        </CommandList>
      </Command>
    </div>
  );
}
