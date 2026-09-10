# Scholar's Garden V0.3.4.3 — Targeted Topic Learn Fix

## Exact root cause

The Training Hall topic buttons were not missing handlers.

They were calling `renderNote(...)` directly while the Subject Hub was still on the Practice tab.

So the click executed, but:
- `#genericPracticePane` stayed visible;
- `#genericLearnPane` stayed hidden;
- `renderNote(...)` wrote the correct teaching note into the hidden Learn pane.

The learner therefore saw no visible change.

## Fix

A new Subject Hub method owns the transition:

`SubjectHub.openTopicLearn(subject, topicId)`

It:

- keeps Subject Hub as source of truth for subject/track/tab;
- creates a distinct Learn history entry;
- awaits `renderTab('learn')`;
- makes Learn visible and Practice hidden;
- updates active Learn styling;
- awaits the selected Latin/French/Biology note renderer;
- scrolls the note into view.

Training Hall handlers now call this method for:

- `data-mcp-current-learn`
- `data-mcp-topic-learn`
- `data-bio-current-learn`
- `data-bio-topic-learn`

`MasterY8.renderNote` and `BiologyY8.renderNote` are exported only so Subject Hub can orchestrate the correct visible destination.

## Related robustness fixes

- `Practise this topic` now awaits the Subject Hub switch back to Practice before drawing a question.
- Topic practice uses the production-led Extra Practice path with safe fallback for topics that have no production-format item.
- Browser `popstate` now re-renders the route.
- `popstate` and `hashchange` route renders are de-duplicated to prevent double-render races.

## Release/cache

Release bumped to **V0.3.4.3** consistently in:
- index asset query strings
- footer/build label
- service-worker registration
- service-worker cache namespace
- service-worker precache URLs

Old Scholar Garden service-worker caches are removed on activation.
Learner localStorage/state is preserved.

## Files changed

Functional code:
- `language-y8.js`
- `biology-y8.js`
- `subject-hub.js`
- `app.js`
- `index.html`
- `sw.js`

Reports/package metadata:
- `CHANGE_AUDIT.md`
- `QA_REPORT.txt`
- `TOPIC_LEARN_QA.md`
- `UPLOAD_ME.txt`
- `SHA256SUMS.txt`

No question bank, answer bank, concept ID, mastery rule or learner-state key was regenerated.
