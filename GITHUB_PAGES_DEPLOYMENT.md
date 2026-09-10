# GitHub Pages Deployment — V0.4.0 Alpha 5 RC4

## Recommended flow
1. Upload this build to a branch such as `alpha5-rc4`.
2. Open a pull request into `main`.
3. Test before merging.
4. Merge only after browser acceptance.
5. Keep the repository's existing Pages configuration, or configure Pages to deploy from the production branch/root.

## Why this build is Pages-safe
- Resources use relative URLs.
- Manifest uses `start_url: "./"` and `scope: "./"`.
- Service worker is repository-relative.
- `404.html` mirrors the app shell for accidental non-hash deep paths.
- Main navigation remains hash-routed.
- No local development absolute paths are present.

## First deploy check
- Hard refresh once.
- Confirm the RC4 service worker is active.
- Test Home, Study, one lesson, one practice item, Garden and Scholar.
- Toggle offline and reload.
- Reconnect and verify a later deployment replaces the prior cache.
