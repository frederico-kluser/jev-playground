/**
 * Jev (TypeSafe System One) wire contract, request building, concept
 * validation and action bands.
 *
 * Wire schema verified 2026-09 against docs.typesafe.ai/api and the OpenRouter
 * Decisions reference (see README "Request model"). Jev never generates text:
 * it answers typed questions (`noul` / `choice` / `score`) about a `state` with
 * calibrated probabilities, in a single parallel pass.
 */

// ==========================================================================
// Wire types
// ==========================================================================

export const JEV_MODELS = ["typesafe/jev-1.13", "~typesafe/jev-latest"] as const;
export type JevModel = (typeof JEV_MODELS)[number];

export const DECISIONS_URL = "https://openrouter.ai/api/alpha/decisions";
export const KEY_CHECK_URL = "https://openrouter.ai/api/v1/key";
export const GENERATION_URL = "https://openrouter.ai/api/v1/generation";

/** Input price: US$ 0.042 per million input tokens. Output tokens are free. */
export const INPUT_PRICE_PER_MTOK = 0.042;

export type NoulQuestion = {
  type: "noul";
  instructions: string;
  /** Optional; when present, both keys are individual strings and either may be omitted. */
  criteria?: { true?: string; false?: string };
};

export type ChoiceQuestion = {
  type: "choice";
  instructions: string;
  /** Option key -> rubric. `null` for self-explanatory options. Max 255 options. */
  criteria: Record<string, string | null>;
};

export type ScoreQuestion = {
  type: "score";
  instructions: string;
  /** Ordered low -> high, 2..10 concrete situation descriptions. */
  criteria: string[];
};

export type WireQuestion = NoulQuestion | ChoiceQuestion | ScoreQuestion;

export type DecisionsRequest = {
  model: string;
  state: string | object | unknown[];
  questions: Record<string, WireQuestion>;
  session_id?: string;
  user?: string;
};

export type NoulAnswer = { type: "noul"; noul: number };
export type ChoiceAnswer = {
  type: "choice";
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
};
export type ScoreAnswer = {
  type: "score";
  score: number;
  legend: Record<string, string>;
  probabilities: Record<string, number>;
  confidence: number;
};

/** `noul` carries no `confidence` field: the binary distribution IS the answer. */
export type WireAnswer = NoulAnswer | ChoiceAnswer | ScoreAnswer;

export type DecisionsResponse = {
  answers: Record<string, WireAnswer>;
  id?: string;
  model: string;
  provider?: string;
  usage?: { cost?: number; input_tokens?: number; output_tokens?: number };
};

export type ApiErrorBody = { error?: { code?: number; message?: string } };

// ==========================================================================
// UI drafts -> wire
// ==========================================================================

export type OptionDraft = { key: string; rubric: string };

export type QuestionDraft = {
  id: string;
  type: "noul" | "choice" | "score";
  instructions: string;
  /** noul */
  criteriaTrue: string;
  criteriaFalse: string;
  /** choice */
  options: OptionDraft[];
  /** score */
  levels: string[];
};

export function newQuestion(type: "noul" | "choice" | "score"): QuestionDraft {
  return {
    id: "",
    type,
    instructions: "",
    criteriaTrue: "",
    criteriaFalse: "",
    options:
      type === "choice"
        ? [
            { key: "billing", rubric: "" },
            { key: "frontend", rubric: "" },
            { key: "other", rubric: "None of the above" },
          ]
        : [],
    levels:
      type === "score"
        ? ["Can wait for the next release", "Should be handled this week", "Blocking revenue right now"]
        : [],
  };
}

