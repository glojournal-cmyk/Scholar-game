# Master Content Pack V1

## Purpose

This is the source-locked content core for a new iPad-first cultivation revision PWA. It covers Latin, French and Biology Year 8 consolidation. It preserves the verified source banks, adds varied question formats linked by concept IDs, supplies teaching notes and answer specifications, and separates recognition from genuine mastery.

## Headline counts

| Subject | Questions | Concepts | Preserved verified questions | New variants / authored questions | Recognition | Production / application |
|---|---:|---:|---:|---:|---:|---:|
| Latin | 2,492 | 778 | 1,056 | 1,436 | 986 | 1,506 |
| French | 5,585 | 1,913 | 2,601 | 2,984 | 1,734 | 3,851 |
| Biology | 989 | 455 | 0 | 989 | 358 | 631 |
| **Total** | **9,066** | **3,146** | **3,657** | **5,409** | **3,078** | **5,988** |

## Release status

| Subject | Enabled for ordinary play | Preview only | Preserved but disabled |
|---|---:|---:|---:|
| Latin | 2,492 | 0 | 0 |
| French | 4,555 | 171 | 859 |
| Biology | 989 | 0 | 0 |
| **Total** | **8,036** | **171** | **859** |

Use only **status: enabled** in ordinary sessions. Preview items require an explicit preview route. Disabled items are retained for source audit/editorial review and must not be selected automatically.

## Marking routes

- 8,582 questions have direct structured auto-marking.
- 318 Biology responses use source mark-point checklists and require learner/parent/teacher/approved AI evidence before awarding the points.
- 152 deliberately ambiguous or open French responses return **Review needed** rather than a false automatic mark.
- 14 diagram questions remain review-based until the final artwork supplies stable anchor IDs.

## Key design rules

- Keep MC as an accessible confidence layer, especially at the start of a session.
- Track one concept across all its variants; never award separate mastery merely because the wording changed.
- Require at least one production or application success before a concept can become secure.
- After an error, teach first, avoid an identical immediate repeat, then return through a different format and the 2-day / 7-day review route.
- French accents are corrected and displayed but not deducted. Base spelling, articles, subject/verb, auxiliary, tense, negatives and agreement remain meaningful.
- Biology long answers use mark points or criterion checklists with review fallback, never exact-string marking.

## Folders

- **schema/**: portable question schema.
- **shared/**: marking, mastery, review, session, format and error rules.
- **latin/**: questions, answers, concepts, vocabulary and notes.
- **french/**: questions, answers, concepts, vocabulary, notes, writing and the gated Year 9 preview intake.
- **biology/**: questions, answers, concepts, keywords, notes and diagram specifications.
- **runtime/**: minified topic bundles for fast iPad/PWA loading; start with **runtime/index.json**.
- **qa/**: executable QA and its generated reports.

## App integration order

1. Load **shared/question-type-registry.json** and **schema/question.schema.json**.
2. For production, load **runtime/index.json**, then fetch only the selected topic bundle. The full subject banks remain the editorial source of truth.
3. Store learner state by **conceptId**, not by prompt wording alone.
4. Use **gameplay.masteryWeight** and **shared/mastery-review-spec.json** to update mastery.
5. Use each question's structured **answer** object; do not replace it with a single generic string matcher.
6. Run **node qa/run_qa.mjs** after every bank edit.

## Year 9 French

**french/year9-preview-bank.json** is intentionally empty. The public TGS curriculum does not provide an exact Year 9 word list. Add only verified school vocabulary, then introduce 3-5 preview words per session without first-exposure life loss.
