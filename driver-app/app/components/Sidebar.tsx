import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

interface SidebarProps {
  rol: 'ADMIN' | 'CONDUCTOR_NUEVO' | 'CONDUCTOR_ACTIVO';
}

export default function Sidebar({ rol }: SidebarProps) {
  return (
    <>
      {/* VISTA PC: Sidebar Clásico (Ahora con íconos cohesivos) */}
      <aside
        className="hidden md:flex w-64 border-r flex-col min-h-screen sticky top-0 transition-colors duration-300"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <div
          className="p-6 text-2xl font-bold border-b tracking-tight transition-colors duration-300"
          style={{ color: "var(--foreground)", borderColor: "var(--border)" }}
        >
          DriveMe
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
            style={{ color: "var(--muted)" }}
          >
            <span className="text-xl">🏠</span>
            <span className="font-medium">Inicio</span>
          </Link>

          {rol === 'ADMIN' && (
            <>
              <Link
                href="/admin/flota"
                className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                style={{ color: "var(--muted)" }}
              >
                <span className="text-xl">🚗</span>
                <span className="font-medium">Gestión de Flota</span>
              </Link>
              <Link
                href="/admin/reportes"
                className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                style={{ color: "var(--muted)" }}
              >
                <span className="text-xl">📊</span>
                <span className="font-medium">Reportes</span>
              </Link>
            </>
          )}

          {rol === 'CONDUCTOR_ACTIVO' && (
            <>
              <Link
                href="/historial"
                className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                style={{ color: "var(--muted)" }}
              >
                <span className="text-xl">🗂️</span>
                <span className="font-medium">Mis Viajes</span>
              </Link>
              <Link
                href="/perfil"
                className="flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
                style={{ color: "var(--muted)" }}
              >
                <span className="text-xl">⭐</span>
                <span className="font-medium">Mi Perfil</span>
              </Link>
            </>
          )}
        </nav>

        <div
          className="p-4 border-t flex items-center gap-3 transition-colors duration-300"
          style={{ backgroundColor: "var(--surface-muted)", borderColor: "var(--border)" }}
        >
          <UserButton />
          <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Mi Cuenta</span>
        </div>
      </aside>

      {/* VISTA MÓVIL: Bottom Navigation (Traducida al español) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 border-t flex justify-around items-center h-16 z-50 px-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] transition-colors duration-300"
        style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
      >
        <Link
          href="/"
          className="flex flex-col items-center justify-center w-full h-full transition-colors hover:text-[var(--foreground)]"
          style={{ color: "var(--muted)" }}
        >
          <span className="text-xl mb-1">🏠</span>
          <span className="text-[10px] font-bold">Inicio</span>
        </Link>

        {rol === 'CONDUCTOR_ACTIVO' && (
          <>
            <Link
              href="/historial"
              className="flex flex-col items-center justify-center w-full h-full transition-colors hover:text-[var(--foreground)]"
              style={{ color: "var(--muted)" }}
            >
              <span className="text-2xl mb-1">🗂️</span>
              <span className="text-xs font-bold">Viajes</span>
            </Link>

            <Link
              href="/perfil"
              className="flex flex-col items-center justify-center w-full h-full transition-colors hover:text-[var(--foreground)]"
              style={{ color: "var(--muted)" }}
            >
              <span className="text-2xl mb-1">⭐</span>
              <span className="text-xs font-bold">Perfil</span>
            </Link>
          </>
        )}

        <div
          className="flex flex-col items-center justify-center w-full h-full pt-1 transition-colors hover:text-[var(--foreground)]"
          style={{ color: "var(--muted)" }}
        >
          <UserButton />
          <span className="text-[10px] font-bold mt-1">Perfil</span>
        </div>
      </nav>
    </>
  );
}