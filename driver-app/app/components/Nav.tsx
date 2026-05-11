"use client"

import { UserButton } from "@clerk/nextjs";

export default function Nav() {
  return (
    <nav className="flex justify-between items-center mb-8 border-b pb-4" style={{ borderColor: "var(--border)" }}>
      <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>DriveMe - Panel del Conductor</h1>
      <UserButton />
    </nav>
  );
}