"use client";

import { useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { useLang } from "@/lib/i18n";
import type { DecisionsRequest } from "@/lib/jev";
import { buildCurl, buildPostmanCollection, downloadFilename } from "@/lib/postman";
import { Panel, GhostButton } from "./ui";
import { CopyButton } from "@/components/motion-ui/copy-button";
import {
  SmoothTabs,
  SmoothTabsList,
  SmoothTabsTab,
  SmoothTabsPanels,
  SmoothTabsPanel,
} from "@/components/motion-ui/smooth-tabs";

export function RequestInspector({
  request,
  onNotify,
}: {
  request: DecisionsRequest;
  onNotify?: (message: string) => void;
}) {
  const { t, lang } = useLang();
  const [tab, setTab] = useState("body");

  const body = JSON.stringify(request, null, 2);
  const curl = buildCurl(request);
  const collection = buildPostmanCollection(request, {
    locale: lang,
    appName: t.app.name,
  });
  const collectionJson = JSON.stringify(collection, null, 2);
  const fields = t.inspector.modelFields as readonly { field: string; desc: string }[];

  function downloadCollection() {
    const blob = new Blob([collectionJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadFilename(request);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onNotify?.(t.inspector.download);
  }

  return (
    <Panel id="inspector" title={t.inspector.title} hint={t.inspector.hint}>
      <SmoothTabs value={tab} onValueChange={setTab} className="flex flex-col gap-3">
        <SmoothTabsList ariaLabel={t.inspector.title}>
          <SmoothTabsTab value="body">{t.inspector.tabBody}</SmoothTabsTab>
          <SmoothTabsTab value="model">{t.inspector.tabModel}</SmoothTabsTab>
          <SmoothTabsTab value="curl">{t.inspector.tabCurl}</SmoothTabsTab>
          <SmoothTabsTab value="postman">{t.inspector.tabPostman}</SmoothTabsTab>
        </SmoothTabsList>

        <SmoothTabsPanels>
          <SmoothTabsPanel value="body">
            <CodeShell
              code={body}
              copyLabel={t.inspector.copy}
              copiedLabel={t.inspector.copied}
              footer={`${body.length.toLocaleString("en-US")} B · POST https://openrouter.ai/api/alpha/decisions`}
            />
          </SmoothTabsPanel>

          <SmoothTabsPanel value="model">
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">{t.inspector.modelIntro}</p>
              <dl className="flex flex-col divide-y divide-border/50">
                {fields.map((f) => (
                  <div key={f.field} className="grid grid-cols-1 gap-1 py-2 sm:grid-cols-[220px_1fr] sm:gap-4">
                    <dt className="font-mono text-xs font-medium text-primary">{f.field}</dt>
                    <dd className="text-xs leading-relaxed text-muted-foreground">{f.desc}</dd>
                  </div>
                ))}
              </dl>
              <a
                href="https://docs.typesafe.ai/api"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-primary hover:underline"
              >
                docs.typesafe.ai/api
                <ExternalLink className="h-3 w-3" aria-hidden />
              </a>
            </div>
          </SmoothTabsPanel>

          <SmoothTabsPanel value="curl">
            <div className="flex flex-col gap-2">
              <CodeShell code={curl} copyLabel={t.inspector.copy} copiedLabel={t.inspector.copied} />
              <p className="text-xs text-muted-foreground">{t.inspector.curlHint}</p>
            </div>
          </SmoothTabsPanel>

          <SmoothTabsPanel value="postman">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">{t.inspector.postmanHint}</p>
                <GhostButton onClick={downloadCollection}>
                  <Download className="h-3.5 w-3.5" aria-hidden />
                  {t.inspector.download}
                </GhostButton>
              </div>
              <CodeShell code={collectionJson} copyLabel={t.inspector.copy} copiedLabel={t.inspector.copied} />
            </div>
          </SmoothTabsPanel>
        </SmoothTabsPanels>
      </SmoothTabs>
    </Panel>
  );
}

function CodeShell({
  code,
  copyLabel,
  copiedLabel,
  footer,
}: {
  code: string;
  copyLabel: string;
  copiedLabel: string;
  footer?: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-background/70">
      <div className="flex items-center justify-between border-b border-border/50 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">json</span>
        <CopyButton
          value={code}
          variant="label"
          copiedText={copiedLabel}
          className="rounded-md px-2 py-1 text-[11px]"
        >
          {copyLabel}
        </CopyButton>
      </div>
      <pre className="max-h-80 overflow-auto px-3 py-2.5 font-mono text-[11px] leading-relaxed">
        <code>{code}</code>
      </pre>
      {footer ? (
        <div className="border-t border-border/50 px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  );
}