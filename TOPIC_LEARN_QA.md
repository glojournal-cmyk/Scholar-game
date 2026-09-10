# V0.3.4.3 Topic Learn QA

## Targeted runtime result

**76 / 76 deterministic + runtime-harness checks PASS**

The exact bug was reproduced architecturally: Practice was visible while `renderNote()` wrote into the hidden Learn pane.

The fix routes every Practice/Training Hall topic Learn action through:

`SubjectHub.openTopicLearn(subject, topicId)`

That flow now:

1. pushes the canonical Learn route into browser history;
2. awaits `SubjectHub.renderTab('learn')`;
3. hides Practice and shows Learn;
4. updates active-tab styling;
5. awaits the correct subject note renderer;
6. scrolls the Learn pane into view.

## Latin Foundation — every visible Training Hall topic Learn route

- PASS — Accusative forms (`la-y8-accusative-forms`)
- PASS — Adjective agreement (`la-y8-adjective-agreement`)
- PASS — Case and grammar role (`la-y8-case-and-grammar-role`)
- PASS — Case functions (`la-y8-case-functions`)
- PASS — Case-role introduction (`la-y8-case-role-introduction`)
- PASS — Choose the complete translation (`la-y8-choose-the-complete-translation`)
- PASS — Choose the exact Latin (`la-y8-choose-the-exact-latin`)
- PASS — Choose the set-text translation (`la-y8-choose-the-set-text-translation`)
- PASS — Complete comprehension (`la-y8-complete-comprehension`)
- PASS — Core verbs (`la-y8-core-verbs`)
- PASS — Declension recognition (`la-y8-declension-recognition`)
- PASS — English → Latin (`la-y8-english-latin`)
- PASS — Find the finite verb (`la-y8-find-the-finite-verb`)
- PASS — Finite verb control (`la-y8-finite-verb-control`)
- PASS — Genitive phrases (`la-y8-genitive-phrases`)
- PASS — ille plural (`la-y8-ille-plural`)
- PASS — ille singular (`la-y8-ille-singular`)
- PASS — Latin → English (`la-y8-latin-english`)
- PASS — Map locations (`la-y8-map-locations`)
- PASS — Miscellaneous words (`la-y8-miscellaneous-words`)
- PASS — Nouns and dictionary entries (`la-y8-nouns-and-dictionary-entries`)
- PASS — Nouns with genitives (`la-y8-nouns-with-genitives`)
- PASS — Perfect cues (`la-y8-perfect-cues`)
- PASS — Perfect patterns (`la-y8-perfect-patterns`)
- PASS — Person and number (`la-y8-person-and-number`)
- PASS — personal pronouns (`la-y8-personal-pronouns`)
- PASS — Photo prepositions (`la-y8-photo-prepositions`)
- PASS — Pluperfect recognition (`la-y8-pluperfect-recognition`)
- PASS — Possessives (`la-y8-possessives`)
- PASS — Preposition dictionary entries (`la-y8-preposition-dictionary-entries`)
- PASS — Prepositions (`la-y8-prepositions`)
- PASS — Present person and number (`la-y8-present-person-and-number`)
- PASS — Production method (`la-y8-production-method`)
- PASS — Research questions (`la-y8-research-questions`)
- PASS — Restore the exact verb (`la-y8-restore-the-exact-verb`)
- PASS — Restore the sentence (`la-y8-restore-the-sentence`)
- PASS — Restore the set text (`la-y8-restore-the-set-text`)
- PASS — Set-text comprehension (`la-y8-set-text-comprehension`)
- PASS — Set-text grammar (`la-y8-set-text-grammar`)
- PASS — Set-text translation (`la-y8-set-text-translation`)
- PASS — Set-text verb meaning (`la-y8-set-text-verb-meaning`)
- PASS — Set-text verb tense (`la-y8-set-text-verb-tense`)
- PASS — Stage 1 vocabulary (`la-y8-stage-1-vocabulary`)
- PASS — Stage 10 vocabulary (`la-y8-stage-10-vocabulary`)
- PASS — Stage 11 vocabulary (`la-y8-stage-11-vocabulary`)
- PASS — Stage 12 vocabulary (`la-y8-stage-12-vocabulary`)
- PASS — Stage 2 vocabulary (`la-y8-stage-2-vocabulary`)
- PASS — Stage 3 vocabulary (`la-y8-stage-3-vocabulary`)
- PASS — Stage 4 vocabulary (`la-y8-stage-4-vocabulary`)
- PASS — Stage 5 vocabulary (`la-y8-stage-5-vocabulary`)
- PASS — Stage 6 vocabulary (`la-y8-stage-6-vocabulary`)
- PASS — Stage 7 vocabulary (`la-y8-stage-7-vocabulary`)
- PASS — Stage 8 vocabulary (`la-y8-stage-8-vocabulary`)
- PASS — Stage 9 vocabulary (`la-y8-stage-9-vocabulary`)
- PASS — Tense in context (`la-y8-tense-in-context`)
- PASS — Tense meaning (`la-y8-tense-meaning`)
- PASS — Tense purpose (`la-y8-tense-purpose`)
- PASS — Tense recognition (`la-y8-tense-recognition`)
- PASS — Tense recognition from models (`la-y8-tense-recognition-from-models`)
- PASS — Test-style production (`la-y8-test-style-production`)
- PASS — Test-style translation (`la-y8-test-style-translation`)
- PASS — Translation method (`la-y8-translation-method`)
- PASS — Vocative (`la-y8-vocative`)
- PASS — Whole-passage understanding (`la-y8-whole-passage-understanding`)
- PASS — Why each place matters (`la-y8-why-each-place-matters`)

