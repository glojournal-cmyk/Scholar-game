# Scholar’s Garden — Character Asset Integration Handoff
## Pack version 1.0.0

This pack is already classified, renamed, mapped, and ready for repository integration.

The user should NOT be asked to rename, sort, classify, or map the artwork again.

## What is included

- 1 approved Master Scholar identity render
- 10 core Home poses
- 1 alternate Ready pose
- 10 study-action poses
- 10 emotion/status poses
- 10 reward-interaction poses
- 10 full-render outfit variants
- central JSON manifests
- `integration/scholar-assets.js`
- `integration/scholar-assets.css`
- contact sheets for visual QA

All 52 supplied PNGs were preserved.

## Important implementation constraint

The outfit images are FULL-CHARACTER RENDERS.
They are not isolated clothing layers.

Do NOT automatically cut them apart into hair/body/outfit layers.
For this release, treat each outfit as a complete appearance variant.

The existing layered placeholders may remain in the DOM for future assets, but the current approved artwork should render as one `<img>` above/in place of those placeholder layers.

---

# 1. HOME — integrate the Scholar character

Current repository integration point:

`#scholarArtSlot`

Current placeholder children include:
- `[data-home-avatar-layer="back-hair"]`
- `[data-home-avatar-layer="base-character"]`
- `[data-home-avatar-layer="outfit"]`
- etc.

For this release:

1. Keep `#scholarArtSlot` as the stable stage.
2. Insert one image element:
   `<img id="homeScholarImage" class="scholar-character-art" ...>`
3. Hide/remove the visible placeholder sigil and "Stable layered character slot" label when real art is available.
4. Use `window.ScholarAssets.homeAsset()` to determine the initial image.
5. Re-render the image:
   - on Home render
   - after DailyPlan changes
   - after `lux:growth`
   - after wardrobe equip
   - after returning from a completed session

### Home semantic mapping

Base school-uniform appearance:

- Normal/default → `scholar_idle.png`
- Active daily work remaining → `scholar_ready.png`
- Due Review present → `scholar_thinking.png`
- All required daily tasks completed → `scholar_success.png`

Optional reactions:
- reward unlock → `scholar_reward_unlock.png`
- progress/mastery → `scholar_confident.png`
- end of session → `scholar_resting.png`
- notes/learn → `scholar_reading_notes.png`

### Outfit precedence

Because non-school outfits do not have matching state poses:

- if equipped outfit = school uniform/base:
  use semantic Home poses.
- if a non-school full-render outfit is equipped:
  show that outfit render as the Home character.

This guarantees that Home always reflects the current equipped look.

Do NOT display "Prestige outfit equipped" while showing the school-uniform image.

---

# 2. SCHOLAR / WARDROBE — integrate all 10 outfits

Current repository integration points:

- `#avatarCanvas`
- `#wardrobeControls`
- `LuxGrowth.load().wardrobe.outfit`

Replace the current Starter-only outfit selector with the 10 supplied full-render outfits.

Use `WARDROBE_MAPPING.json` as the source of truth.

## Persisted IDs

- school-uniform
- winter-scholar
- summer-scholar
- casual-study
- library-scholar
- latin-scholar
- french-scholar
- reward-cardigan
- achievement
- prestige

Backward compatibility:

If existing state is:
`wardrobe.outfit === "starter"`

treat it as:
`school-uniform`

Do not wipe localStorage.

## Unlock rules

Use the exact unlock rules in `WARDROBE_MAPPING.json`.

They intentionally reuse existing Scholar Garden progress:
- study days
- Scholar XP
- Latin subject XP
- French subject XP

Do not create a second currency.

Locked items:
- show preview image with a tasteful locked state
- show exact unlock requirement
- do not allow equip

Unlocked items:
- allow one-click equip
- persist immediately
- update `#avatarCanvas`
- update Home immediately if visible
- update `#sceneLoadout`

Selected/equipped:
- show a clear selected indicator

## Avatar canvas

For the current artwork, render ONE full-character image inside `#avatarCanvas`.

Do not simultaneously render the old placeholder layers over it.

Keep the layered DOM structure only if needed for future compatibility, but hide it while full-render assets are active.

---

# 3. REWARDS — connect supplied reward interaction artwork

The supplied reward pack contains character + reward interaction renders.

It does NOT contain standalone furniture/object cutouts.

Use them for:
- reward unlock celebration
- reward detail view
- milestone feedback

Do NOT place the full-character reward-interaction image physically on a desk or inside Garden scenery.

Exact existing collectible mappings available:

- `ink-pot`
  → `reward_interaction_ink_pot.png`
- `study-books`
  → `reward_interaction_book_stack.png`
- `ivy-pot`
  → `reward_interaction_plant.png`

Current Home integration point:
`#nextRewardArt`

