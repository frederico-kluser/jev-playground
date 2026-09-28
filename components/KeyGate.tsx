"use client";

import { useState } from "react";
import { ArrowRight, ShieldCheck, ExternalLink, Eye, EyeOff } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Field, GhostButton, TextInput } from "./ui";
import { MultiStateButton } from "@/components/motion-ui/multi-state-button";
import {
  StaggerReveal,
  StaggerRevealHeadline,
  StaggerRevealItem,
} from "@/components/motion-ui/stagger-reveal";

export type KeyInfo = {
  label?: string | null;
  limit?: number | null;
  limit_remaining?: number | null;
  usage?: number | null;
  is_free_tier?: boolean;
};

export function KeyGate({
  onReady,
}: {
  onReady: (key: string, info: KeyInfo | null) => void;
}) {
  const { t } = useLang();
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<"idle" | "validating">("idle");
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const headline = `${t.app.tagline}.`;

  async function validate(skip = false) {
    const trimmed = key.trim();
    if (!trimmed) {
      setError(t.gate.errorEmpty);
      return;
    }
    setError(null);
    if (skip) {
      onReady(trimmed, null);
      return;
    }
    setStatus("validating");
    try {
      const res = await fetch("/api/jev/key", {
        headers: { Authorization: `Bearer ${trimmed}` },
      });
      const body = (await res.json().catch(() => null)) as
        | { data?: KeyInfo; error?: { message?: string } }
        | null;
      if (res.ok && body?.data) {
        onReady(trimmed, body.data);
        return;
      }
      setError(res.status === 401 ? t.gate.errorInvalid : (body?.error?.message ?? t.gate.errorInvalid));
    } catch {
      setError(t.gate.errorNetwork);
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="mx-auto grid min-h-[calc(100dvh-3.5rem)] max-w-[1400px] grid-cols-1 items-center gap-10 px-4 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-16">
      <StaggerReveal className="max-w-[46ch]">
        <StaggerRevealHeadline
          as="h1"
          className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
        >
          {headline}
        </StaggerRevealHeadline>
        <StaggerRevealItem as="p" className="mt-5 max-w-[52ch] text-base leading-relaxed text-muted-foreground">
          {t.gate.sub}
        </StaggerRevealItem>
        <StaggerRevealItem as="p" className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-band-auto" aria-hidden />
          {t.footer.pricing}
        </StaggerRevealItem>
        <StaggerRevealItem as="p" className="mt-2">
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            {t.gate.openrouterLink}
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </StaggerRevealItem>
      </StaggerReveal>

      <div className="w-full rounded-xl border border-border/70 bg-card p-5 shadow-sm lg:p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void validate(false);
          }}
          className="flex flex-col gap-4"
        >
          <h2 className="text-sm font-semibold tracking-tight">{t.gate.title}</h2>
          <Field
            label={t.gate.label}
            helper={t.gate.stored}
            error={error ?? undefined}
            htmlFor="openrouter-key"
          >
            <div className="relative">
              <TextInput
                id="openrouter-key"
                type={reveal ? "text" : "password"}
                mono
                autoComplete="off"
                spellCheck={false}
                value={key}
                onChange={setKey}
                placeholder={t.gate.placeholder}
                aria-invalid={Boolean(error)}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setReveal((r) => !r)}
                aria-label={reveal ? "Hide key" : "Show key"}
                title={reveal ? "Hide key" : "Show key"}
                className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {reveal ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              </button>
            </div>
          </Field>

          <div className="flex flex-wrap items-center gap-3">
            <MultiStateButton
              type="submit"
              state={status}
              feedback="pop"
              disabled={status === "validating"}
              pillClassName="rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm"
              announce={status === "validating" ? t.gate.validating : undefined}
            >
              <span className="inline-flex items-center gap-2">
                {status === "validating" ? t.gate.validating : t.gate.validate}
                {status === "validating" ? null : <ArrowRight className="h-4 w-4" aria-hidden />}
              </span>
            </MultiStateButton>
            <GhostButton onClick={() => void validate(true)}>{t.gate.continueAnyway}</GhostButton>
          </div>

          <p className="text-xs text-muted-foreground">{t.gate.safety}</p>
        </form>
      </div>
    </div>
  );
}