# Lux et Labor — The Scholar's Garden

## RF10.4.1 QA Harness Fix

This is a QA-only correction.

The previous smoke test incorrectly expected a `#app` wrapper that does not exist in the real app.
RF10.4.1 now validates the actual navigation shell and visible screen structure, while preserving
all routing, UI, academic engines, mastery, XP, due-review logic, question banks and runtime packs.

The smoke test also prints explicit browser diagnostics for uncaught page errors and console errors,
so future GitHub Actions failures show the real runtime error directly in the log.
