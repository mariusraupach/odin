import { Graph, layout } from "@dagrejs/dagre";
import type { PlanEdge, PlanNode } from "./calc";
import {
  ISLAND_HEADER,
  ISLAND_MIN,
  ISLAND_PADDING,
  isIsland,
  nodeSize,
} from "./islands";

type Box = { id: string; width: number; height: number };

/** Left-to-right layered layout; returns top-left corners. */
function layered(
  boxes: Box[],
  links: [string, string][],
  spacing: { nodesep: number; ranksep: number },
) {
  const graph = new Graph();
  graph.setGraph({ rankdir: "LR", ...spacing });
  graph.setDefaultEdgeLabel(() => ({}));
  for (const box of boxes) graph.setNode(box.id, box);
  for (const [a, b] of links) if (a !== b) graph.setEdge(a, b);
  layout(graph);
  return new Map(
    boxes.map((box) => {
      const { x, y } = graph.node(box.id);
      return [box.id, { x: x - box.width / 2, y: y - box.height / 2 }];
    }),
  );
}

/**
 * Lays the plan out left to right: raw producers first, residences last.
 * Each island's buildings are arranged inside it and the island resized to
 * fit; then islands and loose nodes are arranged so supplying islands sit
 * left of the islands they ship to.
 */
export function arrangeNodes(nodes: PlanNode[], edges: PlanEdge[]): PlanNode[] {
  const islandSize = new Map<string, { width: number; height: number }>();
  const placed = new Map<string, { x: number; y: number }>();

  for (const island of nodes.filter(isIsland)) {
    const members = nodes.filter((n) => n.parentId === island.id);
    if (members.length === 0) {
      islandSize.set(island.id, nodeSize(island));
      continue;
    }
    const ids = new Set(members.map((n) => n.id));
    const inner = layered(
      members.map((n) => ({ id: n.id, ...nodeSize(n) })),
      edges
        .filter((e) => ids.has(e.source) && ids.has(e.target))
        .map((e) => [e.source, e.target]),
      { nodesep: 40, ranksep: 100 },
    );
    const left = Math.min(...members.map((n) => inner.get(n.id)!.x));
    const top = Math.min(...members.map((n) => inner.get(n.id)!.y));
    let right = 0;
    let bottom = 0;
    for (const n of members) {
      const p = inner.get(n.id)!;
      const position = {
        x: p.x - left + ISLAND_PADDING,
        y: p.y - top + ISLAND_HEADER,
      };
      placed.set(n.id, position);
      const size = nodeSize(n);
      right = Math.max(right, position.x + size.width);
      bottom = Math.max(bottom, position.y + size.height);
    }
    islandSize.set(island.id, {
      width: Math.max(ISLAND_MIN.width, right + ISLAND_PADDING),
      height: Math.max(ISLAND_MIN.height, bottom + ISLAND_PADDING),
    });
  }

  const topLevel = nodes.filter((n) => !n.parentId);
  const topOf = (id: string) => nodes.find((n) => n.id === id)?.parentId ?? id;
  const outer = layered(
    topLevel.map((n) => ({
      id: n.id,
      ...(islandSize.get(n.id) ?? nodeSize(n)),
    })),
    edges.map((e) => [topOf(e.source), topOf(e.target)]),
    // Wide gaps between islands leave room for the trade routes.
    { nodesep: 80, ranksep: islandSize.size > 0 ? 280 : 160 },
  );
  for (const n of topLevel) placed.set(n.id, outer.get(n.id)!);

  return nodes.map((node) => {
    const size = islandSize.get(node.id);
    return {
      ...node,
      position: placed.get(node.id) ?? node.position,
      ...(size && { width: size.width, height: size.height }),
    } as PlanNode;
  });
}
