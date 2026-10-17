"use client";

import { PlugZapIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { goodCategories, goodName, goodsById, workforceById } from "@/lib/anno";
import {
  balanceStatus,
  formatRate,
  hasUnmetInputs,
  nodeTitle,
  rateStatus,
} from "@/lib/anno/calc";
import { describeSuppliers, usePlanStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { statusText, useFlow } from "./flow-context";

export function Inspector() {
  const flow = useFlow();
  const selectedCount = usePlanStore(
    (s) => s.nodes.filter((n) => n.selected).length,
  );
  const firstSelected = usePlanStore((s) => s.nodes.find((n) => n.selected));
  const removeNodes = usePlanStore((s) => s.removeNodes);
  const addSuppliers = usePlanStore((s) => s.addSuppliers);
  const node = selectedCount === 1 ? firstSelected : undefined;

  // Group by the game's goods categories; biggest deficits first in each.
  const goods = [...flow.goods].sort(
    (a, b) => a.produced - a.consumed - (b.produced - b.consumed),
  );
  const goodGroups = goodCategories
    .map((category) => ({
      category,
      goods: goods.filter(
        (g) => goodsById.get(g.good)?.category === category.id,
      ),
    }))
    .filter((group) => group.goods.length > 0);

  return (
    <div className="flex flex-col gap-4 p-4 text-sm">
      {node && (
        <section className="flex flex-col gap-2">
          <h2 className="font-medium">{nodeTitle(node)}</h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!hasUnmetInputs(flow.nodes.get(node.id))}
              onClick={() => {
                toast.success(describeSuppliers(addSuppliers(node.id)));
              }}
            >
              <PlugZapIcon /> Add suppliers
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => removeNodes([node.id])}
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
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
          {(
            [
              ["none", "Missing"],
              ["low", "Short"],
              ["ok", "Balanced"],
              ["surplus", "Surplus"],
            ] as const
          ).map(([status, label]) => (
            <span
              key={status}
              className={cn("flex items-center gap-1", statusText[status])}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {label}
            </span>
          ))}
        </div>
        {goods.length === 0 && (
          <p className="text-muted-foreground">
            Add buildings or residences to get started.
          </p>
        )}
        <table className="w-full text-xs tabular-nums">
          {goodGroups.map(({ category, goods }) => (
            <tbody key={category.id}>
              <tr>
                <th
                  colSpan={3}
                  className="text-muted-foreground pt-3 pb-1 text-left text-[11px] font-medium tracking-wide uppercase"
                >
                  {category.name}
                </th>
              </tr>
              {goods.map((g) => {
                const net = g.produced - g.consumed;
                const status = balanceStatus(g.produced, g.consumed);
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
                      {status === "ok"
                        ? "±0.00"
                        : `${net > 0 ? "+" : ""}${formatRate(net)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          ))}
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
