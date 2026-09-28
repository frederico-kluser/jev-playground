"use client";

// Client boundary for the Motion UI theme: `defineTheme()` in motion.theme.ts is
// a client function and cannot be evaluated inside a Server Component module.
import { MotionUIThemeProvider } from "@/components/motion-ui/ui-theme";
import motionTheme from "@/motion.theme";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionUIThemeProvider theme={motionTheme}>{children}</MotionUIThemeProvider>;
}