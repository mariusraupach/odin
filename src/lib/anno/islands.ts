import type { XYPosition } from "@xyflow/react";
import type { IslandNode, IslandNodeData, PlanNode } from "./calc";

/*
 * Islands are React Flow parent nodes. Buildings and residences on an island
 * carry its id as `parentId` and a position relative to it; islands are never
 * nested. React Flow needs parents listed before their children.
 */

export const ISLAND_HEADER = 72;
export const ISLAND_PADDING = 32;
// Wide enough for the header: name plus workforce and trade chips.
export const ISLAND_MIN = { width: 460, height: 240 };

const ISLAND_COLORS = [
  "oklch(0.68 0.13 235)", // sea blue
  "oklch(0.7 0.15 150)", // green
  "oklch(0.75 0.14 75)", // amber
  "oklch(0.66 0.17 25)", // red
  "oklch(0.66 0.15 300)", // purple
  "oklch(0.72 0.12 190)", // teal
];

const DEFAULT_SIZE = { width: 256, height: 180 };

export const isIsland = (node: PlanNode): node is IslandNode =>
  node.type === "island";

export function nodeSize(node: PlanNode) {
  return {
    width: node.measured?.width ?? node.width ?? DEFAULT_SIZE.width,
    height: node.measured?.height ?? node.height ?? DEFAULT_SIZE.height,
  };
}

export function absolutePosition(
  node: PlanNode,
  nodes: PlanNode[],
): XYPosition {
  const parent = node.parentId
    ? nodes.find((n) => n.id === node.parentId)
    : undefined;
  return parent
    ? {
        x: parent.position.x + node.position.x,
        y: parent.position.y + node.position.y,
      }
    : node.position;
}

/** The topmost island whose area contains the point. */
export function islandAt(point: XYPosition, nodes: PlanNode[]) {
  return nodes.findLast((n): n is IslandNode => {
    if (!isIsland(n)) return false;
    const { width, height } = nodeSize(n);
    return (
      point.x >= n.position.x &&
      point.x <= n.position.x + width &&
      point.y >= n.position.y &&
      point.y <= n.position.y + height
    );
  });
}

export function sortParentsFirst(nodes: PlanNode[]): PlanNode[] {
  return [...nodes.filter(isIsland), ...nodes.filter((n) => !isIsland(n))];
}

/** Position and parent for a node placed at an absolute point. */
export function placeAt(point: XYPosition, nodes: PlanNode[]) {
  const island = islandAt(point, nodes);
  return island
    ? {
        parentId: island.id,
        position: {
          x: point.x - island.position.x,
          y: point.y - island.position.y,
        },
      }
    : { parentId: undefined, position: point };
}

export function nextIslandData(nodes: PlanNode[]): IslandNodeData {
  const count = nodes.filter(isIsland).length;
  return {
    name: `Island ${count + 1}`,
    color: ISLAND_COLORS[count % ISLAND_COLORS.length],
  };
}

/**
 * After nodes were dragged, moves each into the island under its centre, or
 * out of its island when dropped outside.
 */
export function reparent(nodes: PlanNode[], ids: string[]): PlanNode[] {
  const moved = new Set(ids);
  const next = nodes.map((node) => {
    if (!moved.has(node.id) || isIsland(node)) return node;
    const absolute = absolutePosition(node, nodes);
    const { width, height } = nodeSize(node);
    const island = islandAt(
      { x: absolute.x + width / 2, y: absolute.y + height / 2 },
      nodes,
    );
    if (island?.id === node.parentId) return node;
    return {
      ...node,
      parentId: island?.id,
      position: island
        ? {
            x: absolute.x - island.position.x,
            y: absolute.y - island.position.y,
          }
        : absolute,
    } as PlanNode;
  });
  return sortParentsFirst(next);
}

/** Wraps the given nodes in a new island sized to fit them. */
export function groupIntoIsland(
  nodes: PlanNode[],
  ids: string[],
  islandId: string,
): PlanNode[] {
  const members = nodes.filter((n) => ids.includes(n.id) && !isIsland(n));
  if (members.length === 0) return nodes;
  const boxes = members.map((n) => ({
    ...absolutePosition(n, nodes),
    ...nodeSize(n),
  }));
  const left = Math.min(...boxes.map((b) => b.x)) - ISLAND_PADDING;
  const top = Math.min(...boxes.map((b) => b.y)) - ISLAND_HEADER;
  const right = Math.max(...boxes.map((b) => b.x + b.width)) + ISLAND_PADDING;
  const bottom = Math.max(...boxes.map((b) => b.y + b.height)) + ISLAND_PADDING;

  const island = newIsland(
    nodes,
    islandId,
    { x: left, y: top },
    {
      width: Math.max(ISLAND_MIN.width, right - left),
      height: Math.max(ISLAND_MIN.height, bottom - top),
    },
  );
  const next = nodes.map((node) => {
    if (!members.includes(node)) return node;
    const absolute = absolutePosition(node, nodes);
    return {
      ...node,
      parentId: islandId,
      position: { x: absolute.x - left, y: absolute.y - top },
      selected: false,
    } as PlanNode;
  });
  return sortParentsFirst([...next, { ...island, selected: true }]);
}

/** Takes nodes off their island, keeping them where they are. */
export function detach(nodes: PlanNode[], ids: string[]): PlanNode[] {
  return nodes.map((node) =>
    ids.includes(node.id) && node.parentId
      ? ({
          ...node,
          parentId: undefined,
          position: absolutePosition(node, nodes),
        } as PlanNode)
      : node,
  );
}

/** Removes an island but keeps its buildings where they are. */
export function ungroupIsland(nodes: PlanNode[], islandId: string): PlanNode[] {
  const members = nodes.filter((n) => n.parentId === islandId);
  return detach(
    nodes,
    members.map((n) => n.id),
  ).filter((n) => n.id !== islandId);
}

export function newIsland(
  nodes: PlanNode[],
  islandId: string,
  position: XYPosition,
  size = { width: 640, height: 420 },
): IslandNode {
  return {
    id: islandId,
    type: "island",
    position,
    ...size,
    dragHandle: ".island-drag-handle",
    // Box selection must pick the buildings on it, not the island; the
    // island is selected by clicking its header instead.
    selectable: false,
    data: nextIslandData(nodes),
  };
}
