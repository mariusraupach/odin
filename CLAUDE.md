@AGENTS.md

# Anno 1800 Modeler

A production planner for Anno 1800 in the style of Satisfactory Modeler: a
node-graph canvas of production buildings, residences and islands, with live
balancing of goods and workforce. Client-only; plans live in localStorage
(key `anno-modeler:v1`) and can be exported/imported as JSON. No backend.

Scope: Old World base game, plus the New World chains Old World needs. See
`docs/roadmap.md` for done and open ideas.

## Commands

- `npm run dev`: dev server on :3000 (runs inside an OrbStack devcontainer,
  also reachable at `node.odin-devcontainer.orb.local`, which is why
  `allowedDevOrigins` lists it)
- `npm test`: Vitest unit tests (`src/**/*.test.ts`)
- `npm run test:e2e`: Playwright browser tests (`e2e/`), starts its own dev
  server on :3100
- `npm run typecheck`: `next typegen && tsc --noEmit` (typegen is needed on a
  fresh checkout for `LayoutProps` and friends)
- `npm run lint`, `npx prettier --check .`
- `npm run generate:data [-- params.js]`: rebuilds `src/lib/anno/data.ts`
  from github.com/NiHoel/Anno1800Calculator; output is Prettier-formatted and
  must stay byte-identical when the source has not changed

CI (`.github/workflows/ci.yml`) runs all of the above on every push to main.

## Stack

Next 16 (App Router, `cacheComponents`, React Compiler), React 19,
Tailwind v4, shadcn `base-nova` style on Base UI (components in
`src/components/ui`, which import `cn` from the `cn` package; keep that),
@xyflow/react 12 for the canvas, zustand (+ `persist`, + zundo for undo),
@dagrejs/dagre for layout, cmdk, sonner, next-themes.

The modeler is rendered client-only: `page.tsx` → `modeler-loader.tsx`
(`next/dynamic` with `ssr: false`) → `modeler.tsx`.

## Architecture

Pure domain logic lives in `src/lib/anno/` (no React), UI in
`src/components/modeler/`, state in `src/lib/store.ts`.

- `data.ts`: generated, never edit by hand. `types.ts`, `index.ts`: lookup
  maps (`buildingsById`, `goodsById`, `tiersById`, ...) and queries
  (`producersOf`, `consumersOf`, `tiersNeeding`; Old World first).
- `unlocks.ts`: the data has no unlock info, so a building's unlock tier is
  derived from the first tier needing its good (directly or down the chain),
  with construction goods pinned by hand.
- `calc.ts`: node/edge types and `computeFlow(nodes, edges)`.
  - Node types: `building` (`buildingId`, `count`, `productivity` %),
    `residence` (`tierId`, `houses`), `island` (`name`, `color`).
  - Handles are `in:<goodId>` / `out:<goodId>`; a connection is valid only
    between the same good, output to input.
  - Flow allocation: fair proportional sharing, then augmenting paths
    (max-flow) so no satisfiable demand stays unmet; building efficiency is
    iterated until stable. `assumeFullInputs` plans as if upstream were
    fixed. An edge's `requested` = its flow plus its share of the
    consumer's shortfall.
  - The goods balance is plan-wide (goods can be shipped); workforce is per
    island (`flow.workforce` is a list of areas), since workers don't
    commute between islands.
  - Helpers: `hasUnmetInputs`, `spareOutput`, `nodesOfBuilding`,
    `balanceStatus` (tells ±0 apart from surplus), `buildingsFor`.
- `islands.ts`: islands are React Flow parent nodes. Members have
  `parentId` and positions relative to the island; islands are never
  nested, must come before their children (`sortParentsFirst`), have
  `selectable: false` and a `.island-drag-handle` header (so box selection
  inside an island picks buildings; the header click selects the island).
  Edges between nodes on two different islands form trade routes, bundled
  per island pair and drawn via harbours in `flow-edge.tsx`.
- `layout.ts`: `arrangeNodes` lays out each island's members inside it,
  resizes it, then lays out islands and loose nodes left to right.
- `planner.ts`: `planChain(goal)` sizes the full chain for N houses of a
  tier or X t/min of a good. Consumers are visited before producers, and
  each producer is sized for what its rounded-up consumers draw at full
  capacity, so everything runs at 100%. `chainToPlan` turns it into nodes,
  edges and islands (New World buildings on a second island).
- `store.ts`: all mutations (add/remove/duplicate, `addSuppliers`, islands,
  `planGoal`, arrange, import/export). Undo via zundo tracks only nodes and
  edges, ignores selection and measured sizes, and merges changes within
  400 ms into one step; history is cleared after hydration.

UI notes:

- `flow-context.tsx`: `FlowContext` (the computed flow) and `ViewContext`
  (focus, hovered edge, show-rates). Selecting a node focuses its whole
  chain (`focusOf`: upstream and downstream, each direction on its own);
  everything else gets the `dimmed` class.
- Edge rate labels show only for problems, focus or hover unless the
  "Rates" toggle is on.
- Shortcuts: ⌘K node search, ⌘A select all, ⌘D duplicate, ⌘Z / ⇧⌘Z undo
  and redo, Esc clear selection; ignored inside text fields.

## Conventions

- Match the surrounding code: small helpers over repetition, few
  single-use variables, comments only for the non-obvious "why".
- Run Prettier, lint, typecheck and `npm test` after changes; add or update
  tests with behaviour changes (fixtures in `src/test/plan.ts`,
  `e2e/fixtures.ts`).
- IDs come from `Date.now` + `Math.random`, not `crypto.randomUUID`, which
  is missing on plain-HTTP LAN origins.
- Base UI: a `ContextMenuLabel` must sit inside a `ContextMenuGroup`, or it
  throws.
- Commit messages: a single conventional-commit subject line of at most 50
  characters (`feat: ...`, `fix: ...`, `refactor: ...`), no body, no
  trailers.
