# V0.4.0 Alpha 4 — Garden Growth Live + Asset Ingest

## Implemented
- Activated the supplied four-stage Garden plant artwork without changing XP or academic mastery rules.
- Added a live Stage 1–4 Garden growth timeline using the existing LuxGrowth thresholds: 0 / 400 / 1000 / 2200 Scholar XP.
- Added current Garden specimen artwork to the Garden hero and Scholar Overview.
- Added next-stage copy while keeping Stage 4 terminal/flourishing.
- Optimized the four transparent plant PNG sources to alpha WebP for web delivery.
- Ingested two newest headless outfit layers into `assets/avatar/pending/` for the next compositor alignment pass.
- Avatar layered compositor remains disabled until shared-canvas alignment is verified; full-render Scholar appearances remain the safe fallback.
- Updated cache-busting and service-worker cache version to Alpha 4.

## Protected
Academic/content engines and source banks were not modified:
- Latin engine/game/source
- French engine
- Biology Year 8 engine/content pack
- Year 9 science notes
- Daily planner
- Growth rules/state key

## QA scope
Deterministic static QA and source-hash checks only. No claim of physical iPad Safari or public GitHub Pages E2E testing.
