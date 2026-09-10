# Alpha 5 Mockup Parity QA

## Scope
Presentation-only parity pass layered over V0.4.0 Alpha 4.1. Academic engines, mastery, XP, review scheduling, question banks and Garden progression were not rewritten.

## Implemented
- Global shell polish with production horizontal navigation and utility controls.
- Study Hub hero rebuilt around the supplied Study Hub art direction.
- Study subject grid promoted to a 3-column desktop card system with responsive collapse.
- Added Study dashboard blocks for overall progress, today's goals and recommended continuation.
- Subject shell upgraded to a large editorial hero with subject-specific artwork.
- Added four persistent subject action cards: Learn / Practise / Play / Progress.
- Lesson-note pages now receive a dedicated two-column lesson reader presentation and "Must Remember" rail.
- Practice question pages now receive a dedicated practice workspace and session-summary rail.
- Correct-answer feedback receives a stronger "Well done" treatment.
- Progress UI receives card/dashboard polish.
- Preserved the seven new wardrobe outfits from the previous integration pass.
- Added responsive layout rules for desktop, tablet and mobile.

## New files
- `v04-alpha5-parity.css`
- `alpha5-parity.js`
- `ALPHA5_MOCKUP_PARITY_QA.md`

## Static QA
- JavaScript syntax: 20/20 PASS
- Duplicate HTML IDs: PASS
- Missing local script/style/image refs from index.html: PASS
- Seven new outfit assets present: PASS

## Regression boundary
This pass intentionally does not change:
- Latin/French/Biology answer marking
- Mastery transitions
- XP award rules
- Due-review scheduling
- Question-bank data
- Garden XP thresholds
- Scholar unlock rules already present

## Remaining visual QA
Browser screenshot comparison is still required for exact pixel-level parity, especially Safari/iPad and narrow mobile widths.
