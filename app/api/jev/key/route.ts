/**
 * Same-origin proxy for key validation: forwards `GET /api/v1/key` to
 * OpenRouter with the visitor's key and returns the untouched JSON (label,
 * credit limit/remaining, usage). Metadata call: no credits consumed.
 */

import { KEY_CHECK_URL } from "@/lib/jev";

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

  let upstream: Response;
  try {
    upstream = await fetch(KEY_CHECK_URL, {
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