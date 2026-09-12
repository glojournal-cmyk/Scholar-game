# Lux et Labor — The Scholar's Garden

## RF10.4.2 Resource Path Correction

This build fixes the French legacy-resource 404s caught by Playwright.

### Correction
- Adds root-local French compatibility resources so `french-module.js` resolves its first `./` path.
- Preloads `FrenchReferenceMarker` locally, preventing the bad `../French-Revision/` request.
- Compatibility question/vocabulary/note data is derived only from the existing canonical French runtime.
- No invented writing content is added; `writing-bank.json` remains a valid empty compatibility file.
- Smoke QA now prints exact failing HTTP URLs and fails on any 4xx/5xx response.

Generated compatibility inventory:
- 5585 French questions
- 255 unique source-backed vocabulary rows
- 32 topic notes

Academic engines and protected source files remain unchanged.
