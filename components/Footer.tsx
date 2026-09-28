"use client";

import { useLang } from "@/lib/i18n";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="mt-10 border-t border-border/60">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-1 px-4 py-6 text-xs text-muted-foreground">
        <p>{t.footer.privacy}</p>
        <p>{t.footer.pricing}</p>
        <p>{t.footer.notAffiliated}</p>
      </div>
    </footer>
  );
}