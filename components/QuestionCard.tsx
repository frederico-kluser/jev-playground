"use client";

import { Plus, Trash2, X } from "lucide-react";
import { useLang } from "@/lib/i18n";
import type { QuestionDraft } from "@/lib/jev";
import { Field, GhostButton, TextArea, TextInput } from "./ui";

export function QuestionCard({
  draft,
  index,
  onChange,
  onRemove,
}: {
  draft: QuestionDraft;
  index: number;
  onChange: (patch: Partial<QuestionDraft>) => void;
  onRemove: () => void;
}) {
  const { t } = useLang();

  const typeName =
    draft.type === "noul" ? t.builder.noulName : draft.type === "choice" ? t.builder.choiceName : t.builder.scoreName;
  const typeDesc =
    draft.type === "noul" ? t.builder.noulDesc : draft.type === "choice" ? t.builder.choiceDesc : t.builder.scoreDesc;
  const placeholder =
    draft.type === "noul"
      ? t.builder.qInstructionsPlaceholderNoul
      : draft.type === "choice"
        ? t.builder.qInstructionsPlaceholderChoice
        : t.builder.qInstructionsPlaceholderScore;

  return (
    <article className="rounded-xl border border-border/70 bg-background/60 p-3.5">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {typeName}
          </span>
          <span className="hidden text-[11px] text-muted-foreground sm:inline">{typeDesc}</span>
        </div>
        <GhostButton onClick={onRemove} title={t.builder.removeQuestion} aria-label={t.builder.removeQuestion}>
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </GhostButton>
      </header>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[140px_1fr]">
          <Field label={t.builder.qId} helper={t.builder.qIdHint} htmlFor={`q-id-${index}`}>
            <TextInput
              id={`q-id-${index}`}
              mono
              value={draft.id}
              onChange={(v) => onChange({ id: v })}
              placeholder={`q${index + 1}`}
            />
          </Field>
          <Field label={t.builder.qInstructions} htmlFor={`q-inst-${index}`}>
            <TextArea
              id={`q-inst-${index}`}
              rows={2}
              value={draft.instructions}
              onChange={(v) => onChange({ instructions: v })}
              placeholder={placeholder}
            />
          </Field>
        </div>

        {draft.type === "noul" ? (
          <div className="rounded-lg border border-border/50 p-3">
            <p className="mb-2 text-[11px] font-medium text-muted-foreground">{t.builder.criteriaOptional}</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={t.builder.criteriaTrue} htmlFor={`q-true-${index}`}>
                <TextInput
                  id={`q-true-${index}`}
                  value={draft.criteriaTrue}
                  onChange={(v) => onChange({ criteriaTrue: v })}
                />
              </Field>
              <Field label={t.builder.criteriaFalse} htmlFor={`q-false-${index}`}>
                <TextInput
                  id={`q-false-${index}`}
                  value={draft.criteriaFalse}
                  onChange={(v) => onChange({ criteriaFalse: v })}
                />
              </Field>
            </div>
          </div>
        ) : null}

        {draft.type === "choice" ? (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-medium text-muted-foreground">
              {t.builder.criteriaOption} ({draft.options.length}/255)
            </p>
            {draft.options.map((opt, optIndex) => (
              <div key={optIndex} className="grid grid-cols-1 gap-2 sm:grid-cols-[150px_1fr_auto]">
                <TextInput
                  mono
                  value={opt.key}
                  aria-label={t.builder.optionKey}
                  placeholder={t.builder.optionKey}
                  onChange={(v) => {
                    const options = draft.options.map((o, i) => (i === optIndex ? { ...o, key: v } : o));
                    onChange({ options });
                  }}
                />
                <TextInput
                  value={opt.rubric}
                  aria-label={t.builder.optionRubric}
                  placeholder={t.builder.optionRubric}
                  onChange={(v) => {
                    const options = draft.options.map((o, i) => (i === optIndex ? { ...o, rubric: v } : o));
                    onChange({ options });
                  }}
                />
                <GhostButton
                  title={t.builder.removeOption}
                  aria-label={t.builder.removeOption}
                  onClick={() => onChange({ options: draft.options.filter((_, i) => i !== optIndex) })}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </GhostButton>
              </div>
            ))}
            <GhostButton
              className="self-start"
              onClick={() =>
                onChange({ options: [...draft.options, { key: `option_${draft.options.length + 1}`, rubric: "" }] })
              }
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {t.builder.addOption}
            </GhostButton>
          </div>
        ) : null}

        {draft.type === "score" ? (
          <div className="flex flex-col gap-2">
            <p className="text-[11px] font-medium text-muted-foreground">
              {t.builder.levels} ({draft.levels.length}/10)
            </p>
            {draft.levels.map((level, levelIndex) => (
              <div key={levelIndex} className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                <span className="font-mono text-[11px] text-muted-foreground">{levelIndex}</span>
                <TextInput
                  value={level}
                  placeholder={t.builder.levelPlaceholder}
                  aria-label={`${t.builder.levels} ${levelIndex}`}
                  onChange={(v) => {
                    const levels = draft.levels.map((l, i) => (i === levelIndex ? v : l));
                    onChange({ levels });
                  }}
                />
                <GhostButton
                  title={t.builder.removeLevel}
                  aria-label={t.builder.removeLevel}
                  onClick={() => onChange({ levels: draft.levels.filter((_, i) => i !== levelIndex) })}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </GhostButton>
              </div>
            ))}
            <GhostButton
              className="self-start"
              onClick={() => onChange({ levels: [...draft.levels, `Level ${draft.levels.length}`] })}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              {t.builder.addLevel}
            </GhostButton>
          </div>
        ) : null}
      </div>
    </article>
  );
}