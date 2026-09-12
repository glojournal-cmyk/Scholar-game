# Lux et Labor — The Scholar's Garden

## RF10.5 Visual Refinement

Built on the green RF10.4.2 functional/browser-QA baseline.

### Screenshot-led visual corrections
- Home hero is more compact and dashboard-like.
- Today’s Journey kicker spacing is corrected.
- Continue Learning cards are larger and less cramped.
- Footer is in document flow and cannot cover Quick Play/content.
- Study Hub hero is shorter.
- Study cards are denser with clearer status/action separation.
- Five-card Year 8 layout is balanced on desktop.
- Subject hero is shorter with less dead space.
- Learn/Practise topic cards show more content above the fold.
- Progress uses compact two-column mastery cards on desktop.
- French Play is presented as a featured game shelf.
- Mismatched secondary-character artwork is removed from French Play.

The Tiffin Scholar remains the default character. Academic engines, mastery, XP, due-review
logic, question banks and runtime packs are preserved. Existing Playwright regression tests remain
in the repository and run automatically in GitHub Actions.

### Year 9 Latin update
Year 9 Latin is no longer a dead card. It now opens a clearly labelled **Verified Bridge Review**
using the existing source-backed prior Latin bank. Learn, Practise, Play and Progress are available,
but the UI explicitly states that this bridge material is not being misrepresented as new Year 9
curriculum content. The protected Latin academic engine and question bank remain byte-identical.
