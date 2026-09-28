# Jev Playground

**Typed decisions in milliseconds.** A friendly web workbench for the [Jev](https://openrouter.ai/typesafe/jev-1.13) decision model (TypeSafe's System One model) via [OpenRouter](https://openrouter.ai): compose a state and typed questions, run them, and read calibrated probabilities with latency, tokens and cost. Then export the exact request as Postman or cURL.

> Português? Veja o resumo em [PT-BR](#pt-br) abaixo.

---

## What you can do

- **Connect your OpenRouter key** with one-step validation (`GET /api/v1/key`). The key is kept only in your browser; requests go from your machine to OpenRouter.
- **Build a request visually**: state as text or JSON, plus any number of typed questions:
  - `noul` (yes/no): probability of yes, 0 to 1.
  - `choice`: one option of up to 255, with the full probability distribution.
  - `score`: ordered scale of 2 to 10 levels, probability-weighted.
- **Check before you spend**: offline concept validation flags empty state, invalid JSON, compound questions, text-generation asks, math/date asks, missing "other" options and numeric score levels.
- **See the decision properly**: full distributions (not just the winner), confidence, and an action band per answer (auto / human review / abstain), with a transparency note: confidence describes the distribution, it does not guarantee correctness.
- **See the numbers**: latency, input/output tokens, cost, cost per decision, throughput, resolved model, provider, run history and optional generation stats.
- **Inspect and export the request**: JSON body, request model, cURL, and a Postman v2.1 collection with the key shipped as a `{{openrouter_api_key}}` variable.
- **Bilingual UI** (English / Português) and light/dark themes.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

No environment variables needed: bring your own OpenRouter key from [openrouter.ai/keys](https://openrouter.ai/keys) (create it with a credit limit; never reuse a production key).

Quality gates:

```bash
npm run check      # typecheck + eslint + vitest (28 tests)
```

## Deploy on Vercel

This is a standard Next.js app with same-origin route handlers, so it deploys to Vercel as-is:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/frederico-kluser/jev-playground)

Or from the CLI: `npx vercel --prod`. No environment variables are required.

## How it works

The browser never talks to OpenRouter cross-origin. Small same-origin proxies forward each call and reflect status, body and rate-limit headers back in full (so error bodies are never lost to CORS):

| Route | Forwards to | Purpose |
| --- | --- | --- |
| `POST /api/jev` | `POST https://openrouter.ai/api/alpha/decisions` | Run decisions |
| `GET /api/jev/key` | `GET https://openrouter.ai/api/v1/key` | Validate key, show credit limit |
| `GET /api/jev/generation?id=…` | `GET /api/v1/generation?id=…` | Exact per-generation stats |

The API key is forwarded per request and never stored server-side.

## Request model

`POST https://openrouter.ai/api/alpha/decisions` with `Authorization: Bearer <OPENROUTER_API_KEY>`:

| Field | Type | Notes |
| --- | --- | --- |
| `model` | string | `typesafe/jev-1.13` or the `~typesafe/jev-latest` alias |
| `state` | string, object or array | Judged once, shared by all questions |
| `questions` | map of id to question | All questions are evaluated in parallel |
| `questions.*.type` | `noul` or `choice` or `score` | |
| `questions.*.instructions` | string | The full question; the map key never reaches the model |
| `questions.*.criteria` | varies | `noul`: optional `{"true"…, "false"…}` strings. `choice`: option to rubric (`string` or `null`), max 255. `score`: 2 to 10 ordered level descriptions |
| `session_id` | string (optional) | Max 256 chars, observability grouping |
| `user` | string (optional) | Max 256 chars, end-user id |

Response: `answers` (typed per question: `noul` carries only the probability; `choice` and `score` add `probabilities` and `confidence`), `id`, `model` (resolved version), `provider`, `usage` (`input_tokens`, `output_tokens`, `cost` in USD).

**Pricing**: output is free; input is US$ 0.042 per million tokens. A 3-question decision around 500 input tokens costs about US$ 0.00002.

## Examples

The playground ships with four one-click examples: **ticket triage**, **prompt-injection guardrail**, **content moderation** and **lead scoring**. Example content is in English (Jev is most accurate there); the UI itself stays in your language.

Minimal request:

```json
{
  "model": "typesafe/jev-1.13",
  "state": "Checkout shows a white screen after clicking Pay.",
  "questions": {
    "is_bug": {
      "type": "noul",
      "instructions": "Does the customer report a defect?",
      "criteria": { "true": "Describes broken behaviour", "false": "Is a question or a request" }
    },
    "team": {
      "type": "choice",
      "instructions": "Which team should handle it?",
      "criteria": {
        "frontend": "Rendering and UI issues",
        "payments": "Checkout and billing",
        "other": "None of the above"
      }
    },
    "urgency": {
      "type": "score",
      "instructions": "How urgent is this?",
      "criteria": ["Can wait for the next release", "Should be handled this week", "Blocking revenue right now"]
    }
  }
}
```

Real response (captured from a live run):

```json
{
  "model": "typesafe/jev-1.13-20260917",
  "answers": {
    "is_bug": { "type": "noul", "noul": 0.97 },
    "team": {
      "type": "choice",
      "choice": "payments",
      "probabilities": { "frontend": 0.34, "payments": 0.66, "other": 0 },
      "confidence": 0.49
    },
    "urgency": {
      "type": "score",
      "score": 2,
      "legend": {
        "0": "Can wait for the next release",
        "1": "Should be handled this week",
        "2": "Blocking revenue right now"
      },
      "probabilities": { "0": 0, "1": 0, "2": 1 },
      "confidence": 0.99
    }
  },
  "id": "gen-dec-…",
  "provider": "TypeSafe",
  "usage": { "input_tokens": 424, "output_tokens": 70, "cost": 0.000017808 }
}
```

Reading it: `is_bug` lands in the **auto** band (certainty 0.97), `urgency` too (confidence 0.99), while `team` falls in **abstain** (confidence 0.49 on a 0.66/0.34 split) and should escalate to a human or a deeper model. Round trip was about 350 ms end to end.

## Notes and limits

- Jev never generates text. Ask discrete, enumerable questions; keep math, counting and dates in code.
- `noul` has no `confidence` field: the binary distribution is the answer. Certainty shown in the UI is `0.5 + |p - 0.5|`.
- English performs best; Portuguese works but has no official multilingual evaluation, so calibrate thresholds on your own data.
- This is an independent community tool. Not affiliated with TypeSafe AI or OpenRouter.

## Stack

Next.js 16 (App Router, Route Handlers) · React 19 · Tailwind CSS v4 · Motion / Motion UI · TypeScript · Vitest.

UX audit of the interface: [docs/ux-audit.json](docs/ux-audit.json).

## License

[MIT](LICENSE)

---

# PT-BR

**Decisões tipadas em milissegundos.** Um playground web amigável para o modelo de decisão [Jev](https://openrouter.ai/typesafe/jev-1.13) (System One da TypeSafe) via [OpenRouter](https://openrouter.ai): monte um estado e perguntas tipadas, execute e leia probabilidades calibradas com latência, tokens e custo. Depois exporte o request exato como Postman ou cURL.

## O que dá para fazer

- **Conectar sua chave do OpenRouter** com validação em um passo. A chave fica só no seu navegador; os requests saem da sua máquina para o OpenRouter.
- **Montar o request visualmente**: estado em texto ou JSON e perguntas tipadas (`noul` sim/não, `choice` com distribuição completa, `score` com régua de 2 a 10 níveis).
- **Verificar antes de gastar**: validação de conceitos offline (perguntas compostas, pedidos de texto, contas/datas, opção `other` ausente, níveis numéricos).
- **Ver a decisão direito**: distribuições completas, confiança e banda de ação por resposta (auto / revisão humana / abstém-se), com nota de transparência.
- **Ver os números**: latência, tokens de entrada/saída, custo, custo por decisão, vazão, modelo resolvido, provider, histórico e estatísticas da geração.
- **Inspecionar e exportar**: corpo JSON, modelo do request, cURL e coleção Postman v2.1 (chave como variável `{{openrouter_api_key}}`).
- **Interface bilíngue** (EN/PT) e temas claro/escuro.

## Início rápido

```bash
npm install
npm run dev        # http://localhost:3000
```

Sem variáveis de ambiente: use sua chave do [openrouter.ai/keys](https://openrouter.ai/keys) (crie com limite de crédito; não reutilize chave de produção).

```bash
npm run check      # typecheck + eslint + vitest
```

## Preço e limites

Saída é gratuita; entrada custa US$ 0,042 por milhão de tokens. O Jev não gera texto: faça perguntas discretas e enumeráveis e mantenha contas/datas em código. Português funciona, mas sem avaliação multilíngue oficial: calibre limiares nos seus dados.

Ferramenta comunitária independente. Sem afiliação com TypeSafe AI ou OpenRouter. [MIT](LICENSE).