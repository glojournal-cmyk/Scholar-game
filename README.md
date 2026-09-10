# Lux et Labor — The Scholar’s Garden

Current release candidate: **V0.4.0 Alpha 5 RC4**

The Scholar’s Garden is a static vanilla-JavaScript educational PWA with subject learning, practice, review, games, Garden progression and Scholar customisation.

## Run locally

Run it through HTTP rather than opening `index.html` directly from disk:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Main routes
- `#home`
- `#study`
- `#subject/latin`
- `#subject/french`
- `#subject/biology`
- `#garden`
- `#scholar/overview`
- `#scholar/wardrobe`
- `#scholar/collection`
- `#scholar/achievements`
- `#scholar/profile`

## Deployment
See `GITHUB_PAGES_DEPLOYMENT.md`.

## Release notes
See `RELEASE_NOTES_ALPHA5_RC4.md` and `ALPHA5_RC4_FINAL_QA.md`.

## Academic-state boundary
Presentation code does not rewrite answer marking, question-bank content, mastery transitions, XP award rules, due-review scheduling, Garden thresholds, game scoring or Scholar unlock rules.
