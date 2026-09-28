"use client";

import { KeyRound, Languages, Monitor, Moon, Sun, Code2, BookOpen } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { useTheme, type ThemeChoice } from "@/lib/theme";
import { maskKey } from "@/lib/metrics";
import { GhostButton } from "./ui";
import {
  SegmentedToggle,
  SegmentedToggleOption,
} from "@/components/motion-ui/segmented-toggle";

const THEME_ICON: Record<ThemeChoice, React.ReactNode> = {
  light: <Sun className="h-3.5 w-3.5" />,
  dark: <Moon className="h-3.5 w-3.5" />,
  system: <Monitor className="h-3.5 w-3.5" />,
};

export function TopBar({
  apiKey,
  onForget,
}: {
  apiKey: string | null;
  onForget: () => void;
}) {
  const { lang, setLang, t } = useLang();
  const { choice, cycle } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary font-mono text-xs font-bold text-primary-foreground"
          >
            J
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold tracking-tight">{t.app.name}</p>
            <p className="hidden truncate text-[11px] text-muted-foreground sm:block">{t.app.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {apiKey ? (
            <span className="hidden items-center gap-2 rounded-full border border-border/70 bg-card px-2.5 py-1 font-mono text-[11px] text-muted-foreground md:inline-flex">
              <KeyRound className="h-3 w-3" aria-hidden />
              {maskKey(apiKey)}
            </span>
          ) : null}

          <SegmentedToggle
            value={lang}
            onChange={setLang}
            ariaLabel={t.top.langLabel}
            layoutId="lang-toggle"
            className="scale-90"
          >
            <SegmentedToggleOption value="en">{t.top.langEn}</SegmentedToggleOption>
            <SegmentedToggleOption value="pt">{t.top.langPt}</SegmentedToggleOption>
          </SegmentedToggle>

          <GhostButton onClick={cycle} title={choice} aria-label={choice}>
            {THEME_ICON[choice]}
          </GhostButton>

          <a
            href="https://docs.typesafe.ai/introduction"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex items-center gap-1.5"
          >
            <BookOpen className="h-3.5 w-3.5" aria-hidden />
            {t.top.docs}
          </a>

          <a
            href="https://github.com/frederico-kluser/jev-playground"
            target="_blank"
            rel="noreferrer"
            className="hidden rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex items-center gap-1.5"
          >
            <Code2 className="h-3.5 w-3.5" aria-hidden />
            {t.top.github}
          </a>

          {apiKey ? (
            <GhostButton onClick={onForget} title={t.keyStatus.forget}>
              {t.keyStatus.forget}
            </GhostButton>
          ) : null}
        </div>
      </div>
    </header>
  );
}

export function LanguagesIcon() {
  return <Languages className="h-3.5 w-3.5" />;
}