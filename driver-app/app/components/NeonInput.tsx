import { InputHTMLAttributes } from "react";

export default function NeonInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full md:w-auto rounded-2xl border-2 border-zinc-950 bg-[rgba(207,255,4,0.08)] px-4 py-3 text-sm font-semibold text-[var(--foreground)] outline-none transition-transform duration-200 shadow-[4px_4px_0px_0px_#09090b] hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] dark:border-2 dark:border-brand dark:bg-zinc-950 dark:shadow-[4px_4px_0px_0px_#CFFF04] dark:hover:-translate-y-1 dark:hover:shadow-[6px_6px_0px_0px_#CFFF04] ${className}`}
    />
  );
}
