"use client";

/**
 * app/components/admin/DriverTable.tsx
 * Client Component — Filtros y búsqueda basados en URL (useSearchParams + useRouter).
 * NO usa useState para el estado de filtros; toda la lógica de filtrado y paginación
 * ocurre en el Server Component (flota/page.tsx) a nivel de base de datos.
 *
 * URL params que controla este componente:
 *   ?query=      texto libre (nombre, apellido, licencia)
 *   ?actividad=  ACTIVO | INACTIVO
 *   ?conexion=   ONLINE | OFFLINE | OCUPADO
 *   ?page=       número de página
 */
import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  UserX,
  UserCheck,
  Loader2,
  Users,
  Search,
  X,
} from "lucide-react";
import AdminTabla from "@/app/components/admin/AdminTabla";
import PaginadorURL from "@/app/components/admin/PaginadorURL";
import { Prisma } from "@/app/generated/prisma/client";
import { toggleEstadoConductor } from "@/app/actions/admin";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type ConductorConVehiculos = Prisma.ConductorGetPayload<{
  include: { vehiculos: true };
}>;

type FiltroActividad = "TODOS" | "ACTIVO" | "INACTIVO";
type FiltroConexion = "TODOS" | "ONLINE" | "OFFLINE" | "OCUPADO";

interface DriverTableProps {
  conductores: ConductorConVehiculos[];
  totalFiltrado: number;
  totalGlobal: number;
  paginaActual: number;
  totalPaginas: number;
}

// ── Sub-componentes locales ───────────────────────────────────────────────────

