"use client";

import { AlertOctagon, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import type { Issue } from "@/lib/jev";
import { IssueDot, Panel } from "./ui";

function fmt(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_m, key: string) => String(params[key] ?? ""));
}

export function IssuesPanel({ issues }: { issues: Issue[] }) {
  const { t } = useLang();
  const errors = issues.filter((i) => i.level === "error").length;
  const warnings = issues.filter((i) => i.level === "warning").length;
  const tips = issues.filter((i) => i.level === "tip").length;
  const clean = issues.length === 0;
  const messages = t.issues as Record<string, string>;

  const summary = clean
    ? t.issues.clean
    : [
        errors ? `${errors} ${t.issues.errors}` : "",
        warnings ? `${warnings} ${t.issues.warnings}` : "",
        tips ? `${tips} ${t.issues.tips}` : "",
      ]
        .filter(Boolean)
        .join(" · ");

  return (
    <Panel
      id="issues"
      title={t.issues.title}
      action={
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          {clean ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-band-auto" aria-hidden />
          ) : errors ? (
            <AlertOctagon className="h-3.5 w-3.5 text-band-abstain" aria-hidden />
          ) : warnings ? (
            <AlertTriangle className="h-3.5 w-3.5 text-band-hitl" aria-hidden />
          ) : (
            <Info className="h-3.5 w-3.5 text-primary" aria-hidden />
          )}
          {summary}
        </span>
      }
    >
      {clean ? (
        <p className="text-xs text-muted-foreground">{t.issues.clean}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {issues.map((issue, index) => (
            <li key={`${issue.rule}-${index}`} className="flex gap-2 text-xs leading-relaxed">
              <IssueDot level={issue.level} />
              <span>
                {issue.questionId ? (
                  <span className="mr-1.5 rounded-full border border-border/70 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {issue.questionId}
                  </span>
                ) : null}
                {fmt(messages[issue.rule] ?? issue.rule, issue.params)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}