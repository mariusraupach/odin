"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import { useTheme } from "next-themes";
import type { DragEvent } from "react";
import { isValidConnection, usePlanStore } from "@/lib/store";
import { FlowEdge } from "./flow-edge";
import { BuildingNode } from "./nodes/building-node";
import { ResidenceNode } from "./nodes/residence-node";
import { DRAG_TYPE, paletteNode, type PaletteItem } from "./palette";

const nodeTypes: NodeTypes = {
  building: BuildingNode,
  residence: ResidenceNode,
};
const edgeTypes: EdgeTypes = { flow: FlowEdge };

export function Canvas() {
  const nodes = usePlanStore((s) => s.nodes);
  const edges = usePlanStore((s) => s.edges);
  const onNodesChange = usePlanStore((s) => s.onNodesChange);
  const onEdgesChange = usePlanStore((s) => s.onEdgesChange);
  const onConnect = usePlanStore((s) => s.onConnect);
  const addNode = usePlanStore((s) => s.addNode);
  const { screenToFlowPosition } = useReactFlow();
  const { resolvedTheme } = useTheme();

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
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={{ type: "flow" }}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
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
    >
      <Background gap={20} />
      <Controls />
      <MiniMap pannable zoomable />
    </ReactFlow>
  );
}
