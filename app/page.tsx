"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { safeGetJson, safeRemove, safeSetJson, safeGet, safeSet } from "@/lib/storage";
import {
  buildRequest,
  newQuestion,
  validateDrafts,
  isRunnable,
  type DecisionsResponse,
  type QuestionDraft,
} from "@/lib/jev";
import { EXAMPLES, type Draft, type ExampleId } from "@/lib/examples";
import { maskKey } from "@/lib/metrics";
import { TopBar } from "@/components/TopBar";
import { KeyGate, type KeyInfo } from "@/components/KeyGate";
import { ExamplesStrip } from "@/components/ExamplesStrip";
import { StateEditor } from "@/components/StateEditor";
import { QuestionBuilder } from "@/components/QuestionBuilder";
import { IssuesPanel } from "@/components/IssuesPanel";
import { RunBar } from "@/components/RunBar";
import { ResultsView } from "@/components/ResultsView";
import { MetricsPanel, type GenStats, type RunRecord } from "@/components/MetricsPanel";
import { RequestInspector } from "@/components/RequestInspector";
import { Footer } from "@/components/Footer";
import { useToasts } from "@/components/Toasts";

const LS = {
  key: "jp-key",
  keyInfo: "jp-key-info",
  draft: "jp-draft",
  history: "jp-history",
} as const;

/** Sample triage request so the first Run works out of the box. */
const SAMPLE: Draft = EXAMPLES["ticket-triage"];

