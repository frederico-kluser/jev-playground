import { describe, expect, it } from "vitest";
import {
  answerBand,
  answerConfidence,
  bandFor,
  buildRequest,
  formatScoreAnswer,
  isRunnable,
  newQuestion,
  noulCertainty,
  toWireQuestion,
  validateDrafts,
  type QuestionDraft,
} from "./jev";

function draft(partial: Partial<QuestionDraft> & Pick<QuestionDraft, "type">): QuestionDraft {
  return { ...newQuestion(partial.type), id: "q1", instructions: "Is this urgent?", ...partial };
}

describe("toWireQuestion", () => {
  it("omits noul criteria when both rubrics are blank", () => {
    const wire = toWireQuestion(draft({ type: "noul", criteriaTrue: "  ", criteriaFalse: "" }));
    expect(wire).toEqual({ type: "noul", instructions: "Is this urgent?" });
  });

  it("keeps only the filled noul criteria key", () => {
    const wire = toWireQuestion(draft({ type: "noul", criteriaTrue: "broken", criteriaFalse: "" }));
    expect(wire).toEqual({
      type: "noul",
      instructions: "Is this urgent?",
      criteria: { true: "broken" },
    });
  });

  it("maps blank choice rubrics to null and trims keys", () => {
    const wire = toWireQuestion(
      draft({
        type: "choice",
        options: [
          { key: " frontend ", rubric: "Rendering" },
          { key: "other", rubric: "   " },
        ],
      }),
    );
    expect(wire).toEqual({
      type: "choice",
      instructions: "Is this urgent?",
      criteria: { frontend: "Rendering", other: null },
    });
  });

  it("keeps score levels ordered and drops blanks", () => {
    const wire = toWireQuestion(draft({ type: "score", levels: ["low", " ", "high"] }));
    expect(wire).toEqual({ type: "score", instructions: "Is this urgent?", criteria: ["low", "high"] });
  });
});

describe("buildRequest", () => {
  it("parses JSON state and auto-numbers blank question ids", () => {
    const request = buildRequest({
      model: "typesafe/jev-1.13",
      stateText: '{"ticket":"white screen"}',
      stateMode: "json",
      questions: [draft({ id: "", type: "noul" }), draft({ id: "team", type: "choice" })],
    });
    expect(request.state).toEqual({ ticket: "white screen" });
    expect(Object.keys(request.questions)).toEqual(["q1", "team"]);
  });

  it("keeps raw text when JSON is invalid (validation reports it)", () => {
    const request = buildRequest({
      model: "typesafe/jev-1.13",
      stateText: "{oops",
      stateMode: "json",
      questions: [draft({ type: "noul" })],
    });
    expect(request.state).toBe("{oops");
  });

  it("adds optional session_id and user only when filled", () => {
    const request = buildRequest({
      model: "typesafe/jev-1.13",
      stateText: "s",
      stateMode: "text",
      questions: [draft({ type: "noul" })],
      sessionId: "abc",
    });
    expect(request.session_id).toBe("abc");
    expect(request.user).toBeUndefined();
  });
});

describe("validateDrafts", () => {
  it("flags empty state and missing questions as errors", () => {
    const issues = validateDrafts({ stateText: "  ", stateMode: "text", questions: [] });
    expect(issues.map((i) => i.rule)).toContain("stateEmpty");
    expect(issues.map((i) => i.rule)).toContain("noQuestions");
    expect(isRunnable(issues)).toBe(false);
  });

  it("flags invalid JSON state", () => {
    const issues = validateDrafts({ stateText: "{bad", stateMode: "json", questions: [draft({ type: "noul" })] });
    expect(issues.map((i) => i.rule)).toContain("stateInvalidJson");
  });

  it("warns on text-generation, compound and math instructions", () => {
    const issues = validateDrafts({
      stateText: "s",
      stateMode: "text",
      questions: [
        draft({ id: "a", type: "noul", instructions: "Explain and summarize why this happened?" }),
        draft({ id: "b", type: "score", instructions: "How many days until the deadline?" }),
      ],
    });
    const rules = issues.map((i) => i.rule);
    expect(rules).toContain("asksForText");
    expect(rules).toContain("compoundQuestion");
    expect(rules).toContain("mathOrDates");
  });

  it("errors on duplicate ids and choice limits", () => {
    const issues = validateDrafts({
      stateText: "s",
      stateMode: "text",
      questions: [
        draft({ id: "dup", type: "noul" }),
        draft({ id: "dup", type: "noul" }),
        draft({
          id: "c",
          type: "choice",
          options: [
            { key: "a", rubric: "" },
            { key: "a", rubric: "" },
          ],
        }),
      ],
    });
    const rules = issues.map((i) => i.rule);
    expect(rules).toContain("duplicateId");
    expect(rules).toContain("choiceDuplicateOption");
  });

  it("suggests an exit option and rejects numeric score levels", () => {
    const issues = validateDrafts({
      stateText: "s",
      stateMode: "text",
      questions: [
        draft({ id: "c", type: "choice", options: [{ key: "billing", rubric: "" }] }),
        draft({ id: "s", type: "score", levels: ["0", "1"] }),
      ],
    });
    const rules = issues.map((i) => i.rule);
    expect(rules).toContain("choiceNoExit");
    expect(rules).toContain("scoreNumericLevels");
  });

  it("errors when score has fewer than 2 levels", () => {
    const issues = validateDrafts({
      stateText: "s",
      stateMode: "text",
      questions: [draft({ id: "s", type: "score", levels: ["only one"] })],
    });
    expect(issues.map((i) => i.rule)).toContain("scoreLevelCount");
    expect(isRunnable(issues)).toBe(false);
  });
});

describe("action bands", () => {
  it("maps confidence to auto / hitl / abstain", () => {
    expect(bandFor(0.95)).toBe("auto");
    expect(bandFor(0.9)).toBe("auto");
    expect(bandFor(0.5)).toBe("hitl");
    expect(bandFor(0.49)).toBe("abstain");
    expect(bandFor(0.2)).toBe("abstain");
  });

  it("computes noul certainty as 0.5 + |p - 0.5|", () => {
    expect(noulCertainty(0.5)).toBe(0.5);
    expect(noulCertainty(0.96)).toBeCloseTo(0.96);
    // p=0.02 is a strong NO: certainty is high on both extremes.
    expect(noulCertainty(0.02)).toBeCloseTo(0.98);
  });

  it("derives band and confidence from answers", () => {
    expect(answerConfidence({ type: "noul", noul: 0.96 })).toBeCloseTo(0.96);
    expect(answerBand({ type: "noul", noul: 0.96 })).toBe("auto");
    expect(answerBand({ type: "choice", choice: "a", probabilities: { a: 1 }, confidence: 0.2 })).toBe("abstain");
  });

  it("formats weighted scores with decimals only when needed", () => {
    expect(formatScoreAnswer({ type: "score", score: 2, legend: {}, probabilities: {}, confidence: 1 })).toBe("2");
    expect(formatScoreAnswer({ type: "score", score: 1.99, legend: {}, probabilities: {}, confidence: 1 })).toBe("1.99");
  });
});