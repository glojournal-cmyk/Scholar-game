# V0.3.4.5 Flat Asset Path Fix

## Root cause
GitHub browser upload flattened the Scholar asset folders into the repository root.

The deployed code expected paths such as:
- `assets/scholar/home/scholar_idle.png`
- `assets/scholar/outfits/outfit_school_uniform.png`
- `assets/scholar/reward-interactions/reward_interaction_ink_pot.png`

But the uploaded commits created root files such as:
- `scholar_idle.png`
- `outfit_school_uniform.png`
- `reward_interaction_ink_pot.png`

Therefore the browser correctly returned broken images for the nested paths.

## Fix
V0.3.4.5 changes only the runtime asset URLs to the existing root filenames.
No asset rename, reclassification, re-upload, academic logic change, state reset or mastery/XP change is required.

## Files to upload
- `index.html`
- `scholar-assets.js`
- `app.js`
- `sw.js`

Release/cache version: 0.3.4.5

QA: 13/13 PASS
