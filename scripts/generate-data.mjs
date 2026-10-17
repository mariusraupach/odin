// Regenerates src/lib/anno/data.ts from the Anno1800Calculator game data
// (github.com/NiHoel/Anno1800Calculator).
//
//   npm run generate:data              downloads the latest params.js
//   npm run generate:data -- params.js uses a local copy instead

import fs from "node:fs";
import { fileURLToPath } from "node:url";
import * as prettier from "prettier";

const SOURCE =
  "https://raw.githubusercontent.com/NiHoel/Anno1800Calculator/master/js/params.js";
const OUTPUT = fileURLToPath(
  new URL("../src/lib/anno/data.ts", import.meta.url),
);

const OLD_WORLD = 5000000;
const NEW_WORLD = 5000001;

// Farmers to Investors, with the workforce each provides.
const TIERS = {
  15000000: 1010052,
  15000001: 1010115,
  15000002: 1010116,
  15000003: 1010117,
  15000004: 1010128,
};

// Not real production buildings in the data.
const SKIPPED_FACTORIES = new Set([118571, 269840]);

// The game's own goods categories (warehouse and statistics filters), in
// chain order.
const CATEGORIES = [
  [502052, "raw"],
  [502040, "agricultural"],
  [502046, "intermediate"],
  [501957, "construction"],
  [502031, "consumer"],
];

async function loadParams(path) {
  const text = path
    ? fs.readFileSync(path, "utf8")
    : await fetch(SOURCE).then((res) => {
        if (!res.ok) throw new Error(`${SOURCE}: ${res.status}`);
        return res.text();
      });
  // The file assigns one big object literal to window.params.
  return JSON.parse(text.slice(text.indexOf("{")));
}

const params = await loadParams(process.argv[2]);
const english = (o) => o.locaText?.english ?? o.name;
const round = (x) => Math.round(x * 1e9) / 1e9;

const tiers = params.populationLevels
  .filter((level) => level.guid in TIERS)
  .map((level) => ({
    id: String(level.guid),
    name: english(level),
    residentsPerHouse: level.fullHouse,
    residenceName: english(
      params.residenceBuildings.find((r) => r.guid === level.residence),
    ),
    workforce: String(TIERS[level.guid]),
    needs: level.needs
      .filter((n) => n.tpmin != null && !n.isBonusNeed && !n.dlcs)
      .map((n) => ({
        good: String(n.guid),
        perResidentPerMinute: round(n.tpmin),
      })),
  }));

// Old World base game factories, plus the New World ones whose goods the Old
// World needs and cannot make itself.
const isBaseGame = (f) =>
  !f.dlcs && f.outputs?.length && !SKIPPED_FACTORIES.has(f.guid);
const inputsOf = (f) => (f.inputs ?? []).filter((i) => i.Amount != null);
const oldWorld = params.factories.filter(
  (f) => f.region === OLD_WORLD && isBaseGame(f),
);
const newWorld = params.factories.filter(
  (f) => f.region === NEW_WORLD && isBaseGame(f),
);

const needed = new Set(tiers.flatMap((t) => t.needs.map((n) => +n.good)));
for (const f of oldWorld) for (const i of inputsOf(f)) needed.add(i.Product);
const madeInOldWorld = new Set(oldWorld.map((f) => f.outputs[0].Product));

const factories = [...oldWorld];
for (let changed = true; changed;) {
  changed = false;
  for (const f of newWorld) {
    if (factories.includes(f)) continue;
    if (madeInOldWorld.has(f.outputs[0].Product)) continue;
    if (!f.outputs.some((o) => needed.has(o.Product))) continue;
    factories.push(f);
    for (const i of inputsOf(f)) needed.add(i.Product);
    changed = true;
  }
}

const workforceIds = new Set(params.workforce.map((w) => w.guid));
const buildings = factories.map((f) => {
  const primary = f.outputs[0];
  const workforce = f.maintenances.find((m) => workforceIds.has(m.Product));
  return {
    id: String(f.guid),
    name: english(f),
    region: f.region === OLD_WORLD ? "old-world" : "new-world",
    tpmin: round(f.tpmin),
    inputs: inputsOf(f).map((i) => ({
      good: String(i.Product),
      amount: i.Amount / primary.Amount,
    })),
    outputs: f.outputs.map((o) => ({
      good: String(o.Product),
      amount: o.Amount / primary.Amount,
    })),
    workforce: workforce
      ? { type: String(workforce.Product), count: workforce.Amount }
      : null,
  };
});

// Drop needs nothing here can produce.
const produced = new Set(
  buildings.flatMap((b) => b.outputs.map((o) => o.good)),
);
for (const tier of tiers)
  tier.needs = tier.needs.filter((n) => produced.has(n.good));

const usedGoods = new Set([
  ...buildings.flatMap((b) => [...b.inputs, ...b.outputs].map((x) => x.good)),
  ...tiers.flatMap((t) => t.needs.map((n) => n.good)),
]);
const filter = (guid) => params.productFilter.find((f) => f.guid === guid);
const categoryOf = (guid) => {
  const match = CATEGORIES.find(([id]) => filter(id).products.includes(guid));
  if (!match) throw new Error(`No category for good ${guid}`);
  return match[1];
};
const goods = params.products
  .filter((g) => usedGoods.has(String(g.guid)))
  .map((g) => ({
    id: String(g.guid),
    name: english(g),
    category: categoryOf(g.guid),
  }));

const usedWorkforce = new Set([
  ...buildings.map((b) => b.workforce?.type),
  ...tiers.map((t) => t.workforce),
]);
const workforce = params.workforce
  .filter((w) => usedWorkforce.has(String(w.guid)))
  .map((w) => ({
    id: String(w.guid),
    name: english(w).replace(/ Workforce$/, ""),
  }));

// Old World first, then by workforce tier, then by name.
const workforceRank = Object.fromEntries(workforce.map((w, i) => [w.id, i]));
buildings.sort(
  (a, b) =>
    b.region.localeCompare(a.region) ||
    workforceRank[a.workforce?.type] - workforceRank[b.workforce?.type] ||
    a.name.localeCompare(b.name),
);

const json = (value) => JSON.stringify(value, null, 2);
const source = `// Generated from the Anno1800Calculator game data (github.com/NiHoel/Anno1800Calculator).
// Old World base game, plus New World chains that Old World needs depend on.
import type { Building, Good, GoodCategory, PopulationTier, Workforce } from "./types";

export const goodCategories: GoodCategory[] = ${json(
  CATEGORIES.map(([guid, id]) => ({ id, name: english(filter(guid)) })),
)};

export const goods: Good[] = ${json(goods)};

export const workforce: Workforce[] = ${json(workforce)};

export const buildings: Building[] = ${json(buildings)};

export const populationTiers: PopulationTier[] = ${json(tiers)};
`;
const options = await prettier.resolveConfig(OUTPUT);
fs.writeFileSync(
  OUTPUT,
  await prettier.format(source, { ...options, filepath: OUTPUT }),
);
console.log(
  `Wrote ${goods.length} goods, ${buildings.length} buildings and ${tiers.length} tiers.`,
);
