"use client";

/**
 * app/components/admin/DriverTable.tsx
 * Client Component — Filtros y búsqueda basados en URL (useSearchParams + useRouter).
 * Dark Sci-Fi aesthetic.
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
import { toggleEstadoConductor } from "@/app/actions/admin/toggleEstadoConductor";

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

function BadgeConexion({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    ONLINE:
      "bg-[rgba(5,150,105,0.1)] border-[#059669]/50 text-[#10B981] shadow-[0_0_10px_rgba(5,150,105,0.2)]",
    OFFLINE:
      "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-[#9CA3AF]",
    OCUPADO:
      "bg-[rgba(220,38,38,0.1)] border-primary/50 text-primary shadow-[0_0_10px_rgba(220,38,38,0.2)]",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sharp border text-[9px] font-extrabold uppercase tracking-widest ${estilos[estado] ?? estilos.OFFLINE}`}
    >
      {estado}
    </span>
  );
}

function BadgeActividad({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-sharp border border-[rgba(59,130,246,0.5)] bg-[rgba(59,130,246,0.1)] text-info text-[9px] font-extrabold uppercase tracking-widest shadow-[0_0_10px_rgba(59,130,246,0.2)]">
      Activo
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-sharp border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] text-[#6B7280] text-[9px] font-extrabold uppercase tracking-widest">
      Inactivo
    </span>
  );
}

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
        className="flex items-center gap-2 px-3 py-1.5 rounded-sharp border border-[rgba(239,68,68,0.5)] bg-[rgba(239,68,68,0.1)] text-[#EF4444] text-[10px] font-extrabold uppercase tracking-widest shadow-[0_0_10px_rgba(239,68,68,0.15)] hover:bg-[#EF4444] hover:text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <UserX className="w-3 h-3" strokeWidth={2.5} />
        )}
        {isPending ? "Ejecutando..." : "Suspender"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label="Reactivar conductor"
      className="flex items-center gap-2 px-3 py-1.5 rounded-sharp border border-[rgba(5,150,105,0.5)] bg-[rgba(5,150,105,0.1)] text-[#10B981] text-[10px] font-extrabold uppercase tracking-widest shadow-[0_0_10px_rgba(5,150,105,0.15)] hover:bg-[#10B981] hover:text-white transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <UserCheck className="w-3 h-3" strokeWidth={2.5} />
      )}
      {isPending ? "Ejecutando..." : "Reactivar"}
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

interface GrupoFiltroProps<T extends string> {
  label: string;
  opciones: { valor: T; label: string }[];
  seleccionado: T;
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
      <legend className="text-[10px] font-extrabold uppercase tracking-widest text-[#6B7280] mb-2">
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
              className={`px-3 py-1.5 rounded-sharp border text-[10px] font-extrabold uppercase tracking-widest transition-all duration-150 disabled:opacity-60
                ${
                  activo
                    ? "bg-[rgba(220,38,38,0.15)] border-[rgba(220,38,38,0.4)] text-primary shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                    : "bg-[#141414] text-[#9CA3AF] border-[rgba(255,255,255,0.06)] hover:border-[rgba(220,38,38,0.2)] hover:text-white"
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

  const queryActual = searchParams.get("query") ?? "";
  const actividadActual = (searchParams.get("actividad") ?? "TODOS") as FiltroActividad;
  const conexionActual = (searchParams.get("conexion") ?? "TODOS") as FiltroConexion;

  const [inputValue, setInputValue] = useState(queryActual);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInputValue(queryActual);
  }, [queryActual]);

  function actualizarURL(cambios: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(cambios)) {
      if (value === "" || value === "TODOS") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    params.set("page", "1");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  function handleActividad(valor: FiltroActividad) {
    actualizarURL({ actividad: valor });
  }

  function handleConexion(valor: FiltroConexion) {
    actualizarURL({ conexion: valor });
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      actualizarURL({ query: val });
    }, 400);
  }

  function limpiarBusqueda() {
    setInputValue("");
    actualizarURL({ query: "" });
  }

  const columnas: Parameters<typeof AdminTabla<ConductorConVehiculos>>[0]["columnas"] =
    [
      {
        cabecera: "Conductor",
        render: (c) => (
          <div>
            <p className="font-extrabold text-white uppercase tracking-wider text-xs">
              {c.apellido}, {c.nombre}
            </p>
            <p className="text-[10px] text-[#9CA3AF] font-mono tracking-widest mt-0.5">
              ID. {c.licencia}
            </p>
          </div>
        ),
      },
      {
        cabecera: "Unidad",
        render: (c) => {
          const v = c.vehiculos.find((v) => v.isActive) ?? c.vehiculos[0];
          if (!v)
            return (
              <span className="text-[#6B7280] italic text-[10px] uppercase tracking-widest">Sin asignar</span>
            );
          return (
            <div>
              <p className="font-bold text-white uppercase tracking-wide text-xs">
                {v.marca} {v.modelo} ({v.anio})
              </p>
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-widest mt-0.5">{v.color}</p>
            </div>
          );
        },
      },
      {
        cabecera: "Placa",
        render: (c) => {
          const v = c.vehiculos.find((v) => v.isActive) ?? c.vehiculos[0];
          if (!v) return "—";
          return (
            <span className="font-mono font-extrabold tracking-widest text-[11px] text-primary bg-[rgba(220,38,38,0.1)] px-2 py-0.5 rounded-sharp border border-[rgba(220,38,38,0.3)] shadow-[0_0_10px_rgba(220,38,38,0.1)]">
              {v.patente}
            </span>
          );
        },
      },
      {
        cabecera: "Estado",
        render: (c) => <BadgeConexion estado={c.estado} />,
      },
      {
        cabecera: "Sistema",
        render: (c) => <BadgeActividad isActive={c.isActive} />,
      },
      {
        cabecera: "Calif.",
        render: (c) => (
          <span className="font-bold text-[#FBBF24] drop-shadow-[0_0_5px_rgba(251,191,36,0.3)] text-xs">
            ⭐ {c.calificacion_promedio.toFixed(1)}
          </span>
        ),
      },
      {
        cabecera: "Mando",
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
      className={`rounded-modal border border-[rgba(220,38,38,0.15)] bg-[rgba(20,20,20,0.8)] backdrop-blur-sm shadow-[0_0_30px_rgba(220,38,38,0.08)] overflow-hidden transition-opacity duration-200 ${
        isPending ? "opacity-70" : "opacity-100"
      }`}
    >
      {/* ── Barra de filtros ── */}
      <div className="px-5 py-5 border-b border-[rgba(220,38,38,0.15)] bg-[#0A0A0A] space-y-5">

        {/* Búsqueda de texto */}
        <div className="relative">
          <label htmlFor="busqueda-conductor" className="sr-only">
            Localizar Operador por nombre, apellido o ID
          </label>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none"
            strokeWidth={2.5}
            aria-hidden
          />
          <input
            id="busqueda-conductor"
            type="search"
            value={inputValue}
            onChange={handleSearchChange}
            placeholder="Localizar Operador..."
            className="w-full pl-9 pr-9 py-3 rounded-sharp border border-[rgba(255,255,255,0.1)] bg-[#141414] text-xs font-bold text-white placeholder:text-[#6B7280] uppercase tracking-wider focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(220,38,38,0.2)] transition-all"
          />
          {inputValue && (
            <button
              onClick={limpiarBusqueda}
              aria-label="Limpiar búsqueda"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-[#2A2A2A] hover:bg-primary transition-colors text-[#9CA3AF] hover:text-white"
            >
              <X className="w-3 h-3" strokeWidth={3} />
            </button>
          )}
        </div>

        {/* Filtros de tab */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <GrupoFiltro
            label="Estatus de Red"
            opciones={OPCIONES_ACTIVIDAD}
            seleccionado={actividadActual}
            onChange={handleActividad}
            isPending={isPending}
          />
          <GrupoFiltro
            label="Telemetría"
            opciones={OPCIONES_CONEXION}
            seleccionado={conexionActual}
            onChange={handleConexion}
            isPending={isPending}
          />
        </div>

        {/* Contador de resultados */}
        <div className="flex items-center justify-between pt-2">
           <p className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-widest flex items-center gap-2 bg-[rgba(255,255,255,0.05)] px-3 py-1.5 rounded-sharp border border-[rgba(255,255,255,0.05)]">
             <Users className="w-3.5 h-3.5 text-primary" strokeWidth={2.5} aria-hidden />
             {isPending ? (
               <span className="flex items-center gap-2 text-primary">
                 <Loader2 className="w-3 h-3 animate-spin" />
                 Escaneando...
               </span>
             ) : (
               <>
                 {totalFiltrado} de {totalGlobal} operadores
               </>
             )}
           </p>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="p-0 md:p-0">
        <AdminTabla<ConductorConVehiculos>
          columnas={columnas}
          filas={conductores}
          keyExtractor={(c) => c.id_conductor}
          mensajeVacio="Sin resultados en el escaneo actual."
        />

        {/* ── Paginación ── */}
        <div className="p-4 md:p-5">
          <PaginadorURL paginaActual={paginaActual} totalPaginas={totalPaginas} />
        </div>
      </div>
    </div>
  );
}