export default function PlaygroundPage() {
  const { t } = useLang();
  const { notify, renderToastStack } = useToasts();

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keyInfo, setKeyInfo] = useState<KeyInfo | null>(null);
  const [draft, setDraft] = useState<Draft>(SAMPLE);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<DecisionsResponse | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<RunRecord[]>([]);
  const [genStats, setGenStats] = useState<GenStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const loaded = useRef(false);

  // Hydrate persisted session after mount (localStorage is client-only). The
  // restore runs as a microtask: still before paint, but not synchronously
  // inside the effect body (no cascading renders).
  useEffect(() => {
    let alive = true;
    queueMicrotask(() => {
      if (!alive) return;
      const storedKey = safeGet(LS.key);
      if (storedKey) setApiKey(storedKey);
      const storedInfo = safeGetJson<KeyInfo>(LS.keyInfo);
      if (storedInfo) setKeyInfo(storedInfo);
      const storedDraft = safeGetJson<Draft>(LS.draft);
      if (storedDraft?.questions) setDraft(storedDraft);
      const storedHistory = safeGetJson<RunRecord[]>(LS.history);
      if (storedHistory) setHistory(storedHistory);
      loaded.current = true;
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (loaded.current) safeSetJson(LS.draft, draft);
  }, [draft]);

  useEffect(() => {
    if (loaded.current) safeSetJson(LS.history, history);
  }, [history]);

  const issues = useMemo(
    () => validateDrafts({ stateText: draft.stateText, stateMode: draft.stateMode, questions: draft.questions }),
    [draft],
  );
  const runnable = isRunnable(issues);

  const request = useMemo(
    () =>
      buildRequest({
        model: draft.model,
        stateText: draft.stateText,
        stateMode: draft.stateMode,
        questions: draft.questions,
        sessionId: draft.sessionId,
        user: draft.user,
      }),
    [draft],
  );

  const handleReady = useCallback(
    (key: string, info: KeyInfo | null) => {
      setApiKey(key);
      setKeyInfo(info);
      safeSet(LS.key, key);
      safeSetJson(LS.keyInfo, info);
      notify(t.gate.connected);
    },
    [notify, t],
  );

  const handleForget = useCallback(() => {
    setApiKey(null);
    setKeyInfo(null);
    safeRemove(LS.key);
    safeRemove(LS.keyInfo);
    setResult(null);
    setLatencyMs(null);
  }, []);

  const mapError = useCallback(
    (status: number, body: { error?: { message?: string } } | null): string => {
      const byStatus: Record<number, string> = {
        400: t.errors.e400,
        401: t.errors.e401,
        402: t.errors.e402,
        403: t.errors.e403,
        404: t.errors.e404,
        413: t.errors.e413,
        422: t.errors.e422,
        429: t.errors.e429,
      };
      if (byStatus[status]) return byStatus[status];
      if (status >= 500) return t.errors.e5xx;
      return body?.error?.message ?? t.errors.generic;
    },
    [t],
  );

  const run = useCallback(async () => {
    if (!apiKey || !runnable || running) return;
    setRunning(true);
    setError(null);
    setGenStats(null);
    const started = performance.now();
    try {
      const res = await fetch("/api/jev", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(request),
      });
      const elapsed = performance.now() - started;
      const body = (await res.json().catch(() => null)) as
        | (DecisionsResponse & { error?: { message?: string } })
        | null;
      if (!res.ok || body?.error) {
        setError(mapError(res.status, body));
        notify(t.errors.generic);
        return;
      }
      setResult(body);
      setLatencyMs(elapsed);
      setHistory((prev) =>
        [
          {
            ts: Date.now(),
            latencyMs: elapsed,
            cost: body?.usage?.cost,
            inputTokens: body?.usage?.input_tokens,
            questions: Object.keys(request.questions).length,
          },
          ...prev,
        ].slice(0, 20),
      );
      notify(t.run.done);
    } catch {
      setError(t.errors.network);
      notify(t.errors.network);
    } finally {
      setRunning(false);
    }
  }, [apiKey, runnable, running, request, mapError, notify, t]);

  const fetchStats = useCallback(async () => {
    if (!apiKey || !result?.id) return;
    setStatsLoading(true);
    try {
      const res = await fetch(`/api/jev/generation?id=${encodeURIComponent(result.id)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const body = (await res.json().catch(() => null)) as GenStats | null;
      if (res.ok && body) setGenStats(body);
      else notify(t.errors.generic);
    } catch {
      notify(t.errors.network);
    } finally {
      setStatsLoading(false);
    }
  }, [apiKey, result, notify, t]);

  const patchQuestion = useCallback((index: number, patch: Partial<QuestionDraft>) => {
    setDraft((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    }));
  }, []);

  const loadExample = useCallback(
    (id: ExampleId) => {
      const next = EXAMPLES[id];
      const dirty = JSON.stringify(draft) !== JSON.stringify(SAMPLE);
      if (dirty && !window.confirm(t.examples.confirm)) return;
      setDraft(next);
      setResult(null);
      setLatencyMs(null);
      setError(null);
      notify(t.examples.loaded);
    },
    [draft, notify, t],
  );

  // Power-user shortcut: Ctrl/Cmd+Enter runs the request from anywhere.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && apiKey && runnable && !running) {
        event.preventDefault();
        void run();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [apiKey, runnable, running, run]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <TopBar apiKey={apiKey} onForget={handleForget} />

      {!apiKey ? (
        <KeyGate onReady={handleReady} />
      ) : (
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-28 pt-5 lg:pb-5">
          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span className="font-mono">{maskKey(apiKey)}</span>
            {keyInfo?.label ? (
              <span>
                {t.keyStatus.label}: {keyInfo.label}
              </span>
            ) : null}
            {keyInfo && keyInfo.limit_remaining !== undefined && keyInfo.limit_remaining !== null ? (
              <span>
                {t.keyStatus.remaining}: ${keyInfo.limit_remaining.toFixed(2)}
              </span>
            ) : null}
            {keyInfo?.is_free_tier !== undefined ? (
              <span>
                {t.keyStatus.freeTier}: {keyInfo.is_free_tier ? t.keyStatus.yes : t.keyStatus.no}
              </span>
            ) : null}
          </div>

          <ExamplesStrip onLoad={loadExample} />

          <div className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <StateEditor
                mode={draft.stateMode}
                text={draft.stateText}
                onMode={(stateMode) => setDraft((p) => ({ ...p, stateMode }))}
                onText={(stateText) => setDraft((p) => ({ ...p, stateText }))}
              />
              <QuestionBuilder
                questions={draft.questions}
                model={draft.model}
                sessionId={draft.sessionId}
                user={draft.user}
                onAdd={(type) => setDraft((p) => ({ ...p, questions: [...p.questions, newQuestion(type)] }))}
                onChange={patchQuestion}
                onRemove={(index) =>
                  setDraft((p) => ({ ...p, questions: p.questions.filter((_, i) => i !== index) }))
                }
                onModel={(model) => setDraft((p) => ({ ...p, model }))}
                onSessionId={(sessionId) => setDraft((p) => ({ ...p, sessionId }))}
                onUser={(user) => setDraft((p) => ({ ...p, user }))}
              />
            </div>

            <div className="flex flex-col gap-4">
              <RunBar hasKey={Boolean(apiKey)} runnable={runnable} running={running} onRun={() => void run()} />
              <IssuesPanel issues={issues} />
              <ResultsView result={result} running={running} error={error} />
              <MetricsPanel
                latencyMs={latencyMs}
                usage={result?.usage}
                resolvedModel={result?.model}
                provider={result?.provider}
                generationId={result?.id}
                questionCount={Object.keys(request.questions).length}
                history={history}
                genStats={genStats}
                onFetchStats={() => void fetchStats()}
                onClearHistory={() => setHistory([])}
                statsLoading={statsLoading}
              />
            </div>
          </div>

          <div className="mt-4">
            <RequestInspector request={request} onNotify={notify} />
          </div>
        </main>
      )}

      {apiKey ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 px-4 py-2.5 backdrop-blur-md lg:hidden">
          <RunBar compact hasKey={Boolean(apiKey)} runnable={runnable} running={running} onRun={() => void run()} />
        </div>
      ) : null}

      <Footer />
      {renderToastStack()}
    </div>
  );
}