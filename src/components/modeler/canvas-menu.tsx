"use client";

import { useReactFlow } from "@xyflow/react";
import {
  CopyIcon,
  LogOutIcon,
  MaximizeIcon,
  NetworkIcon,
  PlugZapIcon,
  PlusIcon,
  ScanIcon,
  SquareDashedMousePointerIcon,
  Trash2Icon,
  TreePalmIcon,
  UngroupIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { nodeTitle } from "@/lib/anno/calc";
import { describeSuppliers, usePlanStore } from "@/lib/store";
import { useFlow } from "./flow-context";

export type MenuTarget =
  | { kind: "pane"; open: () => void; newIsland: () => void }
  | { kind: "island"; id: string }
  | { kind: "node"; id: string }
  | { kind: "selection"; ids: string[] }
  | { kind: "edge"; id: string };

export function CanvasContextMenu({
  target,
  children,
}: {
  target: MenuTarget | null;
  children: ReactNode;
}) {
  const flow = useFlow();
  const nodes = usePlanStore((s) => s.nodes);
  const removeNodes = usePlanStore((s) => s.removeNodes);
  const duplicateNodes = usePlanStore((s) => s.duplicateNodes);
  const addSuppliers = usePlanStore((s) => s.addSuppliers);
  const selectAll = usePlanStore((s) => s.selectAll);
  const selectNodes = usePlanStore((s) => s.selectNodes);
  const groupIntoIsland = usePlanStore((s) => s.groupIntoIsland);
  const ungroupIsland = usePlanStore((s) => s.ungroupIsland);
  const removeFromIsland = usePlanStore((s) => s.removeFromIsland);
  const arrange = usePlanStore((s) => s.arrange);
  const onEdgesChange = usePlanStore((s) => s.onEdgesChange);
  const { fitView } = useReactFlow();

  // Without ids, fits the whole plan.
  const fit = (ids?: string[]) =>
    requestAnimationFrame(() =>
      fitView({
        duration: 300,
        maxZoom: 1,
        padding: 0.2,
        nodes: ids?.map((id) => ({ id })),
      }),
    );

  let content: ReactNode = null;
  if (target?.kind === "pane") {
    content = (
      <>
        <ContextMenuItem onClick={target.open}>
          <PlusIcon /> Add building here…
        </ContextMenuItem>
        <ContextMenuItem onClick={target.newIsland}>
          <TreePalmIcon /> New island here
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled={nodes.length === 0} onClick={selectAll}>
          <SquareDashedMousePointerIcon /> Select all
          <ContextMenuShortcut>⌘A</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={nodes.length === 0}
          onClick={() => {
            arrange();
            fit();
          }}
        >
          <NetworkIcon /> Arrange
        </ContextMenuItem>
        <ContextMenuItem disabled={nodes.length === 0} onClick={() => fit()}>
          <MaximizeIcon /> Fit view
        </ContextMenuItem>
      </>
    );
  } else if (target?.kind === "node") {
    const node = nodes.find((n) => n.id === target.id);
    const unmet =
      flow.nodes
        .get(target.id)
        ?.inputs.some((i) => i.nominal - i.actual > 1e-6) ?? false;
    const sameBuilding =
      node?.type === "building"
        ? nodes
            .filter(
              (n) =>
                n.type === "building" &&
                n.data.buildingId === node.data.buildingId,
            )
            .map((n) => n.id)
        : [];
    if (node) {
      content = (
        <>
          <ContextMenuGroup>
            <ContextMenuLabel className="truncate">
              {nodeTitle(node)}
            </ContextMenuLabel>
            <ContextMenuItem
              disabled={!unmet}
              onClick={() => {
                toast.success(describeSuppliers(addSuppliers(node.id)));
              }}
            >
              <PlugZapIcon /> Add suppliers
            </ContextMenuItem>
            <ContextMenuItem onClick={() => duplicateNodes([node.id])}>
              <CopyIcon /> Duplicate
              <ContextMenuShortcut>⌘D</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => fit([node.id])}>
              <ScanIcon /> Zoom to node
            </ContextMenuItem>
            {sameBuilding.length > 1 && (
              <ContextMenuItem onClick={() => selectNodes(sameBuilding)}>
                <SquareDashedMousePointerIcon /> Select all{" "}
                {sameBuilding.length} {nodeTitle(node)} nodes
              </ContextMenuItem>
            )}
            {node.parentId ? (
              <ContextMenuItem onClick={() => removeFromIsland([node.id])}>
                <LogOutIcon /> Remove from island
              </ContextMenuItem>
            ) : (
              <ContextMenuItem onClick={() => groupIntoIsland([node.id])}>
                <TreePalmIcon /> Put on new island
              </ContextMenuItem>
            )}
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuItem
            variant="destructive"
            onClick={() => removeNodes([node.id])}
          >
            <Trash2Icon /> Delete
            <ContextMenuShortcut>⌫</ContextMenuShortcut>
          </ContextMenuItem>
        </>
      );
    }
  } else if (target?.kind === "island") {
    const island = nodes.find((n) => n.id === target.id);
    const members = nodes
      .filter((n) => n.parentId === target.id)
      .map((n) => n.id);
    if (island) {
      content = (
        <>
          <ContextMenuGroup>
            <ContextMenuLabel className="truncate">
              {nodeTitle(island)}
            </ContextMenuLabel>
            <ContextMenuItem onClick={() => fit([island.id])}>
              <ScanIcon /> Zoom to island
            </ContextMenuItem>
            <ContextMenuItem
              disabled={members.length === 0}
              onClick={() => selectNodes(members)}
            >
              <SquareDashedMousePointerIcon /> Select its {members.length} nodes
            </ContextMenuItem>
            <ContextMenuItem onClick={() => ungroupIsland(island.id)}>
              <UngroupIcon /> Ungroup, keep buildings
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuItem
            variant="destructive"
            onClick={() => removeNodes([island.id])}
          >
            <Trash2Icon /> Delete island
            {members.length > 0 && ` and ${members.length} nodes`}
          </ContextMenuItem>
        </>
      );
    }
  } else if (target?.kind === "selection") {
    content = (
      <>
        <ContextMenuGroup>
          <ContextMenuLabel>
            {target.ids.length} nodes selected
          </ContextMenuLabel>
          <ContextMenuItem onClick={() => fit(target.ids)}>
            <ScanIcon /> Zoom to selection
          </ContextMenuItem>
          <ContextMenuItem onClick={() => groupIntoIsland(target.ids)}>
            <TreePalmIcon /> Group into island
          </ContextMenuItem>
          <ContextMenuItem onClick={() => duplicateNodes(target.ids)}>
            <CopyIcon /> Duplicate
            <ContextMenuShortcut>⌘D</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuItem
          variant="destructive"
          onClick={() => removeNodes(target.ids)}
        >
          <Trash2Icon /> Delete {target.ids.length} nodes
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </>
    );
  } else if (target?.kind === "edge") {
    content = (
      <ContextMenuItem
        variant="destructive"
        onClick={() => onEdgesChange([{ type: "remove", id: target.id }])}
      >
        <Trash2Icon /> Delete connection
        <ContextMenuShortcut>⌫</ContextMenuShortcut>
      </ContextMenuItem>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger className="absolute inset-0">
        {children}
      </ContextMenuTrigger>
      {content && (
        <ContextMenuContent className="w-56">{content}</ContextMenuContent>
      )}
    </ContextMenu>
  );
}
