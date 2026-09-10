# Lux et Labor — Scholar's Garden
## V0.4.0 Alpha 5 Release Candidate 1 — Acceptance QA

### Scope
This RC consolidates the Alpha 5 mockup-parity work completed across:
- Global shell / Home
- Study Hub
- Subject landing
- Latin/French/Biology lesson and practice presentation
- Feedback / progress presentation
- Latin Games / GameV2 presentation
- Garden
- Scholar overview
- Wardrobe + seven added outfits
- Collection
- Achievements
- Profile & Settings
- Tablet/mobile presentation guards

### RC regression guards
- Added `v04-alpha5-rc.css` for overflow, focus, sticky-header and very-narrow-mobile guards.
- Added `alpha5-rc.js` for a non-invasive runtime shell audit and safe decorative image lazy loading.
- No academic state is written by the RC audit.

### Static acceptance results
- JavaScript syntax: **25/25 PASS**
- Duplicate static HTML IDs: **PASS**
- Required top-level screen IDs: **PASS**
- Missing local refs from `index.html`: **PASS**
- Alpha 5 presentation assets included exactly once: **PASS**
- Seven added outfit PNGs present: **PASS**
- Accidental `[local-build-path]/` or `[local-file-url]/` paths in app source: **PASS**

### Seven added outfits
1. Rose Academy Cardigan
2. Garden Athletics
3. Scholar Athletics
4. Midnight Track
5. Noir Academy
6. Onyx Prefect
7. Midnight Atelier

### Regression boundary
This cumulative Alpha 5 presentation pass intentionally does **not** rewrite:
- answer marking
- question banks
- mastery transitions
- XP award rules
- spaced-review scheduling
- Garden XP thresholds
- existing Scholar unlock rules

### Remaining release acceptance
Static acceptance is green. Exact pixel-level acceptance still requires real-browser screenshot comparison on the target devices, especially iPad Safari and narrow mobile Safari/Chrome.
