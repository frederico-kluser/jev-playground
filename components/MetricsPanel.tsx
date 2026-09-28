"use client";

import { History, Zap } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { formatMs, formatTokens, formatUsd, tokensPerSecond } from "@/lib/metrics";
import { GhostButton, Panel, StatTile } from "./ui";
import { Sparkline } from "@/components/motion-ui/sparkline";

export type RunRecord = {
  ts: number;
  latencyMs: number;
  cost?: number;
  inputTokens?: number;
  questions: number;
};

export type GenStats = {
  total_cost?: number;
  tokens_prompt?: number;
  tokens_completion?: number;
  latency?: number;
  generation_time?: number;
  [key: string]: unknown;
};

export function MetricsPanel({
  latencyMs,
  usage,
  resolvedModel,
  provider,
  generationId,
  questionCount,
  history,
  genStats,
  onFetchStats,
  onClearHistory,
  statsLoading,
}: {
  latencyMs: number | null;
  usage?: { cost?: number; input_tokens?: number; output_tokens?: number };
  resolvedModel?: string;
  provider?: string;
  generationId?: string;
  questionCount: number;
  history: RunRecord[];
  genStats: GenStats | null;
  onFetchStats: () => void;
  onClearHistory: () => void;
  statsLoading: boolean;
}) {
  const { t } = useLang();
  const latencyHistory = history.map((r) => r.latencyMs).slice(0, 20).reverse();
  const perDecision =
    usage?.cost !== undefined && questionCount > 0 ? usage.cost / questionCount : undefined;

  return (
    <Panel
      id="metrics"
      title={t.metrics.title}
      action={
        generationId ? (
          <GhostButton onClick={onFetchStats} disabled={statsLoading}>
            <Zap className="h-3.5 w-3.5" aria-hidden />
            {statsLoading ? "…" : t.metrics.statsFetch}
          </GhostButton>
        ) : null
      }
    >
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label={t.metrics.latency} value={latencyMs !== null ? formatMs(latencyMs) : "-"} />
        <StatTile label={t.metrics.inputTokens} value={formatTokens(usage?.input_tokens)} />
        <StatTile label={t.metrics.outputTokens} value={formatTokens(usage?.output_tokens)} />
        <StatTile label={t.metrics.cost} value={formatUsd(usage?.cost)} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span>
          {t.metrics.perDecision}: <span className="font-mono">{formatUsd(perDecision, 6)}</span>
        </span>
        <span>
          {t.metrics.throughput}:{" "}
          <span className="font-mono">{tokensPerSecond(usage?.input_tokens, latencyMs ?? undefined)}</span>
        </span>
        <span>
          {t.metrics.questionCount}: <span className="font-mono">{questionCount || "-"}</span>
        </span>
        {provider ? (
          <span>
            {t.metrics.provider}: <span className="font-mono">{provider}</span>
          </span>
        ) : null}
        {resolvedModel ? (
          <span>
            {t.metrics.resolvedModel}: <span className="font-mono">{resolvedModel}</span>
          </span>
        ) : null}
      </div>

      {genStats ? (
        <div className="mt-3 rounded-lg border border-border/50 bg-background/60 px-3 py-2">
          <p className="mb-1 text-[11px] font-medium text-muted-foreground">{t.metrics.stats}</p>
          <pre className="overflow-auto font-mono text-[11px] leading-relaxed">
            <code>{JSON.stringify(genStats, null, 2)}</code>
          </pre>
        </div>
      ) : null}

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <History className="h-3.5 w-3.5" aria-hidden />
            {t.metrics.history}
          </p>
          {history.length > 0 ? (
            <GhostButton onClick={onClearHistory}>{t.metrics.clearHistory}</GhostButton>
          ) : null}
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t.metrics.noHistory}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {latencyHistory.length > 1 ? (
              <Sparkline
                history={latencyHistory}
                area
                dot
                draw
                width={560}
                height={56}
                label={t.metrics.historyHint}
                className="w-full"
              />
            ) : null}
            <ul className="flex flex-col divide-y divide-border/40">
              {history.slice(0, 5).map((r) => (
                <li key={r.ts} className="flex items-center justify-between py-1.5 font-mono text-[11px]">
                  <span className="text-muted-foreground">
                    {new Date(r.ts).toLocaleTimeString()}
                  </span>
                  <span className="tabular-nums">
                    {formatMs(r.latencyMs)} · {r.questions} q · {formatUsd(r.cost)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Panel>
  );
}