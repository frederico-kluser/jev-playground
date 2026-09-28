import { describe, expect, it } from "vitest";
import { buildCurl, buildPostmanCollection, downloadFilename } from "./postman";
import type { DecisionsRequest } from "./jev";

const request: DecisionsRequest = {
  model: "typesafe/jev-1.13",
  state: "Checkout shows a white screen after clicking Pay.",
  questions: {
    is_bug: { type: "noul", instructions: "Does the customer report a defect?" },
    team: {
      type: "choice",
      instructions: "Which team?",
      criteria: { frontend: "Rendering", other: null },
    },
  },
};

describe("buildPostmanCollection", () => {
  const collection = buildPostmanCollection(request, { locale: "en", appName: "Jev Playground" });

  it("is a valid v2.1 collection skeleton", () => {
    expect(collection.info.schema).toContain("v2.1.0");
    expect(collection.info.schema).toContain("schema.getpostman.com");
    expect(collection.info.name).toContain("Jev Playground");
    expect(collection.item).toHaveLength(1);
    expect(collection.item[0].request.method).toBe("POST");
  });

  it("targets the Decisions endpoint with bearer auth from a variable", () => {
    const req = collection.item[0].request;
    expect(req.url.raw).toBe("https://openrouter.ai/api/alpha/decisions");
    expect(req.auth.type).toBe("bearer");
    expect(req.auth.bearer[0].value).toBe("{{openrouter_api_key}}");
    expect(req.header.some((h) => h.key === "Authorization")).toBe(true);
  });

  it("inlines the JSON body and never embeds a real key", () => {
    const raw = collection.item[0].request.body.raw;
    expect(collection.item[0].request.body.mode).toBe("raw");
    expect(JSON.parse(raw)).toEqual(request);
    expect(JSON.stringify(collection)).not.toContain("sk-or-v1-");
    expect(collection.variable).toContainEqual({
      key: "openrouter_api_key",
      value: "sk-or-REPLACE_ME",
      type: "string",
    });
  });

  it("localizes the description", () => {
    const pt = buildPostmanCollection(request, { locale: "pt", appName: "Jev Playground" });
    expect(pt.info.description).toContain("Decisões tipadas");
  });
});

describe("buildCurl", () => {
  it("produces a runnable curl with env-var key and full body", () => {
    const curl = buildCurl(request);
    expect(curl).toContain("curl -X POST 'https://openrouter.ai/api/alpha/decisions'");
    expect(curl).toContain("Authorization: Bearer $OPENROUTER_API_KEY");
    expect(curl).toContain('"is_bug"');
  });
});

describe("downloadFilename", () => {
  it("sanitizes the model id and stamps the date", () => {
    expect(downloadFilename(request)).toMatch(/^jev-decisions-typesafe_jev-1\.13-\d{4}-\d{2}-\d{2}/);
  });
});