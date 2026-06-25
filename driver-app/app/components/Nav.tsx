"use client"

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, MapPin, User, CarFront, DollarSign, Wallet, Shield, BarChart } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { checkActiveRideClient } from "@/app/actions/conductor/checkActiveRideClient";


interface SidebarProps {
  rol: 'ADMIN' | 'CONDUCTOR_NUEVO' | 'CONDUCTOR_ACTIVO' | 'CONDUCTOR_SUSPENDIDO';
  nombre?: string;
}

export default function Sidebar({ rol, nombre }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = (href: string) => pathname === href;
  const { user } = useUser();
  
  const displayName = nombre || user?.firstName || "PILOTO";

  useEffect(() => {
    if (rol === 'CONDUCTOR_ACTIVO' && !pathname.startsWith('/viaje/')) {
      checkActiveRideClient().then((res) => {
        if (res.activeViajeId) {
          router.replace(`/viaje/${res.activeViajeId}`);
        }
      });
    }
  }, [pathname, router, rol]);

  // Estilos del Top Nav inspirados en el screenshot (Star Wars Space Cockpit)
  const desktopLinkClass = (href: string) =>
    `flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-sci text-xs ${isActive(href)
      ? 'bg-[rgba(220,38,38,0.15)] text-primary border border-primary shadow-[0_0_15px_rgba(220,38,38,0.3)]'
      : 'text-[#9CA3AF] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
    }`;

  const mobileLinkClass = (href: string) =>
    `flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-card transition-all duration-150 font-sci ${isActive(href)
      ? 'bg-gradient-to-b from-primary-hover to-primary text-white shadow-[0_0_12px_rgba(220,38,38,0.25)] -translate-y-0.5'
      : 'text-[#9CA3AF] hover:text-white'
    }`;

  const controlPlaneUrl = process.env.NEXT_PUBLIC_CONTROL_PLANE_APP_URL || "https://etapa-3-control-plane-driveme.vercel.app/";
  const analyticsUrl = process.env.NEXT_PUBLIC_ANALYTICS_DASHBOARD_URL || "https://etapa-3-analytics-dashboard-driveme.vercel.app/";

  return (
    <>
      {/* DESKTOP: Top Navigation — Galactic Command */}
      <header className="hidden md:flex fixed top-0 w-full h-20 border-b border-[rgba(220,38,38,0.25)] bg-[rgba(10,10,10,0.85)] backdrop-blur-md z-50 px-8 items-center justify-between">

        {/* --- Logo Block --- */}
        <div className="flex items-center gap-4 z-10">
          <div className="flex flex-col">
             <span className="text-[10px] text-[#9CA3AF] font-sans">Bienvenido de vuelta</span>
             <span className="text-sm font-sci tracking-widest text-primary drop-shadow-[0_0_8px_rgba(220,38,38,0.6)] uppercase">
               {displayName}
             </span>
          </div>
        </div>

        {/* --- Center Nav Links --- */}
        <nav className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
          <Link href="/" className={desktopLinkClass("/")}>
            <Home className="h-4 w-4" strokeWidth={2} />
            <span>INICIO</span>
          </Link>

          {rol === 'ADMIN' && (
            <>
              <Link href="/admin/flota" className={desktopLinkClass("/admin/flota")}>
                <CarFront className="h-4 w-4" strokeWidth={2} />
                <span>FLOTA</span>
              </Link>
              <Link href="/admin/reportes" className={desktopLinkClass("/admin/reportes")}>
                <DollarSign className="h-4 w-4" strokeWidth={2} />
                <span>REPORTES</span>
              </Link>
              <a href={analyticsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-sci text-xs text-[#9CA3AF] hover:text-white hover:bg-[rgba(255,255,255,0.05)]">
                <BarChart className="h-4 w-4" strokeWidth={2} />
                <span>ANALYTICS</span>
              </a>
              <a href={controlPlaneUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 font-sci text-xs text-[#9CA3AF] hover:text-white hover:bg-[rgba(255,255,255,0.05)]">
                <Shield className="h-4 w-4" strokeWidth={2} />
                <span>CONTROL PLANE</span>
              </a>
            </>
          )}

          {rol === 'CONDUCTOR_ACTIVO' && (
            <>
              <Link href="/historial" className={desktopLinkClass("/historial")}>
                <MapPin className="h-4 w-4" strokeWidth={2} />
                <span>HISTORIAL</span>
              </Link>
              <Link href="/billetera" className={desktopLinkClass("/billetera")}>
                <Wallet className="h-4 w-4" strokeWidth={2} />
                <span>BILLETERA</span>
              </Link>
              <Link href="/perfil" className={desktopLinkClass("/perfil")}>
                <User className="h-4 w-4" strokeWidth={2} />
                <span>PERFIL</span>
              </Link>
            </>
          )}
        </nav>

        {/* --- Right side (placeholder for UserButton which is usually in HeaderModulo, but we keep the space) --- */}
        <div className="w-10"></div>
      </header>

      {/* MOBILE: Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[rgba(220,38,38,0.25)] bg-[rgba(10,10,10,0.9)] backdrop-blur-md flex justify-center h-20 z-50">
        <div className="flex w-full h-full max-w-md items-center justify-between gap-2 px-3">

          <Link href="/" className={mobileLinkClass("/")}>
            <Home className="h-5 w-5" strokeWidth={2} />
            <span className="text-[9px] uppercase tracking-wider mt-0.5">INICIO</span>
          </Link>

          {/* Mobile Menu ADMIN */}
          {rol === 'ADMIN' && (
            <>
              <Link href="/admin/flota" className={mobileLinkClass("/admin/flota")}>
                <CarFront className="h-5 w-5" strokeWidth={2} />
                <span className="text-[9px] uppercase tracking-wider mt-0.5">FLOTA</span>
              </Link>
              <Link href="/admin/reportes" className={mobileLinkClass("/admin/reportes")}>
                <DollarSign className="h-5 w-5" strokeWidth={2} />
                <span className="text-[9px] uppercase tracking-wider mt-0.5">REPORTES</span>
              </Link>
              <a href={analyticsUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-card transition-all duration-150 font-sci text-[#9CA3AF] hover:text-white">
                <BarChart className="h-5 w-5" strokeWidth={2} />
                <span className="text-[9px] uppercase tracking-wider mt-0.5">ANALYTICS</span>
              </a>
              <a href={controlPlaneUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-card transition-all duration-150 font-sci text-[#9CA3AF] hover:text-white">
                <Shield className="h-5 w-5" strokeWidth={2} />
                <span className="text-[9px] uppercase tracking-wider mt-0.5">CONTROL</span>
              </a>
            </>
          )}

          {/* Mobile Menu CONDUCTOR */}
          {rol === 'CONDUCTOR_ACTIVO' && (
            <>
              <Link href="/historial" className={mobileLinkClass("/historial")}>
                <MapPin className="h-5 w-5" strokeWidth={2} />
                <span className="text-[9px] uppercase tracking-wider mt-0.5">VIAJES</span>
              </Link>
              <Link href="/billetera" className={mobileLinkClass("/billetera")}>
                <Wallet className="h-5 w-5" strokeWidth={2} />
                <span className="text-[9px] uppercase tracking-wider mt-0.5">BILLETERA</span>
              </Link>
              <Link href="/perfil" className={mobileLinkClass("/perfil")}>
                <User className="h-5 w-5" strokeWidth={2} />
                <span className="text-[9px] uppercase tracking-wider mt-0.5">PERFIL</span>
              </Link>
            </>
          )}

        </div>
      </nav>
    </>
  );
}
