"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import { computeFlow } from "@/lib/anno/calc";
import { usePlanStore } from "@/lib/store";
import { Canvas } from "./canvas";
import { FlowContext } from "./flow-context";
import { Inspector } from "./inspector";
import { Palette } from "./palette";
import { Toolbar } from "./toolbar";

export default function Modeler() {
  const nodes = usePlanStore((s) => s.nodes);
  const edges = usePlanStore((s) => s.edges);
  const flow = useMemo(() => computeFlow(nodes, edges), [nodes, edges]);

  return (
    <ReactFlowProvider>
      <FlowContext value={flow}>
        <TooltipProvider>
          <div className="flex h-dvh flex-col">
            <Toolbar />
            <div className="flex min-h-0 flex-1">
              <aside className="flex w-72 shrink-0 flex-col border-r">
                <Palette />
              </aside>
              <main className="relative min-w-0 flex-1">
                <Canvas />
              </main>
              <aside className="w-80 shrink-0 border-l">
                <ScrollArea className="h-full">
                  <Inspector />
                </ScrollArea>
              </aside>
            </div>
          </div>
        </TooltipProvider>
      </FlowContext>
    </ReactFlowProvider>
  );
}
