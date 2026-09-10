# V0.4 Alpha 5 — Outfit Integration QA

## Scope
This pass integrates seven user-supplied transparent outfit previews into the existing Scholar wardrobe without changing academic engines, mastery, XP, review scheduling, question banks, or Garden progression.

## Added wardrobe assets
- Rose Academy Cardigan (`outfit_rose_academy.png`)
- Garden Athletics (`outfit_garden_athletics.png`)
- Scholar Athletics (`outfit_scholar_athletics.png`)
- Midnight Track (`outfit_midnight_track.png`)
- Noir Academy (`outfit_noir_academy.png`)
- Onyx Prefect (`outfit_onyx_prefect.png`)
- Midnight Atelier (`outfit_midnight_atelier.png`)

All seven are intentionally marked `always` unlocked for immediate visual QA. Their manifest entries include lightweight category metadata for future wardrobe filtering.

## Canvas normalization
The supplied 1086×1448 RGBA PNGs were normalized onto 1024×1536 transparent canvases, preserving aspect ratio and bottom alignment to match the existing wardrobe asset family.

## Runtime safety fix
The current aligned avatar compositor is still disabled (`ScholarAvatarLayerConfig.available === false`). Outfit PNGs are headless clothing/body previews, so using an equipped outfit as the Home or Scholar Overview fallback could display a headless figure. This pass keeps:
- Wardrobe preview/canvas: equipped outfit preview
- Home and Scholar Overview: complete Scholar character render
until the compositor is enabled with aligned back-hair/base/front-hair assets.

## Regression boundary
No changes were made to:
- Latin/French/Biology academic logic
- mastery calculations
- XP rules
- due-review scheduling
- Garden growth thresholds
- question banks

## Files changed
- `scholar-assets.js`
- `scholar.js`
- 7 new outfit PNG assets
- `ALPHA5_OUTFIT_INTEGRATION_QA.md`
