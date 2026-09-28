/**
 * Same-origin proxy for `GET /api/v1/generation?id=…`: exact cost, tokens and
 * latency for one generation. The id comes from the response body (`id`), not
 * from the X-Generation-Id header, which browsers cannot read cross-origin.
 */

import { GENERATION_URL } from "@/lib/jev";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return Response.json(
      { error: { code: 401, message: "Missing Authorization header (Bearer sk-or-v1-...)." } },
      { status: 401 },
    );
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return Response.json(
      { error: { code: 400, message: "Query parameter `id` is required." } },
      { status: 400 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${GENERATION_URL}?id=${encodeURIComponent(id)}`, {
      headers: { Authorization: auth },
      cache: "no-store",
    });
  } catch {
    return Response.json(
      { error: { code: 502, message: "Could not reach OpenRouter." } },
      { status: 502 },
    );
  }

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
    },
  });
}