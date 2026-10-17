"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useInternalNode,
  type EdgeProps,
  type InternalNode,
  type XYPosition,
} from "@xyflow/react";
import { AnchorIcon, ShipIcon } from "lucide-react";
import { goodName } from "@/lib/anno";
import {
  formatRate,
  handleGood,
  rateStatus,
  type IslandNodeData,
  type TradeRoute,
} from "@/lib/anno/calc";
import { cn } from "@/lib/utils";
import { statusStroke, statusText, useFlow, useView } from "./flow-context";

const LANE_OFFSET = 10;

type Rect = { x: number; y: number; width: number; height: number };

const rectOf = (node: InternalNode): Rect => ({
  ...node.internals.positionAbsolute,
  width: node.measured.width ?? node.width ?? 0,
  height: node.measured.height ?? node.height ?? 0,
});

/**
 * The harbour: where the line between two islands' centres leaves `from`,
 * plus the unit direction towards `to`.
 */
function harbour(from: Rect, to: Rect) {
  const a = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const b = { x: to.x + to.width / 2, y: to.y + to.height / 2 };
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const t = Math.min(
    dx ? from.width / 2 / Math.abs(dx) : Infinity,
    dy ? from.height / 2 / Math.abs(dy) : Infinity,
  );
  return {
    point: { x: a.x + dx * t, y: a.y + dy * t },
    dir: { x: dx / length, y: dy / length },
  };
}

/** `point` moved `by` along the unit vector `dir`. */
const shift = (point: XYPosition, dir: XYPosition, by: number) => ({
  x: point.x + dir.x * by,
  y: point.y + dir.y * by,
});

const curve = (
  from: XYPosition,
  c1: XYPosition,
  c2: XYPosition,
  to: XYPosition,
) =>
  `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`;

