# V0.4.0 Alpha 5 RC4 — Implementation Report

Alpha 5 is at release-candidate stage. Presentation parity, outfit integration, runtime cleanup, PWA hardening and GitHub Pages readiness are integrated.

No answer marking, question banks, mastery transitions, XP award rules, review scheduling, Garden thresholds, game scoring or Scholar unlock logic was rewritten.

---

## Historical implementation report

# V0.4.0 Alpha 3 — Avatar/Garden Runtime + Scholar Profile

This pass continues coding while final image assets are still being produced.

## Implemented
- Added `avatar-layer-system.js`.
- Added `v04-art-config.js` as the single activation switch/mapping file for pending aligned art.
- Added `garden-growth.js`.
- Added `v04-alpha3.css`.
- Added Scholar Overview and Profile panes.
- Expanded Scholar routes to:
  - `#scholar/overview`
  - `#scholar/wardrobe`
  - `#scholar/collection`
  - `#scholar/achievements`
  - `#scholar/profile`
- `#profile` now safely maps to `#scholar/profile`.
- Home's Scholar entry now opens Scholar Overview rather than pretending the whole Scholar route is only Wardrobe.
- Profile display name is stored in existing UX-only state; formal learning state remains separate.

## Avatar runtime behaviour
The compositor supports:
back hair -> base body -> outfit -> front hair -> expression -> accessory -> hand item.

The exact runtime art canvas contract is 1536 x 2048. While final assets are unavailable:
- `ScholarAvatarLayerConfig.available === false`
- no pending layer file is requested
- the existing full-render Scholar art remains visible
- custom layer controls remain hidden

Once final aligned files are present, the activation config can expose only the physically present assets.

## Garden runtime behaviour
The optional plant stages are presentation-only and map directly to the existing `LuxGrowth.snapshot().gardenStage`.
No XP thresholds, unlock calculations, daily tasks or mastery rules were changed.

## PWA cache hardening
Alpha 3 uses one coherent `0.4.0-a3` query version in HTML and service-worker core resources.
The cache namespace is:
`scholars-garden-v0-4-0-alpha3-avatar-garden-runtime-20260907`

## Academic protection
Only these existing runtime files were changed from Alpha 2:
- `index.html`
- `app.js`
- `scholar.js`
- `sw.js`

All academic engines/content files remain byte-identical to Alpha 2.

