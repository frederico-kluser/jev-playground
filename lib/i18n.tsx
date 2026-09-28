"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { dict, type Dict, type Lang } from "./dict";
import { safeGet, safeSet } from "./storage";

// localStorage-backed external store. useSyncExternalStore is the canonical
// pattern: getServerSnapshot covers SSR/hydration and there is no setState in
// effects. Storage access goes through lib/storage, which never throws.

let currentLang: Lang = "en";
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  const stored = safeGet("jp-lang");
  if (stored === "pt" || stored === "en") currentLang = stored;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): Lang {
  return currentLang;
}

function getServerSnapshot(): Lang {
  return "en";
}

function persistLang(lang: Lang) {
  currentLang = lang;
  safeSet("jp-lang", lang);
  listeners.forEach((cb) => cb());
}

type LangContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
};

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setLang = useCallback((l: Lang) => persistLang(l), []);
  const value = useMemo<LangContextValue>(
    () => ({ lang, setLang, t: dict[lang] }),
    [lang, setLang],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>");
  return ctx;
}

/** Applies `lang` to <html lang> so screen readers pronounce content correctly. */
export function useHtmlLang() {
  const { lang } = useLang();
  useEffect(() => {
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
  }, [lang]);
}