export function FlowEdge({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  targetHandleId,
  selected,
}: EdgeProps) {
  const { edges, routeOfEdge } = useFlow();
  const { focus, hoveredEdge, showRates } = useView();
  const flow = edges.get(id) ?? { rate: 0, requested: 0 };
  const status = rateStatus(flow.rate, flow.requested);
  // Connected, but the consumer is already covered by other suppliers.
  const idle = flow.rate < 0.005 && flow.requested < 0.005;
  const focused = focus?.edges.has(id) ?? false;
  const dimmed = focus !== null && !focused;
  // Healthy edges stay quiet unless asked about.
  const showLabel =
    !dimmed &&
    (showRates || focused || hoveredEdge === id || (!idle && status !== "ok"));
  const style = {
    stroke: idle ? "var(--muted-foreground)" : statusStroke[status],
    strokeWidth: selected || focused ? 3 : 2,
    strokeDasharray: idle ? "6 4" : undefined,
    opacity: dimmed ? 0.1 : 1,
    transition: "opacity 150ms",
  };
  const title = (
    <title>
      {`${goodName(handleGood(targetHandleId))}: ${idle ? "not needed, covered by other suppliers" : `${formatRate(flow.rate)} t/min`}`}
    </title>
  );

  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const fromIsland = useInternalNode(sourceNode?.parentId ?? "");
  const toIsland = useInternalNode(targetNode?.parentId ?? "");
  const route = routeOfEdge.get(id);

  if (route && fromIsland && toIsland) {
    // Shipped between islands: producer -> harbour, trade route, harbour -> consumer.
    const out = harbour(rectOf(fromIsland), rectOf(toIsland));
    const into = harbour(rectOf(toIsland), rectOf(fromIsland));
    // Shift each direction to its own side so A->B and B->A run in parallel.
    const side = { x: -out.dir.y, y: out.dir.x };
    out.point = shift(out.point, side, LANE_OFFSET);
    into.point = shift(into.point, side, LANE_OFFSET);
    // Shorter curves on short legs, so they do not loop back on themselves.
    const pull = (a: XYPosition, b: XYPosition) =>
      Math.min(80, Math.hypot(a.x - b.x, a.y - b.y) / 2);
    const start = { x: sourceX, y: sourceY };
    const end = { x: targetX, y: targetY };
    const pullOut = pull(start, out.point);
    const pullIn = pull(into.point, end);
    const legs = [
      curve(
        start,
        { x: sourceX + pullOut, y: sourceY },
        shift(out.point, out.dir, -pullOut),
        out.point,
      ),
      curve(
        into.point,
        shift(into.point, into.dir, -pullIn),
        { x: targetX - pullIn, y: targetY },
        end,
      ),
    ].join(" ");
    return (
      <>
        {title}
        <BaseEdge id={id} path={legs} style={style} />
        {/* Every edge of a route shares the trunk; the first one draws it. */}
        {route.edgeIds[0] === id && (
          <TradeRouteTrunk
            route={route}
            dimmed={
              focus !== null && !route.edgeIds.some((e) => focus.edges.has(e))
            }
            from={out.point}
            to={into.point}
            labelBelow={side.y > 0}
            fromColor={(fromIsland.data as IslandNodeData).color}
            toColor={(toIsland.data as IslandNodeData).color}
          />
        )}
      </>
    );
  }

  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      {title}
      <BaseEdge id={id} path={path} style={style} />
      {showLabel && (
        <EdgeLabelRenderer>
          {/* No pointer events: hovering the label would un-hover the edge. */}
          <div
            className={cn(
              "bg-background pointer-events-none absolute rounded-md border px-1.5 py-0.5 text-[10px] tabular-nums shadow-sm",
              idle ? "text-muted-foreground" : statusText[status],
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {idle ? "idle" : `${formatRate(flow.rate)} t/min`}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

function TradeRouteTrunk({
  route,
  dimmed,
  from,
  to,
  fromColor,
  toColor,
  labelBelow,
}: {
  route: TradeRoute;
  dimmed: boolean;
  /** Label on the lane's own side: below for one direction, above for the other. */
  labelBelow: boolean;
  from: XYPosition;
  to: XYPosition;
  fromColor: string;
  toColor: string;
}) {
  const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  return (
    <>
      <path
        d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
        className="trade-route"
        fill="none"
        style={{ opacity: dimmed ? 0.15 : 1, transition: "opacity 150ms" }}
      />
      <EdgeLabelRenderer>
        {[
          { point: from, color: fromColor },
          { point: to, color: toColor },
        ].map(({ point, color }, i) => (
          <div
            key={i}
            className={cn(
              "bg-background absolute flex size-7 items-center justify-center rounded-full border-2 shadow-sm transition-opacity",
              dimmed && "opacity-25",
            )}
            style={{
              borderColor: color,
              transform: `translate(-50%, -50%) translate(${point.x}px, ${point.y}px)`,
            }}
            title="Harbour"
          >
            <AnchorIcon className="size-3.5" style={{ color }} />
          </div>
        ))}
        <div
          className={cn(
            "nodrag nopan bg-background pointer-events-auto absolute flex flex-col gap-0.5 rounded-lg border px-2.5 py-1.5 text-[11px] shadow-md transition-opacity",
            dimmed && "opacity-25",
          )}
          style={{
            // Sit above the lane rather than on it.
            transform: `translate(-50%, ${labelBelow ? "14px" : "calc(-100% - 14px)"}) translate(${mid.x}px, ${mid.y}px)`,
          }}
        >
          <span className="text-muted-foreground flex items-center gap-1 font-medium">
            <ShipIcon className="size-3.5" /> Trade route
          </span>
          {route.goods.map((g) => (
            <span
              key={g.good}
              className="flex justify-between gap-3 tabular-nums"
            >
              <span>{goodName(g.good)}</span>
              <span className="text-muted-foreground">
                {formatRate(g.rate)} t/min
              </span>
            </span>
          ))}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
