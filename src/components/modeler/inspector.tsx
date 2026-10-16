"use client";

import { PlugZapIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { buildingsById, goodName, tiersById, workforceById } from "@/lib/anno";
import { formatRate, rateStatus } from "@/lib/anno/calc";
import { usePlanStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { statusText, useFlow } from "./flow-context";

export function Inspector() {
  const flow = useFlow();
  const selectedCount = usePlanStore(
    (s) => s.nodes.filter((n) => n.selected).length,
  );
  const firstSelected = usePlanStore((s) => s.nodes.find((n) => n.selected));
  const removeNode = usePlanStore((s) => s.removeNode);
  const addSuppliers = usePlanStore((s) => s.addSuppliers);

  const node = selectedCount === 1 ? firstSelected : undefined;
  const nodeFlow = node ? flow.nodes.get(node.id) : undefined;
  const title = !node
    ? null
    : node.type === "building"
      ? buildingsById.get(node.data.buildingId)?.name
      : `${tiersById.get(node.data.tierId)?.name} (${node.data.houses} houses)`;
  const unmet =
    nodeFlow?.inputs.some((i) => i.nominal - i.actual > 1e-6) ?? false;

  const goods = [...flow.goods].sort(
    (a, b) => a.produced - a.consumed - (b.produced - b.consumed),
  );

  return (
    <div className="flex flex-col gap-4 p-4 text-sm">
      {node && (
        <section className="flex flex-col gap-2">
          <h2 className="font-medium">{title}</h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!unmet}
              onClick={() => {
                const added = addSuppliers(node.id);
                toast.success(
                  `Added ${added} supplier${added === 1 ? "" : "s"}`,
                );
              }}
            >
              <PlugZapIcon /> Add suppliers
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => removeNode(node.id)}
            >
              <Trash2Icon /> Delete
            </Button>
          </div>
          <p className="text-muted-foreground text-xs">
            “Add suppliers” places producers for every under-supplied input and
            connects them.
          </p>
          <Separator />
        </section>
      )}

      <section className="flex flex-col gap-1">
        <h2 className="font-medium">Goods balance</h2>
        <p className="text-muted-foreground text-xs">
          Whole plan, t/min, regardless of connections.
        </p>
        {goods.length === 0 && (
          <p className="text-muted-foreground">
            Add buildings or residences to get started.
          </p>
        )}
        <table className="w-full text-xs tabular-nums">
          <tbody>
            {goods.map((g) => {
              const net = g.produced - g.consumed;
              const status = rateStatus(g.produced, g.consumed);
              return (
                <tr key={g.good} className="border-b last:border-0">
                  <td className="py-1">{goodName(g.good)}</td>
                  <td className="text-muted-foreground py-1 text-right">
                    {formatRate(g.produced)} / {formatRate(g.consumed)}
                  </td>
                  <td
                    className={cn(
                      "py-1 pl-2 text-right font-medium",
                      statusText[status],
                    )}
                  >
                    {net >= 0 ? "+" : ""}
                    {formatRate(net)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <Separator />

      <section className="flex flex-col gap-1">
        <h2 className="font-medium">Workforce</h2>
        <table className="w-full text-xs tabular-nums">
          <tbody>
            {flow.workforce.map((w) => (
              <tr key={w.workforce} className="border-b last:border-0">
                <td className="py-1">{workforceById.get(w.workforce)?.name}</td>
                <td
                  className={cn(
                    "py-1 text-right",
                    statusText[rateStatus(w.provided, w.required)],
                  )}
                >
                  {w.provided.toLocaleString()} / {w.required.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
