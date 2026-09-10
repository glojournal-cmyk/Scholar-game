# Codex implementation contract

## Non-negotiable content behaviour

1. Preserve every **conceptId**; variants of one concept share one mastery record.
2. Render **task.label**, **task.instruction** and **task.answerFormat** visibly.
3. Use the answer mode declared on each item. Never route all questions through one exact-string function.
4. Start ordinary sessions with two accessible recognition items, then shift towards production/application according to learner state.
5. Do not immediately repeat an identical missed card. Show teaching feedback and return to the concept later in a different format.
6. Complete due 2-day and 7-day reviews before optional new preview vocabulary.
7. Do not count recognition-only success as secure mastery.
8. Do not deduct missing French accents, but display accent corrections.
9. Extended French writing and Biology long answers require criterion or mark-point review with a safe manual-review fallback.
10. Biology diagram questions must use IDs in **biology/diagram-specs.json**; do not bake labels into learner images.
11. Respect release status: ordinary play uses **enabled** only; **preview** is opt-in; **disabled** is never auto-selected.
12. Do not put all three pretty-printed banks in the initial bundle. Split by topic or lazy-load the selected subject; French is the largest bank.

## Offline/PWA note

Question and note JSON should be cached as static assets. Prefer topic shards; at minimum, load the selected subject bank on demand rather than parsing all three banks on first paint. Keep Biology artwork outside the initial bundle and lazy-load it only when the relevant question appears. This V1 contains diagram specifications, not heavy learner-facing raster images.
