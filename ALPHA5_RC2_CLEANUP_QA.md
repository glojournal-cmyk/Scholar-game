# Alpha 5 RC2 Cleanup QA

Implemented:
- Removed hard-coded Garden XP rewards from presentation-only daily tasks.
- Removed hard-coded Study Hub progress/review numbers.
- Achievement lower panels now derive names from currently rendered earned/locked medal cards.
- Replaced Settings install placeholder with real `beforeinstallprompt` handling and browser fallback.
- Removed the placeholder Help Centre button.
- Consolidated five Alpha 5 presentation MutationObservers into one RC2 refresh observer.
- Updated service-worker cache namespace to Alpha 5 RC2.
- Added Alpha 5 CSS/JS presentation assets to service-worker precache.

Static QA:
- JavaScript syntax: 26/26 PASS
- Duplicate HTML IDs: PASS
- Missing local index refs: PASS
- Forbidden fake-state/placeholder strings: PASS
- Alpha 5 DOM MutationObservers: 1 total ({"alpha5-parity.js": 0, "alpha5-p1.js": 0, "alpha5-p2.js": 0, "alpha5-p3.js": 0, "alpha5-p4.js": 0, "alpha5-rc2.js": 1})
- Service worker RC2 version: PASS
- Missing Alpha5 SW precache entries: PASS

Regression boundary:
No answer marking, question-bank, mastery, XP award, spaced-review, Garden threshold, game-scoring or Scholar unlock logic was rewritten.
