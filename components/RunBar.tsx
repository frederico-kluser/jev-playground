"use client";

import { Play, Loader2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { MultiStateButton } from "@/components/motion-ui/multi-state-button";

export function RunBar({
  hasKey,
  runnable,
  running,
  onRun,
  compact = false,
}: {
  hasKey: boolean;
  runnable: boolean;
  running: boolean;
  onRun: () => void;
  compact?: boolean;
}) {
  const { t } = useLang();

  const state = running ? "running" : !hasKey ? "nokey" : runnable ? "ready" : "blocked";
  const label = running
    ? t.run.running
    : !hasKey
      ? t.run.needsKey
      : runnable
        ? t.run.run
        : t.run.fixErrors;

  return (
    <div
      className={
        compact
          ? "flex items-center justify-between gap-3"
          : "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm"
      }
    >
      <MultiStateButton
        state={state}
        feedback="pop"
        onClick={onRun}
        disabled={!hasKey || !runnable || running}
        pillClassName="rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm"
        surfaceClassName={
          state === "ready"
            ? "bg-primary text-primary-foreground"
            : state === "running"
              ? "bg-primary/80 text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
        }
        announce={label}
      >
        <span className="inline-flex items-center gap-2">
          {running ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Play className="h-4 w-4" aria-hidden />
          )}
          {label}
        </span>
      </MultiStateButton>
      {compact ? null : <p className="text-[11px] text-muted-foreground">{t.run.thresholdNote}</p>}
    </div>
  );
}