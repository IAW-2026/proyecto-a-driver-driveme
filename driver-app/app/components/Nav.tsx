"use client"

import { UserButton } from "@clerk/nextjs";

export default function Nav() {
  return (
    <nav className="flex justify-between items-center mb-8 border-b pb-4">
      <h1 className="text-2xl font-bold">DriveMe - Panel del Conductor</h1>
      <UserButton />
    </nav>
  );
}