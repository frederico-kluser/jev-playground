"use client";

import { useReducedMotion } from "motion/react";
import { AlertOctagon } from "lucide-react";
import { useLang } from "@/lib/i18n";
import {
  answerBand,
  answerConfidence,
  formatScoreAnswer,
  type Band,
  type DecisionsResponse,
  type WireAnswer,
} from "@/lib/jev";
import { formatPct } from "@/lib/metrics";
import { EmptyState, Panel } from "./ui";
import { ProgressBar } from "@/components/motion-ui/progress-bar";
import { Skeleton } from "@/components/motion-ui/skeleton";

const BAND_STYLE: Record<Band, string> = {
  auto: "border-band-auto/50 bg-band-auto/10 text-band-auto",
  hitl: "border-band-hitl/50 bg-band-hitl/10 text-band-hitl",
  abstain: "border-band-abstain/50 bg-band-abstain/10 text-band-abstain",
};

export function ResultsView({
  result,
  running,
  error,
}: {
  result: DecisionsResponse | null;
  running: boolean;
  error: string | null;
}) {
  const { t } = useLang();

  return (
    <Panel id="results" title={t.results.title}>
      {running ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-lg border border-band-abstain/40 bg-band-abstain/5 px-3 py-2.5">
          <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-band-abstain" aria-hidden />
          <p className="text-xs leading-relaxed">{error}</p>
        </div>
      ) : result ? (
        <div className="flex flex-col gap-3">
          {Object.entries(result.answers).map(([id, answer]) => (
            <AnswerCard key={id} id={id} answer={answer} />
          ))}
        </div>
      ) : (
        <EmptyState title={t.results.emptyTitle} body={t.results.emptyBody} />
      )}
    </Panel>
  );
}

function AnswerCard({ id, answer }: { id: string; answer: WireAnswer }) {
  const { t } = useLang();
  const reduce = useReducedMotion();
  const band = answerBand(answer);
  const confidence = answerConfidence(answer);
  const bandLabel =
    band === "auto" ? t.results.bandAuto : band === "hitl" ? t.results.bandHitl : t.results.bandAbstain;
  const bandHint =
    band === "auto" ? t.results.bandAutoHint : band === "hitl" ? t.results.bandHitlHint : t.results.bandAbstainHint;

  return (
    <article className="rounded-lg border border-border/60 bg-background/60 p-3.5">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border/70 px-2 py-0.5 font-mono text-[11px]">{id}</span>
          <span className="text-[11px] text-muted-foreground">
            {answer.type === "noul" ? t.builder.noulName : answer.type === "choice" ? t.builder.choiceName : t.builder.scoreName}
          </span>
        </div>
        <span
          title={bandHint}
          className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${BAND_STYLE[band]}`}
        >
          {bandLabel}
        </span>
      </header>

      <div className="mt-3 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {answer.type === "noul" ? t.results.probability : t.results.decision}
            </p>
            <p className="font-mono text-xl font-semibold tracking-tight">
              {answer.type === "noul"
                ? formatPct(answer.noul)
                : answer.type === "choice"
                  ? answer.choice
                  : formatScoreAnswer(answer)}
            </p>
          </div>
          {answer.type !== "noul" ? (
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t.results.confidence}</p>
              <p className="font-mono text-sm font-semibold">{formatPct(answer.confidence)}</p>
            </div>
          ) : (
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{t.results.certainty}</p>
              <p className="font-mono text-sm font-semibold">{formatPct(confidence)}</p>
            </div>
          )}
        </div>
        <p className="text-[10px] leading-relaxed text-muted-foreground">{t.results.confidenceNote}</p>

        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">{t.results.distribution}</p>
          {answer.type === "noul" ? (
            <>
              <ProbRow label="true" value={answer.noul} highlight={answer.noul >= 0.5} />
              <ProbRow label="false" value={1 - answer.noul} highlight={answer.noul < 0.5} />
            </>
          ) : answer.type === "choice" ? (
            Object.entries(answer.probabilities).map(([option, p]) => (
              <ProbRow key={option} label={option} value={p} highlight={option === answer.choice} />
            ))
          ) : (
            Object.entries(answer.probabilities).map(([level, p]) => (
              <ProbRow
                key={level}
                label={`${level} · ${answer.legend[level] ?? ""}`}
                value={p}
                highlight={Number(level) === Math.round(answer.score)}
              />
            ))
          )}
        </div>

        <details className="group">
          <summary className="inline-flex min-h-[32px] cursor-pointer items-center text-[11px] text-muted-foreground transition-colors hover:text-foreground">
            {t.results.rawAnswer}
          </summary>
          <pre className="mt-2 overflow-auto rounded-lg border border-border/50 bg-card/60 px-3 py-2 font-mono text-[11px] leading-relaxed">
            <code>{JSON.stringify(answer, null, 2)}</code>
          </pre>
        </details>
      </div>

      {reduce ? null : <span className="sr-only">{bandHint}</span>}
    </article>
  );
}

function ProbRow({ label, value, highlight }: { label: string; value: number; highlight: boolean }) {
  return (
    <ProgressBar
      value={value}
      reveal
      highlight={highlight}
      size="sm"
      progressbar
      aria-label={label}
      label={<span className="truncate font-mono text-[11px] text-muted-foreground">{label}</span>}
      valueLabel={<span className="font-mono text-[11px] tabular-nums">{formatPct(value)}</span>}
    />
  );
}