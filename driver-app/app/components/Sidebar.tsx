"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Home, MapPin, User, Car, DollarSign } from "lucide-react";
import Image from "next/image";

interface SidebarProps {
  rol: 'ADMIN' | 'CONDUCTOR_NUEVO' | 'CONDUCTOR_ACTIVO';
}

export default function Sidebar({ rol }: SidebarProps) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  const desktopLinkClass = (href: string) =>
    `flex items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-200 ${isActive(href)
      ? 'bg-zinc-950 text-brand font-bold border-zinc-950 shadow-[4px_4px_0px_0px_#09090b] dark:border-brand dark:shadow-[4px_4px_0px_0px_#CFFF04]'
      : 'border-zinc-950 bg-white text-zinc-950 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#09090b] dark:hover:shadow-[4px_4px_0px_0px_#CFFF04]'
    }`;

  const mobileLinkClass = (href: string) =>
    `flex-1 flex flex-col items-center justify-center gap-1 px-2 h-full transition-all duration-200 ${isActive(href)
      ? 'bg-zinc-950 text-zinc-950 font-bold border-2 border-zinc-950 shadow-[4px_4px_0px_0px_#09090b] dark:border-brand dark:shadow-[4px_4px_0px_0px_#CFFF04]'
      : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'
    }`;

  return (
    <>
      {/* VISTA PC: Sidebar Neobrutalista */}
      <aside className="hidden md:flex md:fixed md:left-0 md:top-0 md:h-full md:w-64 border-r-4 border-zinc-950 dark:border-brand flex-col bg-white dark:bg-zinc-950 transition-colors duration-300">

        {/* --- BLOQUE ACTUALIZADO CON EL LOGO --- */}
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
            {/* El ícono ya no tiene color fijo, hereda del padre */}
            <Home className="h-5 w-5" />
            <span className="font-bold">Inicio</span>
          </Link>

          {rol === 'ADMIN' && (
            <>
              <Link href="/admin/flota" className={desktopLinkClass("/admin/flota")}>
                <Car className="h-5 w-5" />
                <span className="font-bold">Gestión de Flota</span>
              </Link>
              <Link href="/admin/reportes" className={desktopLinkClass("/admin/reportes")}>
                <DollarSign className="h-5 w-5" />
                <span className="font-bold">Reportes</span>
              </Link>
            </>
          )}

          {rol === 'CONDUCTOR_ACTIVO' && (
            <>
              <Link href="/historial" className={desktopLinkClass("/historial")}>
                <MapPin className="h-5 w-5" />
                <span className="font-bold">Mis Viajes</span>
              </Link>
              <Link href="/perfil" className={desktopLinkClass("/perfil")}>
                <User className="h-5 w-5" />
                <span className="font-bold">Mi Perfil</span>
              </Link>
            </>
          )}
        </nav>

        {/* Sección de usuario ajustada a Tailwind */}
        <div className="p-4 border-t-4 border-zinc-950 dark:border-brand flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 transition-colors duration-300">
          <UserButton />
          <span className="text-sm font-bold text-zinc-950 dark:text-white">Mi Cuenta</span>
        </div>
      </aside>

      {/* VISTA MÓVIL: Bottom Navigation Neobrutalista */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t-4 border-zinc-950 bg-white dark:bg-zinc-950 dark:border-brand flex justify-around items-center h-20 z-50">
        <Link href="/" className={mobileLinkClass("/")}>
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Inicio</span>
        </Link>

        {rol === 'CONDUCTOR_ACTIVO' && (
          <>
            <Link href="/historial" className={mobileLinkClass("/historial")}>
              <MapPin className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Viajes</span>
            </Link>

            <Link href="/perfil" className={mobileLinkClass("/perfil")}>
              <User className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Perfil</span>
            </Link>
          </>
        )}

        {/* Contenedor estático de Clerk */}
        <div className="flex-1 flex flex-col items-center justify-center gap-1 px-2 h-full text-zinc-500 dark:text-zinc-400">
          <UserButton />
          <span className="text-[10px] font-bold uppercase tracking-wider">Cuenta</span>
        </div>
      </nav>
    </>
  );
}