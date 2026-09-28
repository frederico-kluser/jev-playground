"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { safeGet, safeSet } from "./storage";

// Theme store: light / dark / system, persisted like the language. The `dark`
// class on <html> is what every token block in globals.css keys off.

export type ThemeChoice = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

let currentChoice: ThemeChoice = "system";
const listeners = new Set<() => void>();

if (typeof window !== "undefined") {
  const stored = safeGet("jp-theme");
  if (stored === "light" || stored === "dark" || stored === "system") currentChoice = stored;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): ThemeChoice {
  return currentChoice;
}

function getServerSnapshot(): ThemeChoice {
  return "system";
}

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function resolveTheme(choice: ThemeChoice): ResolvedTheme {
  return choice === "system" ? systemTheme() : choice;
}

function apply(choice: ThemeChoice) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(choice);
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.style.colorScheme = resolved;
}

function setChoice(choice: ThemeChoice) {
  currentChoice = choice;
  safeSet("jp-theme", choice);
  apply(choice);
  listeners.forEach((cb) => cb());
}

type ThemeContextValue = {
  choice: ThemeChoice;
  resolved: ResolvedTheme;
  setChoice: (c: ThemeChoice) => void;
  /** Cycles light -> dark -> system. */
  cycle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const choice = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    apply(choice);
    if (choice !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => apply("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [choice]);

  const cycle = useCallback(() => {
    setChoice(currentChoice === "light" ? "dark" : currentChoice === "dark" ? "system" : "light");
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ choice, resolved: resolveTheme(choice), setChoice, cycle }),
    [choice, cycle],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

/**
 * Inline bootstrap snippet: sets the `dark` class before first paint so the
 * page never flashes the wrong theme. Keep in sync with `apply()` above.
 */
export const themeBootstrap = `(function(){try{var c=localStorage.getItem("jp-theme");if(c!=="light"&&c!=="dark"&&c!=="system"){c="system"}var d=c==="dark"||(c==="system"&&!(window.matchMedia&&window.matchMedia("(prefers-color-scheme: light)").matches));var e=document.documentElement;e.classList.toggle("dark",d);e.style.colorScheme=d?"dark":"light"}catch(e){}})();`;