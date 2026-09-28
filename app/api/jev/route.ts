/**
 * Same-origin proxy for the OpenRouter Decisions endpoint.
 *
 * Why a proxy: browser `fetch` against OpenRouter can lose error bodies and
 * non-safelisted headers behind CORS. Here the browser talks to its own origin
 * (no CORS), this handler forwards to OpenRouter and reflects status, body and
 * the rate-limit/generation headers back in full. The API key is forwarded per
 * request and never stored server-side.
 */

import { DECISIONS_URL } from "@/lib/jev";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const PASS_THROUGH_HEADERS = ["x-generation-id", "retry-after", "x-ratelimit-remaining", "x-ratelimit-reset"];

function errorJson(status: number, message: string): Response {
  return Response.json({ error: { code: status, message } }, { status });
}

export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return errorJson(401, "Missing Authorization header (Bearer sk-or-v1-...).");
  }

  let body: string;
  try {
    body = await request.text();
    JSON.parse(body);
  } catch {
    return errorJson(400, "Request body must be valid JSON.");
  }

  const origin = request.headers.get("origin") ?? "https://jev-playground.vercel.app";

  let upstream: Response;
  try {
    upstream = await fetch(DECISIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
        // OpenRouter attribution headers (optional, harmless on this endpoint).
        "HTTP-Referer": origin,
        "X-OpenRouter-Title": "Jev Playground",
      },
      body,
      cache: "no-store",
    });
  } catch {
    return errorJson(502, "Could not reach OpenRouter. Retry shortly.");
  }

  const text = await upstream.text();
  const headers = new Headers({
    "Content-Type": upstream.headers.get("content-type") ?? "application/json",
    "Access-Control-Expose-Headers": PASS_THROUGH_HEADERS.join(", "),
  });
  for (const name of PASS_THROUGH_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  return new Response(text, { status: upstream.status, headers });
}