/** Badge neobrutalista para el estado de conexión del conductor */
function BadgeConexion({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    ONLINE:
      "bg-brand text-zinc-950 border-zinc-950 shadow-[2px_2px_0px_0px_#09090b] dark:border-brand dark:shadow-[2px_2px_0px_0px_#CFFF04]",
    OFFLINE:
      "bg-zinc-200 text-zinc-700 border-zinc-950 shadow-[2px_2px_0px_0px_#09090b] dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-600 dark:shadow-none",
    OCUPADO:
      "bg-alert text-white border-zinc-950 shadow-[2px_2px_0px_0px_#09090b] dark:border-alert dark:shadow-[2px_2px_0px_0px_#FF007F]",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border-2 text-[10px] font-extrabold uppercase tracking-widest ${estilos[estado] ?? estilos.OFFLINE}`}
    >
      {estado}
    </span>
  );
}

/** Badge neobrutalista para la actividad del conductor (isActive) */
function BadgeActividad({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg border-2 border-zinc-950 bg-zinc-950 text-white text-[10px] font-extrabold uppercase tracking-widest shadow-[2px_2px_0px_0px_#09090b] dark:bg-white dark:text-zinc-950 dark:border-white">
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg border-2 border-zinc-400 bg-zinc-100 text-zinc-500 text-[10px] font-extrabold uppercase tracking-widest dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-600">
      Inactivo
    </span>
  );
}

/** Botón de suspensión / reactivación con feedback de carga */
function AccionConductor({
  id_conductor,
  isActive,
}: {
  id_conductor: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await toggleEstadoConductor(id_conductor, isActive);
      if (result.ok) {
        router.refresh();
      } else {
        alert(result.error ?? "Error desconocido.");
      }
    });
  };

  if (isActive) {
    return (
      <button
        onClick={handleClick}
        disabled={isPending}
        aria-label="Suspender conductor"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-zinc-950 bg-white text-zinc-950 text-xs font-bold uppercase tracking-wide shadow-[2px_2px_0px_0px_#09090b] hover:-translate-y-0.5 hover:bg-alert hover:text-white hover:border-alert hover:shadow-[3px_3px_0px_0px_#FF007F] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-900 dark:text-white dark:border-zinc-700 dark:hover:bg-alert dark:hover:border-alert"
      >
        {isPending ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <UserX className="w-3.5 h-3.5" strokeWidth={2.5} />
        )}
        {isPending ? "Guardando..." : "Suspender"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label="Reactivar conductor"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-zinc-950 bg-white text-zinc-950 text-xs font-bold uppercase tracking-wide shadow-[2px_2px_0px_0px_#09090b] hover:-translate-y-0.5 hover:bg-brand hover:text-zinc-950 hover:border-zinc-950 hover:shadow-[3px_3px_0px_0px_#09090b] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-900 dark:text-white dark:border-zinc-700 dark:hover:bg-brand dark:hover:text-zinc-950 dark:hover:border-brand"
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <UserCheck className="w-3.5 h-3.5" strokeWidth={2.5} />
      )}
      {isPending ? "Guardando..." : "Reactivar"}
    </button>
  );
}

// ── Configuración de filtros ──────────────────────────────────────────────────

const OPCIONES_ACTIVIDAD: { valor: FiltroActividad; label: string }[] = [
  { valor: "TODOS", label: "Todos" },
  { valor: "ACTIVO", label: "Activos" },
  { valor: "INACTIVO", label: "Inactivos" },
];

const OPCIONES_CONEXION: { valor: FiltroConexion; label: string }[] = [
  { valor: "TODOS", label: "Todos" },
  { valor: "ONLINE", label: "Online" },
  { valor: "OFFLINE", label: "Offline" },
  { valor: "OCUPADO", label: "Ocupado" },
];

// ── Grupo de filtros tipo tab ─────────────────────────────────────────────────

interface GrupoFiltroProps<T extends string> {
  label: string;
  opciones: { valor: T; label: string }[];
  seleccionado: T;
  /** Callback que recibe el nuevo valor — el padre decide cómo actualizar la URL */
  onChange: (valor: T) => void;
  isPending: boolean;
}

function GrupoFiltro<T extends string>({
  label,
  opciones,
  seleccionado,
  onChange,
  isPending,
}: GrupoFiltroProps<T>) {
  return (
    <fieldset>
      <legend className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
        {label}
      </legend>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {opciones.map(({ valor, label: lbl }) => {
          const activo = seleccionado === valor;
          return (
            <button
              key={valor}
              type="button"
              onClick={() => onChange(valor)}
              disabled={isPending}
              aria-pressed={activo}
              className={`px-3 py-1.5 rounded-xl border-2 text-xs font-extrabold uppercase tracking-wide transition-all duration-150 disabled:opacity-60
                ${
                  activo
                    ? "bg-zinc-950 text-white border-zinc-950 shadow-[3px_3px_0px_0px_#09090b] dark:bg-brand dark:text-zinc-950 dark:border-brand dark:shadow-[3px_3px_0px_0px_#CFFF04]"
                    : "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-950 hover:text-zinc-950 hover:-translate-y-0.5 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-400 dark:hover:text-white"
                }`}
            >
              {lbl}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function DriverTable({
  conductores,
  totalFiltrado,
  totalGlobal,
  paginaActual,
  totalPaginas,
}: DriverTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Leer el estado actual de la URL
  const queryActual = searchParams.get("query") ?? "";
  const actividadActual = (searchParams.get("actividad") ?? "TODOS") as FiltroActividad;
  const conexionActual = (searchParams.get("conexion") ?? "TODOS") as FiltroConexion;

  // Estado LOCAL solo para el input de búsqueda (debounce sin afectar la URL en cada keystroke)
  const [inputValue, setInputValue] = useState(queryActual);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincronizar inputValue cuando la URL cambia externamente (ej: botón "limpiar")
  useEffect(() => {
    setInputValue(queryActual);
  }, [queryActual]);

  /** Actualiza la URL preservando los parámetros existentes */
  function actualizarURL(cambios: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(cambios)) {
      if (value === "" || value === "TODOS") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    // Cualquier cambio de filtro resetea a la página 1
    params.set("page", "1");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  /** Cambia el filtro de actividad y actualiza la URL */
  function handleActividad(valor: FiltroActividad) {
    actualizarURL({ actividad: valor });
  }

  /** Cambia el filtro de conexión y actualiza la URL */
  function handleConexion(valor: FiltroConexion) {
    actualizarURL({ conexion: valor });
  }

  /** Maneja el input de búsqueda con debounce de 400ms */
  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      actualizarURL({ query: val });
    }, 400);
  }

  /** Limpia la búsqueda */
  function limpiarBusqueda() {
    setInputValue("");
    actualizarURL({ query: "" });
  }

  // Columnas de la tabla
  const columnas: Parameters<typeof AdminTabla<ConductorConVehiculos>>[0]["columnas"] =
    [
      {
        cabecera: "Conductor",
        render: (c) => (
          <div>
            <p className="font-extrabold text-zinc-950 dark:text-white">
              {c.apellido}, {c.nombre}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              Lic. {c.licencia}
            </p>
          </div>
        ),
      },
      {
        cabecera: "Vehículo",
        render: (c) => {
          const v = c.vehiculos.find((v) => v.isActive) ?? c.vehiculos[0];
          if (!v)
            return (
              <span className="text-zinc-400 italic text-xs">Sin vehículo</span>
            );
          return (
            <div>
              <p className="font-bold text-zinc-950 dark:text-white">
                {v.marca} {v.modelo} ({v.anio})
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{v.color}</p>
            </div>
          );
        },
      },
      {
        cabecera: "Patente",
        render: (c) => {
          const v = c.vehiculos.find((v) => v.isActive) ?? c.vehiculos[0];
          if (!v) return "—";
          return (
            <span className="font-mono font-extrabold tracking-widest text-sm text-zinc-950 dark:text-brand">
              {v.patente}
            </span>
          );
        },
      },
      {
        cabecera: "Conexión",
        render: (c) => <BadgeConexion estado={c.estado} />,
      },
      {
        cabecera: "Actividad",
        render: (c) => <BadgeActividad isActive={c.isActive} />,
      },
      {
        cabecera: "Calif.",
        render: (c) => (
          <span className="font-bold text-zinc-950 dark:text-white">
            ⭐ {c.calificacion_promedio.toFixed(1)}
          </span>
        ),
      },
      {
        cabecera: "Acciones",
        render: (c) => (
          <AccionConductor
            id_conductor={c.id_conductor}
            isActive={c.isActive}
          />
        ),
      },
    ];

  return (
    <div
      className={`rounded-2xl border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[3px_3px_0px_0px_#09090b] dark:shadow-none overflow-hidden transition-opacity duration-200 ${
        isPending ? "opacity-70" : "opacity-100"
      }`}
    >
      {/* ── Barra de filtros ── */}
      <div className="px-5 py-4 border-b-2 border-zinc-950 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 space-y-4">

        {/* Búsqueda de texto */}
        <div className="relative">
          <label htmlFor="busqueda-conductor" className="sr-only">
            Buscar conductor por nombre, apellido o licencia
          </label>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none"
            strokeWidth={2.5}
            aria-hidden
          />
          <input
            id="busqueda-conductor"
            type="search"
            value={inputValue}
            onChange={handleSearchChange}
            placeholder="Buscar por nombre, apellido o licencia…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-brand transition-all"
          />
          {inputValue && (
            <button
              onClick={limpiarBusqueda}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
            >
              <X className="w-3 h-3 text-zinc-600 dark:text-zinc-300" strokeWidth={3} />
            </button>
          )}
        </div>

        {/* Filtros de tab */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GrupoFiltro
            label="Actividad"
            opciones={OPCIONES_ACTIVIDAD}
            seleccionado={actividadActual}
            onChange={handleActividad}
            isPending={isPending}
          />
          <GrupoFiltro
            label="Estado de conexión"
            opciones={OPCIONES_CONEXION}
            seleccionado={conexionActual}
            onChange={handleConexion}
            isPending={isPending}
          />
        </div>

        {/* Contador de resultados */}
        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
          {isPending ? (
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Filtrando…
            </span>
          ) : (
            <>
              {totalFiltrado} de {totalGlobal} conductor
              {totalGlobal !== 1 ? "es" : ""}
            </>
          )}
        </p>
      </div>

      {/* ── Tabla ── */}
      <div className="p-4 md:p-5">
        <AdminTabla<ConductorConVehiculos>
          columnas={columnas}
          filas={conductores}
          keyExtractor={(c) => c.id_conductor}
          mensajeVacio="Ningún conductor coincide con los filtros seleccionados."
        />

        {/* ── Paginación ── */}
        <PaginadorURL paginaActual={paginaActual} totalPaginas={totalPaginas} />
      </div>
    </div>
  );
}
