# Lux et Labor — The Scholar's Garden

## RF10.7.3 Reference-Aligned Home Grid Fix

This build fixes the root cause identified by Browser QA #12.

### Root cause
The new RF10.7 Home uses `.rf107-home`, but the stylesheet still contained the legacy
ID-specific `#homeScreen` grid from the old Home. Because an ID selector outranks the newer
class selector, Chromium kept applying the old two-column / named-area layout.

That squeezed `.rf107-home-grid` into the old narrow track. The direct Tiffin character from
RF10.7.2 was visible, but `.rf107-scholar-panel` itself collapsed to a 2px border-width box.

### Correction
- `#homeScreen.rf107-home` now explicitly resets the legacy grid.
- The RF10.7 Home root is one full-width column.
- `.rf107-home-grid` gets the intended Scholar + journey two-column layout.
- Desktop Scholar panel has a real minimum width of 540px.
- Desktop journey stack has a real minimum width of 420px.
- Below 1180px the Home correctly collapses to one column.
- The successful RF10.7.2 direct Tiffin Scholar rendering is preserved.

Browser QA now also checks the Home root and Home grid widths before checking the Scholar panel.

Revision Finder, audio, Year 9 Latin Bridge, routing, mastery, XP, review scheduling and all
protected academic engines are unchanged.
