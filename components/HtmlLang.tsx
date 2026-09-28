"use client";

// Client boundary: applies the active language to <html lang> for screen
// readers. A hook cannot run inside a Server Component module.
import { useHtmlLang } from "@/lib/i18n";

export function HtmlLang({ children }: { children: React.ReactNode }) {
  useHtmlLang();
  return <>{children}</>;
}