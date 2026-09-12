# Asset QA / Classification Audit

Source archive: `ALL designs.zip`

Total supplied PNGs: **52**

Classification:
- Master identity: 1
- Home poses: 11 (10 primary + 1 alternate)
- Study actions: 10
- Emotions/status: 10
- Reward interactions: 10
- Outfit full renders: 10

Technical checks:
- All 52 files are RGBA PNGs.
- All 52 contain transparent pixels.
- Original pixels were preserved; no image was recompressed in the organised PNG folders.
- Original source filenames are recorded in `ASSET_MANIFEST.json`.

Integration decision:
- Outfit art is full-character artwork, therefore integration uses full-render appearance switching.
- Current full-render outfits should NOT be automatically sliced into body/hair/clothing layers.
- Home pose switching is used for the base school uniform.
- Equipped non-school outfits take visual precedence on Home until matching pose variants exist.

Reward limitation:
- Reward artwork is character-with-item interaction artwork.
- Only Ink Pot, Study Books and Ivy Pot have safe direct mappings to current collectible names.
- No false mapping is made for desk lamp, stylus, wax tablet, fountain pen, lavender vase, globe or golden lexicon.

No supplied asset was discarded.
