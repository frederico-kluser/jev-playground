"use client";

import { Plus } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { JEV_MODELS, newQuestion, type QuestionDraft } from "@/lib/jev";
import { EmptyState, Field, GhostButton, Panel, TextInput } from "./ui";
import { QuestionCard } from "./QuestionCard";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionPanel,
} from "@/components/motion-ui/accordion";

export function QuestionBuilder({
  questions,
  model,
  sessionId,
  user,
  onAdd,
  onChange,
  onRemove,
  onModel,
  onSessionId,
  onUser,
}: {
  questions: QuestionDraft[];
  model: string;
  sessionId: string;
  user: string;
  onAdd: (type: "noul" | "choice" | "score") => void;
  onChange: (index: number, patch: Partial<QuestionDraft>) => void;
  onRemove: (index: number) => void;
  onModel: (v: string) => void;
  onSessionId: (v: string) => void;
  onUser: (v: string) => void;
}) {
  const { t } = useLang();

  return (
    <Panel
      id="questions"
      title={t.builder.questionsTitle}
      hint={t.builder.questionsHint}
      action={
        <div className="flex flex-wrap items-center gap-1.5">
          <GhostButton onClick={() => onAdd("noul")}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {t.builder.addNoul}
          </GhostButton>
          <GhostButton onClick={() => onAdd("choice")}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {t.builder.addChoice}
          </GhostButton>
          <GhostButton onClick={() => onAdd("score")}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            {t.builder.addScore}
          </GhostButton>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        {questions.length === 0 ? (
          <EmptyState title={t.builder.emptyTitle} body={t.builder.emptyBody} />
        ) : (
          questions.map((q, index) => (
            <QuestionCard
              key={index}
              draft={q}
              index={index}
              onChange={(patch) => onChange(index, patch)}
              onRemove={() => onRemove(index)}
            />
          ))
        )}

        <Accordion className="rounded-lg border border-border/50 px-3">
          <AccordionItem value="advanced" className="border-b-0">
            <AccordionTrigger className="py-2.5 text-xs font-medium">
              {t.builder.advancedTitle}
            </AccordionTrigger>
            <AccordionPanel className="pb-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label={t.builder.modelLabel} htmlFor="model-select">
                  <select
                    id="model-select"
                    value={model}
                    onChange={(e) => onModel(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                  >
                    {JEV_MODELS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={t.builder.sessionId} helper={t.builder.sessionIdHint} htmlFor="session-input">
                  <TextInput
                    id="session-input"
                    mono
                    value={sessionId}
                    onChange={onSessionId}
                    maxLength={256}
                    placeholder="session-1234"
                  />
                </Field>
                <Field label={t.builder.userId} helper={t.builder.userIdHint} htmlFor="user-input">
                  <TextInput id="user-input" mono value={user} onChange={onUser} maxLength={256} placeholder="user-42" />
                </Field>
              </div>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </div>
    </Panel>
  );
}

export { newQuestion };