## French Foundation — every visible Training Hall topic Learn route

- PASS — Quick rules (`fr-y8-s01-quick-rules`)
- PASS — Weather, activities and opinions (`fr-y8-s02-weather-activities-and-opinions`)
- PASS — Home, family and descriptions (`fr-y8-s03-home-family-and-descriptions`)
- PASS — Food, drink and restaurants (`fr-y8-s04-food-drink-and-restaurants`)
- PASS — Town, time and aller (`fr-y8-s05-town-time-and-aller`)
- PASS — Present tense (`fr-y8-s06-present-tense`)
- PASS — Passé composé (`fr-y8-s07-passe-compose`)
- PASS — Expanded past-participle bank (`fr-y8-s08-expanded-past-participle-bank`)
- PASS — Model answers and sentence building (`fr-y8-s09-model-answers-and-sentence-building`)
- PASS — Accuracy traps (`fr-y8-s10-accuracy-traps`)
- PASS — Master vocabulary (`fr-y8-s11-master-vocabulary`)
- PASS — KS3 extension irregular verbs (`fr-y8-s12-ks3-extension-irregular-verbs`)
- PASS — Reflexives and routine (`fr-y8-s13-reflexives-and-routine`)
- PASS — Daily routine toolkit (`fr-y8-s16-daily-routine-toolkit`)
- PASS — Unit 3 overview (`fr-y8-s17-unit-3-overview`)
- PASS — School descriptions (`fr-y8-s18-school-descriptions`)
- PASS — Subjects, opinions and reasons (`fr-y8-s19-subjects-opinions-and-reasons`)
- PASS — School activities (`fr-y8-s20-school-activities`)
- PASS — Reflexives and negatives (`fr-y8-s21-reflexives-and-negatives`)
- PASS — High-scoring structures (`fr-y8-s22-high-scoring-structures`)
- PASS — Targeted practice (`fr-y8-s23-targeted-practice`)
- PASS — Numbers and age (`fr-y8-s24-numbers-and-age`)
- PASS — Classroom objects (`fr-y8-s25-classroom-objects`)
- PASS — Passé composé activity bank (`fr-y8-s26-passe-compose-activity-bank`)
- PASS — Teacher targets/extension structures (`fr-y8-s27-teacher-targets-extension-structures`)
- PASS — French-speaking school-life reading (`fr-y8-s28-french-speaking-school-life-reading`)
- PASS — Mixed assessment (`fr-y8-s29-mixed-assessment`)
- PASS — Supplementary teacher vocabulary (`fr-y8-s30-supplementary-teacher-vocabulary`)
- PASS — Regular present patterns (`fr-y8-s31-regular-present-patterns`)
- PASS — Accuracy repair (`fr-y8-s32-accuracy-repair`)

## Biology Foundation — every visible Training Hall topic Learn route

