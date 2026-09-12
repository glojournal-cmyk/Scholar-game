# Lux et Labor — The Scholar’s Garden

## RF8 Stable Rebuild

RF8 is the clean re-upload build dated 2026-09-12. Keep the repository directory structure intact.

Critical directories:

```text
assets/rf8/
cp-y8/runtime/
cp-y8/shared/
```

Do **not** flatten those directories into the repository root.

The production page loads `rf8-production.css` and `rf8-production.js`. Academic marking, mastery, XP and review engines remain in their dedicated modules.

For GitHub Pages, upload all RF8 batches, preserving paths, then wait for the newest Pages deployment to complete. See `RF8_QA_REPORT.txt` and `RF8_UPLOAD_GUIDE.txt`.
