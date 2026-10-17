"use client";

import { useReactFlow } from "@xyflow/react";
import { FactoryIcon, HouseIcon, SearchIcon, TreePalmIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { goodName, tiersById } from "@/lib/anno";
import {
  hasUnmetInputs,
  nodeTitle,
  type IslandNode,
  type PlanNode,
} from "@/lib/anno/calc";
import { usePlanStore } from "@/lib/store";
import { useFlow } from "./flow-context";

const GROUPS = [
  { type: "island", heading: "Islands", icon: TreePalmIcon },
  { type: "building", heading: "Buildings", icon: FactoryIcon },
  { type: "residence", heading: "Residences", icon: HouseIcon },
] as const;

/** ⌘K / Ctrl+K: find a node, then select it and zoom to it. */
export function NodeSearch() {
  const [open, setOpen] = useState(false);
  const nodes = usePlanStore((s) => s.nodes);
  const selectNodes = usePlanStore((s) => s.selectNodes);
  const flow = useFlow();
  const { fitView } = useReactFlow();
  const isMac = navigator.platform.toLowerCase().includes("mac");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const islandName = (node: PlanNode) =>
    nodes.find(
      (n): n is IslandNode => n.type === "island" && n.id === node.parentId,
    )?.data.name;

  // Searchable text: name, island and the goods a node makes or needs.
  const keywords = (node: PlanNode) =>
    [
      nodeTitle(node),
      islandName(node),
      ...(flow.nodes.get(node.id)?.inputs ?? []).map((p) => goodName(p.good)),
      ...(flow.nodes.get(node.id)?.outputs ?? []).map((p) => goodName(p.good)),
      node.type === "residence" &&
        tiersById.get(node.data.tierId)?.residenceName,
    ]
      .filter(Boolean)
      .join(" ");

  const detail = (node: PlanNode) => {
    if (node.type === "island") {
      const members = nodes.filter((n) => n.parentId === node.id).length;
      return `${members} node${members === 1 ? "" : "s"}`;
    }
    // Residence titles already say how many houses.
    return [node.type === "building" && `${node.data.count}×`, islandName(node)]
      .filter(Boolean)
      .join(" · ");
  };

  const pick = (id: string) => {
    setOpen(false);
    selectNodes([id]);
    // Wait for the dialog to close before moving the viewport.
    requestAnimationFrame(() =>
      fitView({ nodes: [{ id }], duration: 400, maxZoom: 1, padding: 0.4 }),
    );
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-muted-foreground ml-auto w-56 justify-start"
        onClick={() => setOpen(true)}
      >
        <SearchIcon /> Search nodes…
        <kbd className="bg-muted ml-auto rounded px-1.5 font-sans text-[11px]">
          {isMac ? "⌘K" : "Ctrl K"}
        </kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search nodes"
        description="Find a node on the canvas and zoom to it."
      >
        <Command>
          <CommandInput placeholder="Search by building, good or island…" />
          <CommandList>
            <CommandEmpty>
              {nodes.length === 0
                ? "The canvas is empty."
                : "No matching node."}
            </CommandEmpty>
            {GROUPS.map(({ type, heading, icon: Icon }) => {
              const matches = nodes.filter((n) => n.type === type);
              if (matches.length === 0) return null;
              return (
                <CommandGroup key={type} heading={heading}>
                  {matches.map((node) => {
                    const short = hasUnmetInputs(flow.nodes.get(node.id));
                    return (
                      <CommandItem
                        key={node.id}
                        value={`${keywords(node)} ${node.id}`}
                        onSelect={() => pick(node.id)}
                      >
                        <Icon
                          style={
                            node.type === "island"
                              ? { color: node.data.color }
                              : undefined
                          }
                        />
                        <span className="truncate">{nodeTitle(node)}</span>
                        {short && (
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            short
                          </span>
                        )}
                        <CommandShortcut className="tracking-normal tabular-nums">
                          {detail(node)}
                        </CommandShortcut>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
