import { describe, expect, it } from "vitest";
import { estimateCost, formatMs, formatTokens, formatUsd, maskKey, tokensPerSecond } from "./metrics";

describe("format helpers", () => {
  it("formats latency", () => {
    expect(formatMs(231.4)).toBe("231 ms");
    expect(formatMs(1234)).toBe("1.23 s");
    expect(formatMs(Number.NaN)).toBe("-");
  });

  it("formats money with sensible precision", () => {
    expect(formatUsd(0)).toBe("$0");
    expect(formatUsd(0.000019992)).toBe("$0.00002");
    expect(formatUsd(undefined)).toBe("-");
    expect(formatUsd(1.5, 2)).toBe("$1.50");
  });

  it("formats tokens and throughput", () => {
    expect(formatTokens(476)).toBe("476");
    expect(tokensPerSecond(476, 330)).toBe("1442/s");
    expect(tokensPerSecond(undefined, 330)).toBe("-");
  });

  it("estimates cost from input tokens at $0.042/Mtok", () => {
    expect(estimateCost(1_000_000)).toBeCloseTo(0.042);
    expect(estimateCost(500)).toBeCloseTo(0.000021);
    expect(estimateCost(undefined)).toBeUndefined();
  });

  it("masks keys without leaking the secret", () => {
    const masked = maskKey("sk-or-v1-0123456789abcdef0123456789abcdef");
    expect(masked.startsWith("sk-or-v1-0")).toBe(true);
    expect(masked.endsWith("cdef")).toBe(true);
    expect(masked.length).toBeLessThan(20);
    expect(maskKey("short")).toBe("••••");
  });
});