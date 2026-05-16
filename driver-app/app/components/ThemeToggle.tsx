"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const activeTheme = resolvedTheme || theme;

  if (!mounted) {
    // El skeleton ahora coincide perfectamente con el tamaño del botón final
    return <div className="w-14 h-7 rounded-full bg-gray-200 dark:bg-zinc-700" />;
  }

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      aria-pressed={activeTheme === "dark"}
      onClick={() => setTheme(activeTheme === "dark" ? "light" : "dark")}
      className={`relative inline-flex h-7 w-14 items-center rounded-full p-1 border-2 border-zinc-950 bg-[rgba(207,255,4,0.08)] shadow-[4px_4px_0px_0px_#09090b] transition-transform duration-300 focus:outline-none focus:ring-4 focus:ring-brand/30 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] dark:border-2 dark:border-brand dark:bg-zinc-900 dark:shadow-[4px_4px_0px_0px_#CFFF04] dark:hover:-translate-y-1 dark:hover:shadow-[6px_6px_0px_0px_#CFFF04] ${activeTheme === "dark" ? "bg-zinc-900" : "bg-[rgba(207,255,4,0.08)]"}`}
    >
      <span className="sr-only">Switch theme</span>
      <span
        /* Cambiamos translate-x-6 por translate-x-7 para que recorra los 28px exactos */
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white border border-zinc-950 dark:bg-zinc-950 dark:border-brand transition-transform duration-300 ${activeTheme === "dark" ? "translate-x-7" : "translate-x-0"
          }`}
      >
        {activeTheme === "dark" ? <Moon className="w-3 h-3" strokeWidth={3.5} /> : <Sun className="w-3 h-3" strokeWidth={3.5} />}
      </span>
    </button>
  );
}