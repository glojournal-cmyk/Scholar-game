# V0.4.0 Visual Rebuild — Current Status

## Alpha 5 RC4

Remaining before production tag:
1. Real-browser screenshot acceptance.
2. iPadOS Safari responsive/PWA lifecycle check.
3. Narrow-mobile overflow/navigation check.
4. Confirm production GitHub Pages configuration.
5. Tag the accepted commit.

---

## Historical roadmap

# V0.4.0 Visual Rebuild — Implementation Status

## Alpha 1 completed
- Visual tokens, responsive shell, scene art, Study Hub visual rebuild, Year 9 / Year 8 selector.
- Subject-specific card/hero mapping without inventing unavailable academic routes.

## Alpha 2 completed
- UI micro-asset layer.
- PWA production icon set and identity assets.
- Today's Journey strip and additional Home/Study/Scholar presentation polish.

## Alpha 3 completed in code
- Scholar now has Overview / Wardrobe / Collection / Achievements / Profile.
- Scholar Overview reads real Growth state only: level, XP, study days, Garden stage and subject XP.
- Profile display name is stored only in existing UX state (`scholarGardenUxV03`); no mastery or XP data is touched.
- New avatar-layer compositor runtime and explicit asset contract.
- Layer runtime is dormant until aligned PNGs are physically integrated, so the current build makes no missing-image requests.
- Existing full-render Scholar assets remain the fallback.
- New optional Garden growth-stage art runtime reads the existing `gardenStage` only and does not change stage thresholds or XP rules.
- Garden stage art stays hidden until the four final plant PNGs are integrated.
- Service worker/cache identity is now coherent with Alpha 3; Alpha 2's stale Alpha 1 precache query mismatch is removed.

## Next implementation pass
1. Integrate the final aligned avatar PNGs and switch `ScholarAvatarLayerConfig.available` to true only after file/dimension QA.
2. Integrate four Garden growth PNGs and switch `ScholarGardenGrowthConfig.available` to true.
3. Map the final layer outfits into the existing Wardrobe unlock economy after visual alignment is verified.
4. Re-skin Latin GameV2 presentation without altering game rules.
5. Continue Study/Progress dashboard refinement around real mastery/due-review data.
6. Public regression QA after deployment.

## Safety boundary
Academic engines, banks, mastery/review rules and Growth/DailyPlan logic are unchanged from Alpha 2.

