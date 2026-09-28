"use client";

import { useLang } from "@/lib/i18n";
import { Field, Panel, TextArea } from "./ui";
import {
  SegmentedToggle,
  SegmentedToggleOption,
} from "@/components/motion-ui/segmented-toggle";

export type StateMode = "text" | "json";

export function StateEditor({
  mode,
  text,
  onMode,
  onText,
}: {
  mode: StateMode;
  text: string;
  onMode: (m: StateMode) => void;
  onText: (v: string) => void;
}) {
  const { t } = useLang();

  return (
    <Panel
      id="state"
      title={t.builder.stateTitle}
      hint={t.builder.stateHint}
      action={
        <SegmentedToggle
          value={mode}
          onChange={onMode}
          ariaLabel={t.builder.stateTitle}
          layoutId="state-mode-toggle"
          className="scale-90"
        >
          <SegmentedToggleOption value="text">{t.builder.stateModeText}</SegmentedToggleOption>
          <SegmentedToggleOption value="json">{t.builder.stateModeJson}</SegmentedToggleOption>
        </SegmentedToggle>
      }
    >
      <Field label={t.builder.stateTitle} htmlFor="state-input">
        <TextArea
          id="state-input"
          mono={mode === "json"}
          rows={mode === "json" ? 8 : 5}
          value={text}
          onChange={onText}
          ariaLabel={t.builder.stateTitle}
          placeholder={mode === "json" ? t.builder.statePlaceholderJson : t.builder.statePlaceholderText}
        />
      </Field>
    </Panel>
  );
}