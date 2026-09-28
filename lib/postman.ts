/**
 * Export adapters: Postman collection v2.1 and cURL for the exact request the
 * playground would send to the OpenRouter Decisions endpoint.
 *
 * The collection inlines the JSON body (so it is readable in Postman's request
 * pane) and keeps the API key as a collection variable (`{{openrouter_api_key}}`)
 * so no secret is ever written to an exported file.
 */

import { DECISIONS_URL, type DecisionsRequest } from "./jev";

const SCHEMA_URL = "https://schema.getpostman.com/collection/json/v2.1.0/draft-07/collection.json";

type PostmanHeader = { key: string; value: string; type?: string };
type PostmanAuth = {
  type: string;
  bearer: { key: string; value: string; type: string }[];
};
type PostmanUrl = {
  raw: string;
  protocol: string;
  host: string[];
  path: string[];
};
type PostmanRequest = {
  method: string;
  header: PostmanHeader[];
  auth: PostmanAuth;
  body: { mode: string; raw: string; options: { raw: { language: string } } };
  url: PostmanUrl;
  description: string;
};
export type PostmanCollection = {
  info: { name: string; description: string; schema: string };
  item: { name: string; request: PostmanRequest; response: unknown[] }[];
  variable: { key: string; value: string; type: string }[];
};

function parseUrl(raw: string): PostmanUrl {
  const url = new URL(raw);
  return {
    raw,
    protocol: url.protocol.replace(":", ""),
    host: url.host.split("."),
    path: url.pathname.split("/").filter(Boolean),
  };
}

export function buildPostmanCollection(
  request: DecisionsRequest,
  meta: { locale: "en" | "pt"; appName: string },
): PostmanCollection {
  const body = JSON.stringify(request, null, 2);
  const description =
    meta.locale === "pt"
      ? [
          "Decisões tipadas com o modelo Jev (System One da TypeSafe) via OpenRouter.",
          "",
          "1. Defina a variável `openrouter_api_key` com a sua chave do OpenRouter.",
          "2. Envie o request. Saída é gratuita; cobra-se só o input (~US$ 0.042/Mtok).",
          "3. A resposta traz `answers` com probabilidades calibradas por pergunta.",
        ].join("\n")
      : [
          "Typed decisions from the Jev (TypeSafe System One) model via OpenRouter.",
          "",
          "1. Set the `openrouter_api_key` variable to your OpenRouter key.",
          "2. Send the request. Output is free; only input is billed (~$0.042/Mtok).",
          "3. The response carries `answers` with calibrated probabilities per question.",
        ].join("\n");

  return {
    info: {
      name: `${meta.appName} - Jev Decisions`,
      description,
      schema: SCHEMA_URL,
    },
    item: [
      {
        name: "Decisions request",
        request: {
          method: "POST",
          header: [
            { key: "Content-Type", value: "application/json", type: "text" },
            { key: "Authorization", value: "Bearer {{openrouter_api_key}}", type: "text" },
          ],
          auth: {
            type: "bearer",
            bearer: [{ key: "token", value: "{{openrouter_api_key}}", type: "string" }],
          },
          body: {
            mode: "raw",
            raw: body,
            options: { raw: { language: "json" } },
          },
          url: parseUrl(DECISIONS_URL),
          description,
        },
        response: [],
      },
    ],
    variable: [
      { key: "openrouter_api_key", value: "sk-or-REPLACE_ME", type: "string" },
    ],
  };
}

export function buildCurl(request: DecisionsRequest): string {
  const body = JSON.stringify(request, null, 2);
  return [
    `curl -X POST '${DECISIONS_URL}' \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -H 'Authorization: Bearer $OPENROUTER_API_KEY' \\`,
    `  -d '${body.replace(/'/g, `'\\''`)}'`,
  ].join("\n");
}

export function downloadFilename(request: DecisionsRequest): string {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const model = request.model.replace(/[^\w.-]/g, "_");
  return `jev-decisions-${model}-${stamp}.postman_collection.json`;
}