/** Serializes one draft into its wire shape (`null` criteria for blank rubrics). */
export function toWireQuestion(q: QuestionDraft): WireQuestion {
  if (q.type === "noul") {
    const criteria: { true?: string; false?: string } = {};
    if (q.criteriaTrue.trim()) criteria.true = q.criteriaTrue.trim();
    if (q.criteriaFalse.trim()) criteria.false = q.criteriaFalse.trim();
    return Object.keys(criteria).length > 0
      ? { type: "noul", instructions: q.instructions.trim(), criteria }
      : { type: "noul", instructions: q.instructions.trim() };
  }
  if (q.type === "choice") {
    const criteria: Record<string, string | null> = {};
    for (const opt of q.options) {
      const key = opt.key.trim();
      if (!key) continue;
      criteria[key] = opt.rubric.trim() ? opt.rubric.trim() : null;
    }
    return { type: "choice", instructions: q.instructions.trim(), criteria };
  }
  return {
    type: "score",
    instructions: q.instructions.trim(),
    criteria: q.levels.map((l) => l.trim()).filter(Boolean),
  };
}

export function buildRequest(input: {
  model: string;
  stateText: string;
  stateMode: "text" | "json";
  questions: QuestionDraft[];
  sessionId?: string;
  user?: string;
}): DecisionsRequest {
  const questions: Record<string, WireQuestion> = {};
  input.questions.forEach((q, index) => {
    const id = q.id.trim() || `q${index + 1}`;
    questions[id] = toWireQuestion(q);
  });

  let state: string | object | unknown[] = input.stateText.trim();
  if (input.stateMode === "json") {
    try {
      state = JSON.parse(input.stateText) as object | unknown[];
    } catch {
      // Validation reports the parse error; keep the raw text so the request preview stays honest.
      state = input.stateText;
    }
  }

  const request: DecisionsRequest = { model: input.model, state, questions };
  if (input.sessionId?.trim()) request.session_id = input.sessionId.trim();
  if (input.user?.trim()) request.user = input.user.trim();
  return request;
}

// ==========================================================================
// Concept validation (offline, before spending tokens)
// ==========================================================================

export type IssueLevel = "error" | "warning" | "tip";

export type Issue = {
  level: IssueLevel;
  /** Question id when the issue is scoped to one question. */
  questionId?: string;
  /** i18n key inside `dict.*.issues`, with optional interpolation values. */
  rule: string;
  params?: Record<string, string | number>;
};

const TEXT_GENERATION_RE =
  /\b(explain|write|summariz|describe|translate|rewrite|draft|generate)\w*\b|\b(explic|escrev|resum|descrev|traduz|reescr|redig|gere)\b/i;

const COMPOUND_RE = /\band\b.*\?|\be\b.*\?/i;

const MATH_DATE_RE =
  /\b(how many|count|calculate|sum|total|average|date|deadline|days?|hours?|months?|years?)\b|\b(quant[oa]s?|calcul|soma|m[ée]dia|data|prazo|dias?|horas?|meses?|anos?)\b/i;

const OPTION_CAP = 255;
const SCORE_MIN_LEVELS = 2;
const SCORE_MAX_LEVELS = 10;

/** Rough token budget: Jev takes 64k tokens per request, 32k for state + longest question. */
export const STATE_CHAR_BUDGET = 32_000 * 4;

