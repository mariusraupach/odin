"use client";

import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  SelectionMode,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeTypes,
  type NodeTypes,
  type OnConnectEnd,
} from "@xyflow/react";
import { NetworkIcon, TagIcon, WandSparklesIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { handleGood } from "@/lib/anno/calc";
import { isValidConnection, usePlanStore } from "@/lib/store";
import { CanvasContextMenu, type MenuTarget } from "./canvas-menu";
import { ConnectMenu, type ConnectMenuState } from "./connect-menu";
import { focusOf, ViewContext } from "./flow-context";
import { FlowEdge } from "./flow-edge";
import { BuildingNode } from "./nodes/building-node";
import { IslandNode } from "./nodes/island-node";
import { ResidenceNode } from "./nodes/residence-node";
import { DRAG_TYPE, Palette, paletteNode, type PaletteItem } from "./palette";

type AddMenuState = {
  screen: { x: number; y: number };
  flow: { x: number; y: number };
};

const ADD_MENU_WIDTH = 300;
const ADD_MENU_HEIGHT = 360;

const nodeTypes: NodeTypes = {
  building: BuildingNode,
  residence: ResidenceNode,
  island: IslandNode,
};
const edgeTypes: EdgeTypes = { flow: FlowEdge };

export function Canvas() {
  const nodes = usePlanStore((s) => s.nodes);
  const edges = usePlanStore((s) => s.edges);
  const onNodesChange = usePlanStore((s) => s.onNodesChange);
  const onEdgesChange = usePlanStore((s) => s.onEdgesChange);
  const onConnect = usePlanStore((s) => s.onConnect);
  const addNode = usePlanStore((s) => s.addNode);
  const arrange = usePlanStore((s) => s.arrange);
  const autoArrange = usePlanStore((s) => s.autoArrange);
  const setAutoArrange = usePlanStore((s) => s.setAutoArrange);
  const duplicateNodes = usePlanStore((s) => s.duplicateNodes);
  const selectAll = usePlanStore((s) => s.selectAll);
  const selectNodes = usePlanStore((s) => s.selectNodes);
  const addIsland = usePlanStore((s) => s.addIsland);
  const reparentNodes = usePlanStore((s) => s.reparentNodes);
  const showRates = usePlanStore((s) => s.showRates);
  const setShowRates = usePlanStore((s) => s.setShowRates);
  const { screenToFlowPosition, fitView } = useReactFlow();
  const { resolvedTheme } = useTheme();
  const container = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<ConnectMenuState | null>(null);
  const [menuTarget, setMenuTarget] = useState<MenuTarget | null>(null);
  const [addMenu, setAddMenu] = useState<AddMenuState | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  const focus = focusOf(nodes, edges);
  // Islands are only backdrops, so they never fade.
  const shownNodes = focus
    ? nodes.map((n) =>
        n.type === "island" || focus.nodes.has(n.id)
          ? n
          : { ...n, className: "dimmed" },
      )
    : nodes;

  const closeMenus = () => {
    setMenu(null);
    setAddMenu(null);
  };

  // Escape clears the selection, ⌘/Ctrl+A selects everything, ⌘/Ctrl+D
  // duplicates the selection.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, [contenteditable]")) return;
      if (event.key === "Escape") selectNodes([]);
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === "a") {
        event.preventDefault();
        selectAll();
      } else if (key === "d") {
        event.preventDefault();
        const ids = usePlanStore
          .getState()
          .nodes.filter((n) => n.selected)
          .map((n) => n.id);
        if (ids.length > 0) duplicateNodes(ids);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectAll, selectNodes, duplicateNodes]);

  const onPaneContextMenu = (event: { clientX: number; clientY: number }) => {
    const rect = container.current?.getBoundingClientRect();
    if (!rect) return;
    const { clientX, clientY } = event;
    const flow = screenToFlowPosition({ x: clientX, y: clientY });
    const screen = {
      x: Math.max(
        8,
        Math.min(clientX - rect.left, rect.width - ADD_MENU_WIDTH - 8),
      ),
      y: Math.max(
        8,
        Math.min(clientY - rect.top, rect.height - ADD_MENU_HEIGHT - 8),
      ),
    };
    closeMenus();
    setMenuTarget({
      kind: "pane",
      open: () => setAddMenu({ screen, flow }),
      newIsland: () => addIsland(flow),
    });
  };

  const arrangeAndFit = () => {
    arrange();
    // Wait a frame so React Flow has the new positions before fitting.
    requestAnimationFrame(() => fitView({ duration: 300, maxZoom: 1 }));
  };

  // In auto mode, re-sort whenever nodes or edges are added or removed, once
  // React Flow has measured every node so sizes are known.
  const structure = `${nodes.map((n) => n.id).join()}|${edges.map((e) => e.id).join()}`;
  const allMeasured = nodes.length > 0 && nodes.every((n) => n.measured?.width);
  useEffect(() => {
    if (!autoArrange || !allMeasured) return;
    arrange();
    requestAnimationFrame(() => fitView({ duration: 300, maxZoom: 1 }));
  }, [autoArrange, allMeasured, structure, arrange, fitView]);

  // Releasing a connection on empty canvas offers buildings to attach there.
  const onConnectEnd: OnConnectEnd = (event, state) => {
    if (state.isValid || state.toNode || !state.fromHandle?.id) return;
    const rect = container.current?.getBoundingClientRect();
    if (!rect) return;
    const { clientX, clientY } =
      "changedTouches" in event ? event.changedTouches[0] : event;
    setMenu({
      screen: { x: clientX - rect.left, y: clientY - rect.top },
      bounds: { width: rect.width, height: rect.height },
      flow: screenToFlowPosition({ x: clientX, y: clientY }),
      nodeId: state.fromHandle.nodeId,
      good: handleGood(state.fromHandle.id),
      side: state.fromHandle.type === "target" ? "in" : "out",
    });
  };

  const onDragOver = (event: DragEvent) => {
    if (!event.dataTransfer.types.includes(DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event: DragEvent) => {
    const raw = event.dataTransfer.getData(DRAG_TYPE);
    if (!raw) return;
    event.preventDefault();
    const item = JSON.parse(raw) as PaletteItem;
    addNode(
      paletteNode(item),
      screenToFlowPosition({ x: event.clientX, y: event.clientY }),
    );
  };

  return (
    <ViewContext value={{ focus, hoveredEdge, showRates }}>
      <div ref={container} className="absolute inset-0">
        <CanvasContextMenu target={menuTarget}>
          <ReactFlow
            nodes={shownNodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{ type: "flow" }}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onConnectStart={closeMenus}
            onConnectEnd={onConnectEnd}
            onPaneClick={closeMenus}
            onMoveStart={closeMenus}
            onPaneContextMenu={onPaneContextMenu}
            onNodeContextMenu={(_, node) => {
              closeMenus();
              const selected = nodes.filter((n) => n.selected).map((n) => n.id);
              if (node.selected && selected.length > 1) {
                setMenuTarget({ kind: "selection", ids: selected });
              } else if (node.type === "island") {
                setMenuTarget({ kind: "island", id: node.id });
              } else {
                // Right-clicking an unselected node selects just that node.
                selectNodes([node.id]);
                setMenuTarget({ kind: "node", id: node.id });
              }
            }}
            onNodeDragStop={(_, __, dragged) =>
              reparentNodes(dragged.map((n) => n.id))
            }
            onSelectionContextMenu={(_, selected) => {
              closeMenus();
              setMenuTarget({
                kind: "selection",
                ids: selected.map((n) => n.id),
              });
            }}
            onEdgeMouseEnter={(_, edge) => setHoveredEdge(edge.id)}
            onEdgeMouseLeave={() => setHoveredEdge(null)}
            onEdgeContextMenu={(_, edge) => {
              closeMenus();
              setMenuTarget({ kind: "edge", id: edge.id });
            }}
            selectionOnDrag
            selectionMode={SelectionMode.Partial}
            panOnDrag={[1]}
            panActivationKeyCode="Space"
            isValidConnection={(connection: Connection | Edge) =>
              isValidConnection(connection, edges)
            }
            onDragOver={onDragOver}
            onDrop={onDrop}
            colorMode={resolvedTheme === "dark" ? "dark" : "light"}
            snapToGrid
            snapGrid={[20, 20]}
            deleteKeyCode={["Backspace", "Delete"]}
            fitView
            fitViewOptions={{ maxZoom: 1 }}
            // Default is 0.5, too close to fit a large plan on screen.
            minZoom={0.1}
          >
            <Background gap={20} />
            <Controls />
            <MiniMap
              pannable
              zoomable
              nodeColor={(n) =>
                n.type === "island"
                  ? `color-mix(in oklch, ${(n.data as { color: string }).color} 35%, transparent)`
                  : "var(--muted-foreground)"
              }
            />
            <Panel
              position="top-left"
              className="text-muted-foreground pointer-events-none text-[11px]"
            >
              Drag to select · Space + drag or middle mouse to pan · Right-click
              for options · Esc to clear the selection
            </Panel>
            <Panel position="top-right" className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="bg-background"
                disabled={nodes.length === 0}
                onClick={arrangeAndFit}
              >
                <NetworkIcon /> Arrange
              </Button>
              <Toggle
                variant="outline"
                size="sm"
                className="bg-background"
                pressed={autoArrange}
                onPressedChange={setAutoArrange}
                aria-label="Arrange automatically"
                title="Re-arrange automatically when nodes or connections change"
              >
                <WandSparklesIcon /> Auto
              </Toggle>
              <Toggle
                variant="outline"
                size="sm"
                className="bg-background"
                pressed={showRates}
                onPressedChange={setShowRates}
                aria-label="Show all rates"
                title="Show the rate on every connection, not only on problems and the selection"
              >
                <TagIcon /> Rates
              </Toggle>
            </Panel>
          </ReactFlow>
        </CanvasContextMenu>
        {addMenu && (
          <div
            className="absolute z-10"
            style={{
              left: addMenu.screen.x,
              top: addMenu.screen.y,
              width: ADD_MENU_WIDTH,
              height: ADD_MENU_HEIGHT,
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setAddMenu(null);
            }}
          >
            <Palette
              autoFocus
              className="bg-popover ring-foreground/10 rounded-xl! shadow-lg ring-1"
              onPick={(item) => {
                addNode(paletteNode(item), addMenu.flow);
                setAddMenu(null);
              }}
            />
          </div>
        )}
        {menu && <ConnectMenu menu={menu} onClose={() => setMenu(null)} />}
      </div>
    </ViewContext>
  );
}
