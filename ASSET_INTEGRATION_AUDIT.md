# Scholar's Garden V0.3.4.4 — Scholar Asset Integration Audit

## Integration source
`Scholar_Garden_Asset_Integration_Pack.zip` / `CODEX_INTEGRATION_HANDOFF.md`

The pack was used as already classified and mapped. No asset was renamed, reclassified or remapped by the user.

## Files changed / added

Functional code:
- `index.html`
- `scholar-assets.js` (pack helper integrated and extended with supplied pose maps)
- `scholar-assets.css`
- `scholar.js`
- `app.js`
- `subject-hub.js`
- `sw.js`

Assets/source metadata:
- all 52 original transparent PNGs under `assets/scholar/`
- source mapping/audit files under `assets/scholar/meta/`
- contact sheets under `assets/scholar/qa-contact-sheets/`

## Academic protection
The following remain byte-identical to V0.3.4.3:
- Growth/XP engine
- DailyPlan engine
- Latin/French/Biology Master Pack engines
- Latin Games V2
- question banks / answer banks / concept banks / runtime banks
- 2-day / 7-day review logic
- Mastery calculations

Existing learner-state keys are unchanged.

## Home state logic
For the base school-uniform appearance:
- default -> `scholar_idle.png`
- required daily work remaining -> `scholar_ready.png`
- due review -> `scholar_thinking.png`
- all required daily tasks complete -> `scholar_success.png`

A non-school equipped outfit takes visual precedence and renders its complete full-character outfit image.

Home art rerenders:
- on Home render
- on DailyPlan change
- on `lux:growth`
- after wardrobe equip
- naturally when returning Home from a session

## Wardrobe
All 10 supplied full-render outfits are integrated.

Exact unlock rules from `WARDROBE_MAPPING.json`:
- School Uniform — always
- Winter Scholar — 3 study days
- Summer Scholar — 7 study days
- Casual Study — 100 Scholar XP
- Library Scholar — 250 Scholar XP
- Latin Scholar — 250 Latin XP
- French Scholar — 250 French XP
- Scholar Reward Cardigan — 400 Scholar XP
- Achievement Outfit — 300 Latin + 300 French XP
- Prestige Scholar — 1,500 Scholar XP

`starter` is treated/migrated to `school-uniform` without clearing any progress.
No fake hair/accessory controls are exposed.

## Rewards
Exact visual mappings used:
- Ink Pot -> `reward_interaction_ink_pot.png`
- Study Books -> `reward_interaction_book_stack.png`
- Ivy Pot -> `reward_interaction_plant.png`

These are used only as character/reward interaction art, never as room furniture.

Unsupported standalone rewards remain deliberately unmapped:
desk lamp, bronze stylus, wax tablet, fountain pen, lavender vase, Scholar's Globe, Golden Lexicon.

## Pose mappings used now
- Latin Learn -> Latin textbook pose
- French Learn -> French notebook pose
- Biology Learn -> Biology book pose
- Chemistry/Physics Learn -> general ready-to-study pose
- Practice -> worksheet pose
- Due Review -> thoughtful pose
- Progress -> proud pose
- Play -> determined pose
- Home reward unlock -> reward-unlock Home pose

## Reserved for later
Preserved but not forced into random rotation:
- Master identity render
- alternate Ready pose
- welcome / unfinished / confident / resting / reading Home variants
- writing / flashcards / planner / pointing / book-stack study variants
- neutral / happy / excited / worried / sleepy / shy-pleased / curious emotion variants
- general ribbon / medal / laurel / letter / mastery / prestige / quill reward interactions

## Performance
- all original PNGs are preserved
- all 52 are NOT preloaded on Home
- only the default Home Scholar asset is in the core PWA precache
- wardrobe, subject poses and reward/detail art lazy-load on demand
- normal image requests remain runtime-cached by the existing service worker

## QA
Deterministic/integrity result: **54/54 PASS**

A local Chromium browser launch was attempted in this environment, but Chromium terminates before a usable navigation session because of the container browser/DBus environment. Therefore physical iPad/browser manual QA is **not claimed**.

This package is an integration candidate; remote GitHub `main` has not been pushed from this environment.