export function validateDrafts(input: {
  stateText: string;
  stateMode: "text" | "json";
  questions: QuestionDraft[];
}): Issue[] {
  const issues: Issue[] = [];
  const { stateText, stateMode, questions } = input;

  if (!stateText.trim()) {
    issues.push({ level: "error", rule: "stateEmpty" });
  } else if (stateMode === "json") {
    try {
      JSON.parse(stateText);
    } catch {
      issues.push({ level: "error", rule: "stateInvalidJson" });
    }
  }
  if (stateText.length > STATE_CHAR_BUDGET) {
    issues.push({ level: "warning", rule: "stateTooLarge" });
  } else if (stateText.length > 24_000) {
    issues.push({ level: "warning", rule: "stateRot" });
  }

  if (questions.length === 0) {
    issues.push({ level: "error", rule: "noQuestions" });
  }

  const seenIds = new Set<string>();
  questions.forEach((q, index) => {
    const id = q.id.trim() || `q${index + 1}`;
    if (q.id.trim() && seenIds.has(q.id.trim())) {
      issues.push({ level: "error", questionId: id, rule: "duplicateId", params: { id: q.id.trim() } });
    }
    seenIds.add(id);

    if (!q.instructions.trim()) {
      issues.push({ level: "error", questionId: id, rule: "instructionsEmpty" });
    } else {
      if (TEXT_GENERATION_RE.test(q.instructions)) {
        issues.push({ level: "warning", questionId: id, rule: "asksForText" });
      }
      if (COMPOUND_RE.test(q.instructions)) {
        issues.push({ level: "warning", questionId: id, rule: "compoundQuestion" });
      }
      if (MATH_DATE_RE.test(q.instructions)) {
        issues.push({ level: "warning", questionId: id, rule: "mathOrDates" });
      }
    }

    if (q.type === "choice") {
      const keys = q.options.map((o) => o.key.trim()).filter(Boolean);
      if (keys.length === 0) {
        issues.push({ level: "error", questionId: id, rule: "choiceNoOptions" });
      }
      if (keys.length > OPTION_CAP) {
        issues.push({ level: "error", questionId: id, rule: "choiceTooMany", params: { max: OPTION_CAP } });
      }
      if (new Set(keys).size !== keys.length) {
        issues.push({ level: "error", questionId: id, rule: "choiceDuplicateOption" });
      }
      const hasExit = keys.some((k) => /^(other|none|outro|nenhum|nenhuma)$/i.test(k));
      if (keys.length > 0 && !hasExit) {
        issues.push({ level: "tip", questionId: id, rule: "choiceNoExit" });
      }
    }

    if (q.type === "score") {
      const levels = q.levels.map((l) => l.trim()).filter(Boolean);
      if (levels.length < SCORE_MIN_LEVELS || levels.length > SCORE_MAX_LEVELS) {
        issues.push({
          level: "error",
          questionId: id,
          rule: "scoreLevelCount",
          params: { min: SCORE_MIN_LEVELS, max: SCORE_MAX_LEVELS },
        });
      }
      if (levels.some((l) => /^[\d.\s-]+$/.test(l))) {
        issues.push({ level: "warning", questionId: id, rule: "scoreNumericLevels" });
      }
    }
  });

  return issues;
}

/** A request is runnable when there is not a single `error` issue. */
export function isRunnable(issues: Issue[]): boolean {
  return !issues.some((i) => i.level === "error");
}

// ==========================================================================
// Action bands (auto / hitl / abstain)
// ==========================================================================

export type Band = "auto" | "hitl" | "abstain";

export const DEFAULT_THRESHOLDS = { auto: 0.9, hitl: 0.5 } as const;

/**
 * Certainty of a `noul` answer on the confidence scale used by the bands:
 * 0.5 for a coin flip, 1.0 for certain. Same 0.5 floor the bands assume.
 */
export function noulCertainty(p: number): number {
  return 0.5 + Math.abs(p - 0.5);
}

export function bandFor(confidence: number, thresholds = DEFAULT_THRESHOLDS): Band {
  if (confidence >= thresholds.auto) return "auto";
  if (confidence >= thresholds.hitl) return "hitl";
  return "abstain";
}

export function answerConfidence(answer: WireAnswer): number {
  return answer.type === "noul" ? noulCertainty(answer.noul) : answer.confidence;
}

export function answerBand(answer: WireAnswer, thresholds = DEFAULT_THRESHOLDS): Band {
  return bandFor(answerConfidence(answer), thresholds);
}

/** Weighted score with up to two decimals; levels may fall between integers. */
export function formatScoreAnswer(answer: ScoreAnswer): string {
  return Number.isInteger(answer.score) ? String(answer.score) : answer.score.toFixed(2);
}