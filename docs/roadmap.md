# Roadmap

Ideas for improving the Anno 1800 Modeler, roughly ordered by value for effort
within each section.

## Codebase

- [x] **Data generator and tests in the repo.** `npm run generate:data`
      rebuilds `src/lib/anno/data.ts` from the Anno1800Calculator game data.
      Vitest covers the flow calculation, islands, the store, undo/redo and
      the planner (`npm test`). Playwright covers the main flows in the
      browser (`npm run test:e2e`). GitHub Actions runs formatting, lint,
      types, unit tests, the build and the browser tests on every push.
- [ ] **Recalculate the flow only when it can change.** `computeFlow` runs on
      every node change, including every mouse move while dragging. It only
      needs to rerun when counts, productivity or connections change.
- [ ] **Migrations for saved plans.** The saved format has changed (islands,
      goods categories) and will again. zustand's `persist` has a `migrate`
      option that keeps old saves and JSON exports loading.
- [x] **Undo/redo.** ⌘Z / ⇧⌘Z (Ctrl+Z / Ctrl+Y) and toolbar buttons. A drag
      or a burst of typing is one step; selection is not recorded.

## Planner features

- [x] **Plan from a goal.** "Plan goal" builds the full, sized chain for a
      number of houses or a rate of a good, optionally on its own island
      (New World buildings on a second one).
- [ ] **"Add houses" for workforce gaps.** Like "Add suppliers", but adds
      residences to an island that is short on workers.
- [ ] **Productivity presets.** Electricity (+100%), items and trade union
      bonuses as toggles per node or island instead of typed percentages.
- [ ] **Merge duplicate nodes.** Combine several nodes of the same building on
      one island into one node with the total count.
- [ ] **Use existing production when planning a goal.** Connect spare output
      already on the canvas before adding new buildings.

## Islands and trade

- [ ] **Island fertility.** Crops only grow on islands with the matching
      fertility. Let islands list theirs and warn about farms that cannot be
      built there.
- [ ] **Ships per trade route.** Estimate how many ships a route needs from
      its t/min, ship capacity and travel time.
- [ ] **More regions.** New World, Arctic and Enbesa islands, so plans cover
      the real cross-region chains (coffee, rum, fur coats).

## Usability and sharing

- [ ] **Share a plan by link.** Compress the plan into the URL, no backend
      needed.
- [ ] **Several saved plans and starter templates** instead of one plan in
      localStorage.
- [ ] **Compact nodes when zoomed out.** Show only name, count and status so
      big plans stay readable.
- [ ] **Route harbour lines around nodes.** Lines from a harbour to a building
      currently cut straight across the island.
- [ ] **Keyboard shortcut overview**, for example on `?`.