If the next reward has an exact mapped interaction image:
- use that image as a tasteful preview/detail visual.

If it does not:
- retain an elegant non-emoji placeholder.
- do not mislabel a quill as Bronze Stylus, etc.

General reaction images may be used for:
- medals
- mastery
- Latin milestone
- achievement letter
- prestige celebration

See `REWARD_MAPPING.json`.

### Missing standalone art

Standalone room-object art is still missing for:
- desk-lamp
- bronze-stylus
- wax-tablet
- fountain-pen
- lavender-vase
- scholars-globe
- golden-lexicon

Do not invent or scrape replacements.

---

# 4. USE THE REMAINING POSES SEMANTICALLY

Do NOT randomly rotate the character.

Use `POSE_USAGE_MAP.json`.

Suggested session mappings:

### Subject learn
- Latin → `study_latin_textbook.png`
- French → `study_french_notebook.png`
- Biology → `study_biology_book.png`

### Practice
- writing → `study_writing_notebook.png`
- vocab/review → `study_flashcards.png`
- worksheet/review → `study_worksheet.png`
- start session → `study_pen_and_book.png`

### Feedback
- first topic mastery → `emotion_proud.png`
- retention confirmed → `emotion_happy.png`
- extra training → `emotion_determined.png`
- new topic → `emotion_curious.png`
- due review → `emotion_thoughtful.png`
- end/rest → `emotion_sleepy.png`

### Reward/milestone
Use the reward-interaction artwork only when the semantic reward matches.

Do not use every pose merely because it exists.

---

# 5. LOAD/PERFORMANCE

The supplied PNGs are high-resolution and transparent.

Do not preload all 52 assets on Home.

Recommended:
- preload Home current asset
- optionally preload `ready`, `thinking`, `success`
- lazy-load outfits when Scholar/Wardrobe opens
- lazy-load study/emotion/reward reaction art on demand

Preserve transparent PNG originals.
If the repository later creates optimized WebP derivatives, keep the source PNGs and do not overwrite them.

---

# 6. CURRENT DOM / CODE HOOKS

The current live repository already has the correct structural hooks:

Home:
- `#scholarArtSlot`
- `#sceneLoadout`
- `#nextRewardArt`
- `#nextRewardName`
- `#nextRewardCopy`
- `#nextRewardBar`

Scholar:
- `#avatarCanvas`
- `#wardrobeControls`

Existing state:
- `LuxGrowth.load()`
- `LuxGrowth.snapshot()`
- `LuxGrowth.save()`
- `DailyPlan.status()`
- `lux:growth` event

Use these instead of creating a parallel state store.

---

# 7. SCRIPT/CSS INTEGRATION

Add:

`integration/scholar-assets.js`
`integration/scholar-assets.css`

Prefer moving/copying them to repository root or a normal `js/`/`css/` location if that matches project conventions.

Load `scholar-assets.js` AFTER:
- `growth.js`
- `daily-plan.js`

and BEFORE:
- `scholar.js`
- `app.js`

The helper is read-only except for resolving existing state.

Then update `scholar.js` and `app.js` to use it.

---

# 8. DO NOT BREAK LEARNING

Do NOT modify:

- Latin/French/Biology question banks
- conceptIds
- marking
- Mastery rules
- 2-day / 7-day review
- Due Review
- Extra Practice
- mini-games
- question renderers
- Learn tab routing
- existing learner progress
- XP calculation rules

This release is an art/wardrobe/reaction integration.

---

# 9. REQUIRED QA

Before deploy manually test:

HOME
- fresh learner → correct real Scholar art
- daily tasks remaining → Ready pose
- Due Review → Thinking pose
- all required tasks complete → Success pose
- real art does not block Quest buttons
- no placeholder `S` remains visible

WARDROBE
- all 10 outfits render
- locked conditions display correctly
- unlocked outfit equips
- selection persists after reload
- Home reflects equipped non-school outfit
- `starter` state migrates safely to school-uniform without deleting progress

REWARDS
- Ink Pot exact interaction art displays correctly
- Study Books exact interaction art displays correctly
- Ivy Pot exact interaction art displays correctly
- unsupported rewards do NOT receive incorrect artwork

REGRESSION
- Learn still opens
- Extra Practice still opens
- Mini-games still open
- XP still saves
- Mastery logic unchanged
- no console errors
- iPad/mobile layout keeps the character fully visible and buttons clickable

---

# 10. RELEASE

Bump cache/release version consistently in:
- `index.html`
- script/style query strings
- service worker cache
- footer version

Do not clear learner localStorage.

After implementation return a concise audit:
- files changed
- assets integrated
- Home state logic
- wardrobe unlock/equip logic
- reward mappings
- pose mappings used now
- unused assets reserved for later
- manual QA results
