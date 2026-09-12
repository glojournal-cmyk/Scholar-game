# Lux et Labor — The Scholar's Garden

## RF10.4 Automated Browser QA

This build adds real browser end-to-end testing with Playwright and GitHub Actions.

On every push or pull request GitHub automatically tests the core shell, the Tiffin master
asset, Year 9 Biology/Chemistry/Physics Learn routes, Year 8 Latin Learn, French Practise,
Biology Learn, disabled Year 9 subjects, and the French → Biology stale-state regression.

Failures retain a Playwright report plus screenshots, trace and video evidence.

Local run:
1. npm install
2. npx playwright install chromium
3. npm run test:e2e

Academic engines, mastery, XP, due-review logic, question banks and runtime packs are preserved.
