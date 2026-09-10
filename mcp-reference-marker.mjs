const stripDiacritics = value => String(value).normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

export const normalise = (value, options = {}) => {
  let text = String(value ?? "")
    .replace(/[’‘`]/g, "'")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
  if (options.ignoreDiacritics) text = stripDiacritics(text);
  if (options.optionalParentheticalAnnotations) text = text.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s+/g, " ").trim();
  if (options.ignoreTerminalPunctuation !== false) text = text.replace(/[.!?,;:]+$/g, "").trim();
  return text;
};

const optionsFor = (question, answer) => ({
  ignoreDiacritics: question.subject === "french" && answer.normalization?.ignoreFrenchDiacriticsForScore !== false,
  optionalParentheticalAnnotations: Boolean(answer.optionalParentheticalAnnotations),
  ignoreTerminalPunctuation: true
});

const exact = (response, accepted, options) => {
  const candidate = normalise(response, options);
  return accepted.some(value => normalise(value, options) === candidate);
};

const phrasePresent = (response, alternative, options) => {
  const haystack = normalise(response, options);
  const needle = normalise(alternative, options);
  if (haystack === needle) return true;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Treat normal list punctuation as a boundary so responses such as
  // "meum, meus and mea" mark each requested form independently.
  return new RegExp(`(?:^|[\\s,;/|])${escaped}(?=$|[\\s,;/|])`).test(haystack);
};

const tokensOf = (value, options) => normalise(Array.isArray(value) ? value.join(", ") : value, options).match(/[\p{L}\p{N}']+/gu) ?? [];

const remainingTokens = (response, matchedAlternatives, options) => {
  const remaining = tokensOf(response, options);
  const phrases = [...new Set((matchedAlternatives ?? []).map(value => normalise(value, options)))]
    .map(value => ({value, tokens: tokensOf(value, options)}))
    .filter(item => item.tokens.length)
    .sort((a, b) => b.tokens.length - a.tokens.length);
  for (const phrase of phrases) {
    for (let start = 0; start <= remaining.length - phrase.tokens.length; start += 1) {
      if (phrase.tokens.every((token, index) => remaining[start + index] === token)) {
        remaining.splice(start, phrase.tokens.length);
        break;
      }
    }
  }
  return remaining.filter(token => !["and", "et"].includes(token));
};

const markGroups = (response, groups, options) => {
  const missing = [];
  const matchedAlternatives = [];
  for (const group of groups) {
    const alternatives = group.alternatives ?? group.accepted ?? group;
    const match = [...alternatives].sort((a, b) => tokensOf(b, options).length - tokensOf(a, options).length).find(value => phrasePresent(response, value, options));
    if (match === undefined) missing.push(group.label ?? alternatives[0]);
    else matchedAlternatives.push(match);
  }
  return {correct: missing.length === 0, missing, matchedAlternatives};
};

const markDistinctGroups = (response, groups, options) => {
  const alternatives = [...new Set(groups.flatMap(group => group.alternatives ?? group.accepted ?? group).map(value => normalise(value, options)))];
  const matched = alternatives.filter(value => phrasePresent(response, value, options));
  const required = groups.length;
  return {
    correct: matched.length >= required,
    missing: matched.length >= required ? [] : [`${required - matched.length} more different item(s)`],
    matched,
    matchedAlternatives: matched
  };
};

const parseNumeric = response => {
  if (typeof response === "number") return {value: response, text: String(response)};
  const text = String(response ?? "").replace(/,/g, "");
  const match = text.match(/-?\d+(?:\.\d+)?/);
  return {value: match ? Number(match[0]) : Number.NaN, text};
};

const comparePairMap = (response, pairs, options) => {
  if (!response || typeof response !== "object" || Array.isArray(response)) return {correct: false, missing: pairs.map(pair => pair.left)};
  const missing = pairs.filter(pair => !exact(response[pair.left], [pair.right], options)).map(pair => pair.left);
  return {correct: missing.length === 0, missing};
};

const asNormalisedSet = (values, options) => new Set((values ?? []).map(value => normalise(value, options)));

const compareCategoryMap = (response, categories, options) => {
  if (!response || typeof response !== "object" || Array.isArray(response)) return {correct: false, missing: Object.keys(categories)};
  const wrong = [];
  for (const [category, expected] of Object.entries(categories)) {
    const actualSet = asNormalisedSet(response[category], options);
    const expectedSet = asNormalisedSet(expected, options);
    if (actualSet.size !== expectedSet.size || [...expectedSet].some(value => !actualSet.has(value))) wrong.push(category);
  }
  return {correct: wrong.length === 0, missing: wrong};
};

const compareSequence = (response, expected, options) => {
  const actual = Array.isArray(response) ? response : String(response ?? "").split(/\s*(?:→|->|>|;|\n)\s*/).filter(Boolean);
  const correct = actual.length === expected.length && actual.every((value, index) => normalise(value, options) === normalise(expected[index], options));
  return {correct, expected, actual};
};

export const markQuestion = (question, response) => {
  const answer = question.answer ?? {};
  const options = optionsFor(question, answer);
  const mode = answer.mode;
  if (mode === "choice") {
    const correct = exact(response, [answer.correctOption], options);
    return {correct, result: correct ? "Correct" : "Needs repair", expected: answer.correctOption};
  }
  if (["exact_or_equivalent", "one_of_complete_examples"].includes(mode)) {
    const strictCorrect = exact(response, answer.accepted ?? [], {...options, ignoreDiacritics: false});
    const looseCorrect = exact(response, answer.accepted ?? [], options);
    const accentOnly = question.subject === "french" && looseCorrect && !strictCorrect;
    return {correct: looseCorrect, result: accentOnly ? "Nearly correct — accents" : looseCorrect ? "Correct" : "Needs repair", expected: answer.accepted};
  }
  if (mode === "ordered_tiles") {
    const constructed = Array.isArray(response) ? response.join(question.stimulus?.unit === "letter" ? "" : " ") : response;
    const strictCorrect = exact(constructed, answer.accepted ?? [], {...options, ignoreDiacritics: false});
    const looseCorrect = exact(constructed, answer.accepted ?? [], options);
    const accentOnly = question.subject === "french" && looseCorrect && !strictCorrect;
    return {correct: looseCorrect, result: accentOnly ? "Nearly correct — accents" : looseCorrect ? "Correct" : "Needs repair", constructed, expected: answer.accepted};
  }
  if (["semantic_groups", "latin_required_groups"].includes(mode)) {
    const groupResult = markGroups(response, answer.requiredGroups ?? [], options);
    const unexpected = mode === "latin_required_groups" && answer.rejectUnrelatedExtraTokens
      ? remainingTokens(response, groupResult.matchedAlternatives, options)
      : [];
    const correct = groupResult.correct && unexpected.length === 0;
    return {...groupResult, correct, unexpected, result: correct ? "Correct" : "Needs repair"};
  }
  if (mode === "unordered_required_groups") {
    const groupResult = answer.distinctRequired ? markDistinctGroups(response, answer.requiredGroups ?? [], options) : markGroups(response, answer.requiredGroups ?? [], options);
    const unexpected = answer.rejectUnrelatedExtraTokens === false ? [] : remainingTokens(response, groupResult.matchedAlternatives, options);
    const correct = groupResult.correct && unexpected.length === 0;
    return {...groupResult, correct, unexpected, result: correct ? "Correct" : "Needs repair"};
  }
  if (mode === "numeric") {
    const parsed = parseNumeric(response);
    const tolerance = answer.tolerance ?? 0;
    const numberCorrect = Number.isFinite(parsed.value) && Math.abs(parsed.value - answer.value) <= tolerance;
    const normalisedResponse = normalise(parsed.text, options);
    const unitCorrect = !answer.units?.length || answer.units.some(unit => {
      const normalisedUnit = normalise(unit, options);
      const escaped = normalisedUnit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
      return new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`).test(normalisedResponse);
    });
    const correct = numberCorrect && unitCorrect;
    return {correct, result: correct ? "Correct" : "Needs repair", numberCorrect, unitCorrect, expectedValue: answer.value, expectedUnits: answer.units};
  }
  if (mode === "pair_map") {
    const result = comparePairMap(response, answer.pairs ?? [], options);
    return {...result, result: result.correct ? "Correct" : "Needs repair"};
  }
  if (mode === "category_map") {
    const result = compareCategoryMap(response, answer.categories ?? {}, options);
    return {...result, result: result.correct ? "Correct" : "Needs repair"};
  }
  if (mode === "sequence") {
    const result = compareSequence(response, answer.items ?? [], options);
    return {...result, result: result.correct ? "Correct" : "Needs repair"};
  }
  if (mode === "diagram_labels") {
    if (!response || typeof response !== "object") return {correct: false, result: "Needs repair", missing: answer.requiredLabels ?? []};
    const expected = answer.labelMap;
    if (!expected) return {correct: null, result: "Review needed", checklist: answer.requiredLabels ?? []};
    const result = comparePairMap(response, Object.entries(expected).map(([left, right]) => ({left, right})), options);
    return {...result, result: result.correct ? "Correct" : "Needs repair"};
  }
  if (mode === "mark_points" || mode === "manual_review") {
    const evidence = response?.markPointEvidence;
    if (!Array.isArray(evidence)) return {correct: null, result: "Review needed", checklist: answer.markPoints ?? [], modelAnswer: answer.modelAnswer ?? null};
    const score = evidence.filter(Boolean).length;
    const totalMarks = answer.totalMarks ?? answer.markPoints?.length ?? evidence.length;
    return {correct: score >= totalMarks, result: score >= totalMarks ? "Correct" : "Needs repair", score, totalMarks, checklist: answer.markPoints ?? []};
  }
  return {correct: null, result: "Review needed", reason: `Unsupported or deliberately manual mode: ${mode}`};
};
