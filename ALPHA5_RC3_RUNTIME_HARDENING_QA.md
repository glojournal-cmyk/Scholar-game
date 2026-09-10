# Alpha 5 RC3 — Runtime / PWA Hardening QA

Implemented:
- Hardened manifest start URL, scope, app id, theme/background colours and metadata.
- Added `offline.html`.
- Updated service-worker cache namespace to RC3.
- Added RC3 runtime and offline page to precache.
- Navigation fallback now tries exact cache, app shell, then offline page.
- Service worker accepts both legacy and object-form `SKIP_WAITING` messages.
- Added GitHub Pages `404.html` app-shell fallback for accidental deep paths.
- Added runtime service-worker registration/update checks.
- Added `ScholarGardenRuntime.activateUpdate()` and storage-health diagnostics.
- Kept hash routing; only empty hashes are normalised to `#home`.

Static QA:
- JavaScript syntax: 27/27 PASS
- Duplicate HTML IDs: PASS
- Missing local refs from index.html: PASS
- Manifest required fields: PASS
- Service worker checks: {"rc3_version": true, "offline_precached": true, "rc3_precached": true, "skip_waiting_message": true, "navigation_offline_fallback": true}
- Missing service-worker precache refs: PASS
- Alpha 5 MutationObservers: 1

Regression boundary:
No answer marking, question banks, mastery transitions, XP award rules, due-review scheduling, Garden thresholds, game scoring or Scholar unlock rules were rewritten.

Remaining:
Install/update/offline behaviour should still be acceptance-tested in real browsers because service-worker lifecycle handling differs between Chrome and Safari/iPadOS.
