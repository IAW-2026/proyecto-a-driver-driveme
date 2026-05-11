"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

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
      /* Agregamos h-7 y w-14 fijos, y p-1 uniforme */
      className={`relative inline-flex h-7 w-14 items-center rounded-full p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-teal-400 ${activeTheme === "dark" ? "bg-zinc-800" : "bg-sky-100"
        }`}
    >
      <span className="sr-only">Switch theme</span>
      <span
        /* Cambiamos translate-x-6 por translate-x-7 para que recorra los 28px exactos */
        className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ${activeTheme === "dark" ? "translate-x-7" : "translate-x-0"
          }`}
      >
        {activeTheme === "dark" ? "🌙" : "☀️"}
      </span>
    </button>
  );
}