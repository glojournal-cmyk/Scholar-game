# Lux et Labor — The Scholar's Garden

## RF10.8.1 Critical Integrity + QA Harness Fix

This is a QA-harness correction on top of RF10.8.

### What changed
Browser QA #14 failed before it could actually verify route isolation because the selector
`[data-global-route="study"]` matched three controls:
- primary navigation Study
- Home Continue Studying
- Subject back-to-Study control

The route-isolation test now scopes itself to the navigation landmark named `Primary` and clicks
the exact `Study`, `Garden`, and `Scholar` buttons there.

No production academic engine, scoring logic, routing behavior, question bank, mastery rule,
XP rule, review scheduling rule, Garden threshold, or Scholar unlock rule was changed in this build.

RF10.8 production fixes are preserved:
- major route isolation CSS
- Latin optional 3sg English pronoun marking
- Latin mini-game anti-double-score guard
- French missing-chunk prompt masking
- correct Ink Pot / Study Books / Ivy Pot object artwork
