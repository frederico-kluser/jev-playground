/**
 * Formatting helpers for the metrics strip: latency, tokens, money, throughput.
 */

export function formatMs(ms: number): string {
  if (!Number.isFinite(ms)) return "-";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatUsd(value: number | undefined | null, digits = 5): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return "-";
  if (value === 0) return "$0";
  return `$${value.toFixed(digits)}`;
}

export function formatTokens(value: number | undefined | null): string {
  if (value === undefined || value === null || !Number.isFinite(value)) return "-";
  return value.toLocaleString("en-US");
}

export function formatPct(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

/** Tokens per second from observed input tokens and round-trip latency. */
export function tokensPerSecond(tokens: number | undefined, ms: number | undefined): string {
  if (!tokens || !ms || ms <= 0) return "-";
  return `${(tokens / (ms / 1000)).toFixed(0)}/s`;
}

/** Cost estimate for a request when the API does not report `usage.cost`. */
export function estimateCost(inputTokens: number | undefined, pricePerMtok = 0.042): number | undefined {
  if (!inputTokens) return undefined;
  return (inputTokens / 1_000_000) * pricePerMtok;
}

export function maskKey(key: string): string {
  const trimmed = key.trim();
  if (trimmed.length <= 12) return "••••";
  return `${trimmed.slice(0, 10)}…${trimmed.slice(-4)}`;
}