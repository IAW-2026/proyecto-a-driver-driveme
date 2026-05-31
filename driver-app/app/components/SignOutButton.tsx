"use client";
import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

export default function SignOutButton() {
  const { signOut } = useClerk();

  return (
    <button
      type="button"
      aria-label="Cerrar sesión"
      onClick={() => signOut({ redirectUrl: "/sign-in" })}
      className="inline-flex items-center gap-2 h-7 px-3 rounded-full border-2 border-zinc-950 bg-white text-zinc-950 text-xs font-bold shadow-[4px_4px_0px_0px_#09090b] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_#09090b] focus:outline-none focus:ring-4 focus:ring-zinc-300 dark:border-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:shadow-[4px_4px_0px_0px_#e4e4e7] dark:hover:shadow-[6px_6px_0px_0px_#e4e4e7]"
    >
      <LogOut className="w-3.5 h-3.5" strokeWidth={2.5} />
      <span>Salir</span>
    </button>
  );
}
