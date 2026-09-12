# Lux et Labor — The Scholar's Garden

## RF10.6.2 Home Asset Path Correction

This is a targeted correction on top of RF10.6.1.

Playwright caught a deterministic 404 on the new Game Home background:
`./assets/rf8/raising_study_room_day.webp`

The packaged asset is actually:
`./assets/rf8/raising_study_day.webp`

RF10.6.2 corrects that path and preserves:
- Game-style Home
- restored WebAudio sound effects
- Sound ON by default / Background Music OFF by default
- Year 9 Latin Verified Bridge Review
- existing Playwright browser QA
- protected academic engines and question banks
