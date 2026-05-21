"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPin, User, Car, DollarSign, Wallet } from "lucide-react";
import Image from "next/image";

interface SidebarProps {
  rol: 'ADMIN' | 'CONDUCTOR_NUEVO' | 'CONDUCTOR_ACTIVO';
}

export default function Sidebar({ rol }: SidebarProps) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  const desktopLinkClass = (href: string) =>
    `flex items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-200 ${isActive(href)
      ? 'bg-brand text-zinc-950 font-bold border-zinc-950 shadow-[4px_4px_0px_0px_#09090b] dark:border-brand dark:shadow-[4px_4px_0px_0px_#CFFF04]'
      : 'border-zinc-950 bg-white text-zinc-950 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#09090b] dark:hover:shadow-[4px_4px_0px_0px_#CFFF04]'
    }`;

  const mobileLinkClass = (href: string) =>
    `flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl transition-all duration-200 ${isActive(href)
      ? 'bg-brand text-zinc-950 font-extrabold border-2 border-zinc-950 shadow-[2px_2px_0px_0px_#09090b] dark:border-brand dark:shadow-[2px_2px_0px_0px_#CFFF04] -translate-y-1'
      : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
    }`;

  return (
    <>
      {/* VISTA PC: Sidebar Neobrutalista */}
      <aside className="hidden md:flex md:fixed md:left-0 md:top-0 md:h-full md:w-64 border-r-4 border-zinc-950 dark:border-brand flex-col bg-white dark:bg-zinc-950 transition-colors duration-300">

        {/* --- BLOQUE CON EL LOGO --- */}
        <div className="p-6 border-b-4 border-zinc-950 dark:border-brand flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="Logo DriveMe"
            width={36}
            height={36}
            className="rounded-lg border-2 border-zinc-950 shadow-[2px_2px_0px_0px_#09090b] dark:border-[#CFFF04] dark:shadow-[2px_2px_0px_0px_#CFFF04]"
          />
          <span className="text-2xl font-extrabold tracking-tight text-zinc-950 dark:text-white uppercase">
            DriveMe
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-3">
          <Link href="/" className={desktopLinkClass("/")}>
            <Home className="h-5 w-5" strokeWidth={3} />
            <span className="font-bold">Inicio</span>
          </Link>

          {rol === 'ADMIN' && (
            <>
              <Link href="/admin/flota" className={desktopLinkClass("/admin/flota")}>
                <Car className="h-5 w-5" strokeWidth={3} />
                <span className="font-bold">Gestión de Flota</span>
              </Link>
              <Link href="/admin/reportes" className={desktopLinkClass("/admin/reportes")}>
                <DollarSign className="h-5 w-5" strokeWidth={3} />
                <span className="font-bold">Reportes</span>
              </Link>
            </>
          )}

          {rol === 'CONDUCTOR_ACTIVO' && (
            <>
              <Link href="/historial" className={desktopLinkClass("/historial")}>
                <Car className="h-5 w-5" strokeWidth={3} />
                <span className="font-bold">Mis Viajes</span>
              </Link>
              <Link href="/billetera" className={desktopLinkClass("/billetera")}>
                <Wallet className="h-5 w-5" strokeWidth={3} />
                <span className="font-bold">Mi Billetera</span>
              </Link>
              <Link href="/perfil" className={desktopLinkClass("/perfil")}>
                <User className="h-5 w-5" strokeWidth={3} />
                <span className="font-bold">Mi Perfil</span>
              </Link>
            </>
          )}
        </nav>
      </aside>

      {/* VISTA MÓVIL: Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t-4 border-zinc-950 bg-white dark:bg-zinc-950 dark:border-brand dark:text-white flex justify-center h-20 z-50">
        <div className="flex w-full h-full max-w-md items-center justify-between gap-2 px-3">

          <Link href="/" className={mobileLinkClass("/")}>
            <Home className="h-5 w-5" strokeWidth={3} />
            <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Inicio</span>
          </Link>

          {/* Menú Móvil ADMIN */}
          {rol === 'ADMIN' && (
            <>
              <Link href="/admin/flota" className={mobileLinkClass("/admin/flota")}>
                <Car className="h-5 w-5" strokeWidth={3} />
                <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Flota</span>
              </Link>
              <Link href="/admin/reportes" className={mobileLinkClass("/admin/reportes")}>
                <DollarSign className="h-5 w-5" strokeWidth={3} />
                <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Reportes</span>
              </Link>
            </>
          )}

          {/* Menú Móvil CONDUCTOR */}
          {rol === 'CONDUCTOR_ACTIVO' && (
            <>
              <Link href="/historial" className={mobileLinkClass("/historial")}>
                <MapPin className="h-5 w-5" strokeWidth={3} />
                <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Viajes</span>
              </Link>
              <Link href="/billetera" className={mobileLinkClass("/billetera")}>
                <Wallet className="h-5 w-5" strokeWidth={3} />
                <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Billetera</span>
              </Link>
              <Link href="/perfil" className={mobileLinkClass("/perfil")}>
                <User className="h-5 w-5" strokeWidth={3} />
                <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">Perfil</span>
              </Link>
            </>
          )}

        </div>
      </nav>
    </>
  );
}
