# Lux et Labor — The Scholar's Garden

## RF10.6.3 Deployment Hardening

This build is based on the green RF10.6.2 browser-QA baseline.

### Why this build exists
A successful GitHub Pages deployment could still be difficult to verify when a browser, service
worker or intermediary returned an older app shell.

### Hardening
- Adds `/version.json` as a machine-readable live build marker.
- Adds `deploy-guard.js` to compare the HTML build against the deployed version endpoint.
- A detected mismatch purges Scholar's Garden caches, unregisters old service workers and reloads
  once with an explicit build query parameter.
- Service-worker navigation and `version.json` requests use `cache: no-store`.
- Old Scholar's Garden cache namespaces are deleted on service-worker activation.
- The visible footer includes `data-build="RF10.6.3"`.
- Browser QA asserts that HTML metadata, footer and `version.json` all agree.

Game Home, WebAudio, Year 9 Latin Bridge Review and academic engines are preserved.
