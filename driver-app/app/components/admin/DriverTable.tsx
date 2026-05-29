"use client";

/**
 * app/admin/flota/DriverTable.tsx
 * Client Component — Filtros locales (useState) + tabla de conductores.
 * Recibe el array completo desde el Server Component y filtra en el browser.
 */
import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserX, UserCheck, Loader2, Users } from "lucide-react";
import AdminTabla from "@/app/components/admin/AdminTabla";
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
        // router.refresh() provoca que el Server Component re-fetche los datos
        // frescos de la BD (revalidatePath ya invalidó la caché).
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

// ── Componente de filtro tipo tab ─────────────────────────────────────────────

interface GrupoFiltroProps<T extends string> {
  label: string;
  opciones: { valor: T; label: string }[];
  seleccionado: T;
  onChange: (valor: T) => void;
}

function GrupoFiltro<T extends string>({
  label,
  opciones,
  seleccionado,
  onChange,
}: GrupoFiltroProps<T>) {
  return (
    <fieldset>
      <legend className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
        {label}
      </legend>
      <div
        role="group"
        aria-label={label}
        className="flex flex-wrap gap-2"
      >
        {opciones.map(({ valor, label: lbl }) => {
          const activo = seleccionado === valor;
          return (
            <button
              key={valor}
              type="button"
              onClick={() => onChange(valor)}
              aria-pressed={activo}
              className={`px-3 py-1.5 rounded-xl border-2 text-xs font-extrabold uppercase tracking-wide transition-all duration-150
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

export default function DriverTable({ conductores }: DriverTableProps) {
  const [filtroActividad, setFiltroActividad] = useState<FiltroActividad>("TODOS");
  const [filtroConexion, setFiltroConexion] = useState<FiltroConexion>("TODOS");

  // Filtrado en memoria: sin viajes de red, instantáneo
  const conductoresFiltrados = useMemo(() => {
    return conductores.filter((c) => {
      const pasaActividad =
        filtroActividad === "TODOS" ||
        (filtroActividad === "ACTIVO" && c.isActive) ||
        (filtroActividad === "INACTIVO" && !c.isActive);

      const pasaConexion =
        filtroConexion === "TODOS" || c.estado === filtroConexion;

      return pasaActividad && pasaConexion;
    });
  }, [conductores, filtroActividad, filtroConexion]);

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
          // Priorizar el vehículo activo; si no hay, mostrar el primero disponible
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
    <div className="rounded-2xl border-2 border-zinc-950 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-[3px_3px_0px_0px_#09090b] dark:shadow-none overflow-hidden">
      {/* Barra de filtros */}
      <div className="px-5 py-4 border-b-2 border-zinc-950 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <GrupoFiltro
            label="Actividad"
            opciones={OPCIONES_ACTIVIDAD}
            seleccionado={filtroActividad}
            onChange={setFiltroActividad}
          />
          <GrupoFiltro
            label="Estado de conexión"
            opciones={OPCIONES_CONEXION}
            seleccionado={filtroConexion}
            onChange={setFiltroConexion}
          />
        </div>

        {/* Contador de resultados */}
        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" strokeWidth={2.5} />
          {conductoresFiltrados.length} de {conductores.length} conductor
          {conductores.length !== 1 ? "es" : ""}
        </p>
      </div>

      {/* Tabla */}
      <div className="p-4 md:p-5">
        <AdminTabla<ConductorConVehiculos>
          columnas={columnas}
          filas={conductoresFiltrados}
          keyExtractor={(c) => c.id_conductor}
          mensajeVacio="Ningún conductor coincide con los filtros seleccionados."
        />
      </div>
    </div>
  );
}