- PASS — Balanced diet and nutrients (`bio-y8-balanced-diet`)
- PASS — Food tests and laboratory safety (`bio-y8-food-tests`)
- PASS — Energy balance, deficiency and BMI (`bio-y8-energy-bmi`)
- PASS — Digestive system and absorption (`bio-y8-digestion-absorption`)
- PASS — Enzymes and gut bacteria (`bio-y8-enzymes-gut`)
- PASS — Recreational drugs, caffeine and alcohol (`bio-y8-drugs-alcohol`)
- PASS — Plant and leaf structure (`bio-y8-leaf-structure`)
- PASS — Photosynthesis and uses of glucose (`bio-y8-photosynthesis-glucose`)
- PASS — Evidence and starch experiments (`bio-y8-starch-evidence`)
- PASS — Limiting factors and graphs (`bio-y8-limiting-factors`)
- PASS — Colour of light practical (`bio-y8-light-colour-practical`)
- PASS — Mineral ions and greenhouses (`bio-y8-minerals-greenhouse`)
- PASS — Classification and identification keys (`bio-y8-classification`)
- PASS — Organisms, populations, communities and habitats (`bio-y8-ecology-terms`)
- PASS — Food chains, food webs and trophic levels (`bio-y8-food-chains-webs`)
- PASS — Pyramids and energy transfer (`bio-y8-pyramids-energy`)
- PASS — Competition and limiting factors (`bio-y8-competition`)
- PASS — Predator-prey relationships and adaptations (`bio-y8-predator-prey-adaptations`)
- PASS — Human impact, pollutants and indicator species (`bio-y8-pollutants-indicators`)
- PASS — DNA, chromosomes, genes and alleles (`bio-y8-dna-genes`)
- PASS — Fertilisation and inheritance (`bio-y8-fertilisation-inheritance`)
- PASS — Punnett squares and probability (`bio-y8-punnett-squares`)
- PASS — Variation and mutation (`bio-y8-variation-mutation`)
- PASS — Genetic disorders (`bio-y8-genetic-disorders`)
- PASS — Natural selection and evolution (`bio-y8-natural-selection`)
- PASS — Variables, controls, reliability and validity (`bio-y8-variables-quality`)
- PASS — Graphs, calculations and unit conversions (`bio-y8-graphs-calculations`)
- PASS — Practical methods and conclusions (`bio-y8-practical-conclusions`)
- PASS — Mixed exam practice (`bio-y8-mixed-exam`)
- PASS — Smoking and tobacco smoke (`bio-y8-smoking-health`)
- PASS — Saturated and unsaturated fats (`bio-y8-fats-cholesterol`)
- PASS — Reading nutrition labels (`bio-y8-nutrition-labels`)
- PASS — Classification hierarchy and binomial naming (`bio-y8-binomial-naming`)
- PASS — DNA structure, homologous pairs and karyograms (`bio-y8-dna-structure`)
- PASS — Continuous variation and bell-shaped distributions (`bio-y8-continuous-variation`)
- PASS — Correlation: hand span and height (`bio-y8-correlation`)
- PASS — Basal energy requirement calculation (`bio-y8-ber`)

## Additional interaction checks

- PASS — Latin: Back to all topics
- PASS — Latin: Practise this topic
- PASS — French: Back to all topics
- PASS — French: Practise this topic
- PASS — Biology: Back to all topics
- PASS — Biology: Practise this topic
- PASS — route changes from Practice to Learn
- PASS — Practice pane becomes hidden
- PASS — Learn pane becomes visible
- PASS — Learn tab becomes active
- PASS — note pane scroll hook fires
- PASS — `popstate` route rendering exists for browser Back/Forward
- PASS — route rendering is de-duplicated to avoid a `popstate` + `hashchange` race

## Existing functional regression checks retained

- PASS — Latin Y8 Learn
- PASS — French Y8 Learn
- PASS — Biology Y8 Learn
- PASS — Biology Y9 Learn
- PASS — Chemistry Y9 Learn
- PASS — Physics Y9 Learn
- PASS — Latin Learn → Practise → Play → Progress → Learn
- PASS — French Learn → Practise → Play → Progress → Learn
- PASS — Latin/French/Biology Mixed Practice renders
- PASS — Latin/French/Biology Extra Practice renders
- PASS — Forma Forge Level 1 renders
- PASS — Sentence Mosaic Level 1 renders
- PASS — Verbum Match Level 1 renders
- PASS — Manuscript Mystery Level 1 renders

## Browser/public limitation

These are runtime-harness and deterministic checks against the packaged build.

A real Chromium launch was previously attempted in this execution environment and terminated before usable navigation. Therefore this report does **not** claim physical iPad Safari or public GitHub Pages manual click QA.

Public acceptance remains pending deployment.
