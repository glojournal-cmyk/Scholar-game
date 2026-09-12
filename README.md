# Lux et Labor — The Scholar's Garden

## RF10.7.1 Reference-Aligned Rebuild Hotfix

Targeted correction to RF10.7 based on the uploaded GitHub Playwright failure artifacts.

### Fixed
1. `topic-search-index.json` now reports the same build as the deployed app (`RF10.7.1`).
2. The Home Tiffin Scholar image now has explicit width + height + display/visibility/opacity rules,
   preventing the image box from collapsing in headless Chromium.
3. Service-worker/cache/version markers are bumped to RF10.7.1.
4. Browser QA now verifies the Scholar image is visible, has a real bounding box, has loaded
   intrinsic image dimensions, and has visible computed CSS.

The RF10.7 reference-aligned visual direction, Revision Finder, audio, Year 9 Latin Bridge,
routing, mastery, XP, review scheduling and protected academic engines are preserved.
