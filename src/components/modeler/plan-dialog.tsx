"use client";

import { useReactFlow } from "@xyflow/react";
import { TargetIcon, TriangleAlertIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  buildingsById,
  goodCategories,
  goodName,
  goods,
  populationTiers,
  producersOf,
  tiersById,
  workforceById,
} from "@/lib/anno";
import { goalName, planChain, type Goal } from "@/lib/anno/planner";
import { usePlanStore } from "@/lib/store";

const plannableGoods = goods.filter((g) => producersOf(g.id).length > 0);

/** Builds the whole production chain for a population or a good. */
export function PlanDialog() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Goal["kind"]>("residents");
  const [tierId, setTierId] = useState(populationTiers[0].id);
  const [houses, setHouses] = useState(50);
  const [good, setGood] = useState(plannableGoods[0].id);
  const [rate, setRate] = useState(4);
  const [ownIsland, setOwnIsland] = useState(true);
  const planGoal = usePlanStore((s) => s.planGoal);
  const { fitView } = useReactFlow();

  const goal: Goal =
    kind === "residents" ? { kind, tierId, houses } : { kind, good, rate };
  const chain = planChain(goal);
  const buildingCount = chain.buildings.reduce((sum, b) => sum + b.count, 0);
  const valid = kind === "residents" ? houses > 0 : rate > 0;

  const create = () => {
    const ids = planGoal(goal, { ownIsland });
    setOpen(false);
    toast.success(`Added ${buildingCount} buildings for ${describe(goal)}`);
    // New cards need a moment to be measured before the view can fit them.
    setTimeout(
      () =>
        fitView({
          nodes: ids.map((id) => ({ id })),
          duration: 500,
          maxZoom: 1,
          padding: 0.15,
        }),
      100,
    );
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <TargetIcon /> Plan goal
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Plan a production goal</DialogTitle>
            <DialogDescription>
              Adds every building the goal needs, sized so the whole chain runs
              at 100%.
            </DialogDescription>
          </DialogHeader>

          <ToggleGroup
            value={[kind]}
            onValueChange={(value) => {
              if (value[0]) setKind(value[0] as Goal["kind"]);
            }}
            variant="outline"
            size="sm"
            spacing={0}
            className="w-full"
          >
            <ToggleGroupItem value="residents" className="flex-1">
              Population
            </ToggleGroupItem>
            <ToggleGroupItem value="good" className="flex-1">
              Good
            </ToggleGroupItem>
          </ToggleGroup>

          {kind === "residents" ? (
            <div className="grid grid-cols-[1fr_7rem] gap-2">
              <Label className="flex-col items-start gap-1.5">
                Tier
                <Select
                  value={tierId}
                  onValueChange={(value) => value && setTierId(value)}
                  items={Object.fromEntries(
                    populationTiers.map((t) => [t.id, t.name]),
                  )}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {populationTiers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Label>
              <Label className="flex-col items-start gap-1.5">
                Houses
                <Input
                  type="number"
                  min={1}
                  value={houses}
                  onChange={(e) =>
                    setHouses(Math.max(0, e.target.valueAsNumber || 0))
                  }
                  aria-label="Houses"
                />
              </Label>
              <p className="text-muted-foreground col-span-2 text-xs">
                {(
                  houses * (tiersById.get(tierId)?.residentsPerHouse ?? 0)
                ).toLocaleString()}{" "}
                residents with all their needs met.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-[1fr_7rem] gap-2">
              <Label className="flex-col items-start gap-1.5">
                Good
                <Select
                  value={good}
                  onValueChange={(value) => value && setGood(value)}
                  items={Object.fromEntries(
                    plannableGoods.map((g) => [g.id, g.name]),
                  )}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {goodCategories.map((category) => (
                      <SelectGroup key={category.id}>
                        <SelectLabel>{category.name}</SelectLabel>
                        {plannableGoods
                          .filter((g) => g.category === category.id)
                          .map((g) => (
                            <SelectItem key={g.id} value={g.id}>
                              {g.name}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </Label>
              <Label className="flex-col items-start gap-1.5">
                t/min
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={rate}
                  onChange={(e) =>
                    setRate(Math.max(0, e.target.valueAsNumber || 0))
                  }
                  aria-label="Tons per minute"
                />
              </Label>
            </div>
          )}

          <Label className="justify-between font-normal">
            Put the chain on its own island
            <Switch checked={ownIsland} onCheckedChange={setOwnIsland} />
          </Label>

          {valid && (
            <section className="flex flex-col gap-2">
              <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {buildingCount} buildings
              </h3>
              <ul className="grid max-h-48 grid-cols-2 gap-x-4 gap-y-1 overflow-y-auto text-xs">
                {chain.buildings.map(({ buildingId, count }) => {
                  const building = buildingsById.get(buildingId)!;
                  return (
                    <li
                      key={buildingId}
                      className="flex items-center gap-1.5 tabular-nums"
                    >
                      <span className="font-semibold">{count}×</span>
                      <span className="truncate">{building.name}</span>
                      {building.region === "new-world" && (
                        <Badge
                          variant="secondary"
                          className="h-4 px-1 text-[10px]"
                        >
                          NW
                        </Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
              <p className="text-muted-foreground text-xs">
                Workforce needed:{" "}
                {chain.workforce
                  .map(
                    (w) =>
                      `${w.required.toLocaleString()} ${workforceById.get(w.workforce)?.name}`,
                  )
                  .join(", ")}
                . Add residences for it on the island.
              </p>
              {chain.unavailable.length > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                  <TriangleAlertIcon className="size-3.5 shrink-0" />
                  Nothing here produces{" "}
                  {chain.unavailable.map(goodName).join(", ")}.
                </p>
              )}
            </section>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!valid} onClick={create}>
              Add to canvas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const describe = (goal: Goal) =>
  goal.kind === "residents"
    ? `${goal.houses} houses of ${goalName(goal)}`
    : `${goal.rate} t/min of ${goalName(goal)}`;
