# Lux et Labor — The Scholar's Garden

## RF10.7.2 Reference-Aligned Rebuild Browser Fix

This build is a targeted response to Browser QA #11.

The previous Home character used the older layered-avatar stage plus percentage sizing.
Although the PNG loaded correctly, Chromium reported the image as hidden.

RF10.7.2 removes that dependency on Home:
- the Tiffin Scholar is now a direct image child of the visible Scholar panel;
- the image has concrete desktop dimensions (500 × 610 CSS px);
- responsive sizes are explicit for tablet/mobile;
- the legacy state anchor remains only so existing outfit/state code can continue to work;
- Browser QA records computed CSS, intrinsic PNG size, rendered box size and parent dimensions
  before asserting visibility.

All build markers and the topic-search index are synchronized to RF10.7.2.

Reference visual direction, Revision Finder, audio, Year 9 Latin Bridge and protected academic
engines remain unchanged.
