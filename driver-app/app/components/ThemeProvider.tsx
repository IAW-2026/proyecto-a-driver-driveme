"use client";

/**
 * ThemeProvider — Simplified to a pass-through wrapper.
 * Dark mode is the only mode. This component remains for backward compatibility
 * with any code that may still reference it, but does nothing.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}