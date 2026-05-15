"use client"

import Image from "next/image";


export default function Nav() {
  return (
    <header className="md:hidden flex flex-wrap items-center justify-between gap-4 px-4 py-4 bg-white dark:bg-zinc-950 border-b-4 border-zinc-950 dark:border-brand">
      <div className="flex items-center gap-4">
        <div className="rounded-md border-2 border-zinc-950 shadow-[2px_2px_0px_0px_#09090b] dark:border-brand dark:shadow-[2px_2px_0px_0px_#CFFF04]">
          <Image src="/images/logo.png" alt="DriveMe logo" width={40} height={40} />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.24em] font-bold text-zinc-950 dark:text-white">DRIVEME</p>
        </div>
      </div>

      <div className="flex items-center">
      </div>
    </header>
  );
}

