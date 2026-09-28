"use client";

import { Sparkles } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { EXAMPLE_IDS, type ExampleId } from "@/lib/examples";
import { Panel } from "./ui";

const LABEL_KEY: Record<ExampleId, { title: string; desc: string }> = {
  "ticket-triage": { title: "ticketTriage", desc: "ticketTriageDesc" },
  guardrail: { title: "guardrail", desc: "guardrailDesc" },
  moderation: { title: "moderation", desc: "moderationDesc" },
  "lead-scoring": { title: "leadScoring", desc: "leadScoringDesc" },
};

export function ExamplesStrip({ onLoad }: { onLoad: (id: ExampleId) => void }) {
  const { t } = useLang();
  const labels = t.examples as Record<string, string>;

  return (
    <Panel id="examples" title={t.examples.title} hint={t.examples.hint}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {EXAMPLE_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onLoad(id)}
            className="group flex min-h-[36px] flex-col items-start gap-1 rounded-lg border border-border/70 bg-background/60 px-3 py-2.5 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.99]"
          >
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
              {labels[LABEL_KEY[id].title]}
            </span>
            <span className="text-[11px] leading-relaxed text-muted-foreground">
              {labels[LABEL_KEY[id].desc]}
            </span>
          </button>
        ))}
      </div>
    </Panel>
  );
}