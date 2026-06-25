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
      className="inline-flex items-center gap-2 h-8 px-3 rounded-sharp border border-[rgba(156,163,175,0.3)] bg-transparent text-[#9CA3AF] text-xs font-bold uppercase tracking-wider transition-all duration-150 hover:text-white hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
    >
      <LogOut className="w-3.5 h-3.5" strokeWidth={2.5} />
      <span>Salir</span>
    </button>
  );
}
