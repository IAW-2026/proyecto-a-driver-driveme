// app/components/admin/ReportesClientLayout.tsx
"use client";

/**
 * ReportesClientLayout — Client Component para la tabla de viajes del admin.
 * Dark Sci-Fi aesthetic.
 */
import { useState, useCallback, useTransition, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Eye, MapPin, Flag, Search, X, Loader2 } from "lucide-react";
import AdminTabla from "@/app/components/admin/AdminTabla";
import PaginadorURL from "@/app/components/admin/PaginadorURL";
import ViajeDetalleModal, {
  type ViajeDetalle,
} from "@/app/components/admin/ViajeDetalleModal";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ViajeSerializado = ViajeDetalle & {
  fecha_display: string;
  monto_display: string;
  conductor_display: string;
};

interface ReportesClientLayoutProps {
  viajes: ViajeSerializado[];
  totalFiltrado: number;
  paginaActual: number;
  totalPaginas: number;
}

// ─── Configuración de filtros de estado ──────────────────────────────────────

type FiltroEstado =
  | ""
  | "FINALIZADO"
  | "EN_CURSO"
  | "ACEPTADO"
  | "CANCELADO_POR_CONDUCTOR";

const OPCIONES_ESTADO: { valor: FiltroEstado; label: string }[] = [
  { valor: "", label: "Todos" },
  { valor: "FINALIZADO", label: "Finalizados" },
  { valor: "EN_CURSO", label: "En Curso" },
  { valor: "ACEPTADO", label: "Asignados" },
  { valor: "CANCELADO_POR_CONDUCTOR", label: "Abortados" },
];

// ─── Badge de estado ──────────────────────────────────────────────────────────

const ESTADO_ESTILOS: Record<string, string> = {
  FINALIZADO:
    "bg-[rgba(5,150,105,0.1)] border-[rgba(5,150,105,0.4)] text-[#10B981] shadow-[0_0_10px_rgba(5,150,105,0.2)]",
  EN_CURSO:
    "bg-[rgba(59,130,246,0.1)] border-[rgba(59,130,246,0.4)] text-info shadow-[0_0_10px_rgba(59,130,246,0.2)]",
  ACEPTADO:
    "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-[#9CA3AF]",
  CANCELADO_POR_CONDUCTOR:
    "bg-[rgba(220,38,38,0.1)] border-[rgba(220,38,38,0.4)] text-primary shadow-[0_0_10px_rgba(220,38,38,0.2)]",
};
const ESTADO_ETIQUETAS: Record<string, string> = {
  FINALIZADO: "Completado",
  EN_CURSO: "En Curso",
  ACEPTADO: "Asignado",
  CANCELADO_POR_CONDUCTOR: "Abortado",
};

function BadgeEstadoViaje({ estado }: { estado: string }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sharp border text-[9px] font-extrabold uppercase tracking-widest ${ESTADO_ESTILOS[estado] ?? ESTADO_ESTILOS.ACEPTADO}`}
    >
      {ESTADO_ETIQUETAS[estado] ?? estado}
    </span>
  );
}

// ─── Botón "Ver Detalles" ─────────────────────────────────────────────────────

function VerDetallesButton({
  onClick,
  id,
  prominent = false,
}: {
  onClick: () => void;
  id: string;
  prominent?: boolean;
}) {
  if (prominent) {
    return (
      <button
        aria-label={`Ver detalles del viaje ${id}`}
        onClick={onClick}
        className="flex items-center gap-1.5 px-3 py-2
          rounded-sharp border border-[rgba(255,255,255,0.1)]
          bg-gradient-to-b from-[#1F1F1F] to-[#0A0A0A] text-[#9CA3AF]
          hover:border-primary/40 hover:text-white hover:shadow-[0_0_15px_rgba(220,38,38,0.15)]
          active:scale-[0.98] transition-all duration-150 focus:outline-none shrink-0"
      >
        <Eye className="w-4 h-4" strokeWidth={2.5} />
        <span className="text-[10px] font-extrabold uppercase tracking-widest">
          Inspeccionar
        </span>
      </button>
    );
  }

  return (
    <button
      aria-label={`Ver detalles del viaje ${id}`}
      onClick={onClick}
      className="group flex items-center gap-1.5 px-2.5 py-1.5
        rounded-sharp border border-transparent
        bg-transparent text-[#6B7280]
        hover:bg-[rgba(220,38,38,0.1)] hover:border-[rgba(220,38,38,0.3)] hover:text-primary
        active:scale-[0.98] transition-all duration-150 focus:outline-none"
    >
      <Eye
        className="w-3.5 h-3.5 transition-colors duration-150"
        strokeWidth={2.5}
      />
      <span className="text-[10px] font-extrabold uppercase tracking-widest hidden sm:inline">
        Ver
      </span>
    </button>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ReportesClientLayout({
  viajes,
  totalFiltrado,
  paginaActual,
  totalPaginas,
}: ReportesClientLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [viajeSeleccionado, setViajeSeleccionado] = useState<ViajeDetalle | null>(null);
  const handleClose = useCallback(() => setViajeSeleccionado(null), []);

  const queryActual = searchParams.get("query") ?? "";
  const estadoActual = (searchParams.get("estado") ?? "") as FiltroEstado;
  const [inputValue, setInputValue] = useState(queryActual);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInputValue(queryActual);
  }, [queryActual]);

  function actualizarURL(cambios: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(cambios)) {
      if (value === "") {
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

  function handleEstado(valor: FiltroEstado) {
    actualizarURL({ estado: valor });
  }

  // ── Columnas de la tabla (desktop) ────────────────────────────────────────
  const columnas: Parameters<typeof AdminTabla<ViajeSerializado>>[0]["columnas"] = [
    {
      cabecera: "Registro",
      render: (v) => (
        <span className="font-mono text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest whitespace-nowrap">
          {v.fecha_display}
        </span>
      ),
    },
    {
      cabecera: "Operador",
      render: (v) => (
        <div>
          <p className="font-bold text-white uppercase tracking-wider text-xs whitespace-nowrap">
            {v.conductor_display}
          </p>
          <p className="text-[10px] font-mono text-[#6B7280] uppercase tracking-widest">{v.patente}</p>
        </div>
      ),
    },
    {
      cabecera: "Origen",
      render: (v) => (
        <span className="text-[11px] text-[#9CA3AF] line-clamp-2">
          {v.origen_direccion ?? "—"}
        </span>
      ),
    },
    {
      cabecera: "Destino",
      render: (v) => (
        <span className="text-[11px] text-[#9CA3AF] line-clamp-2">
          {v.destino_direccion ?? "—"}
        </span>
      ),
    },
    {
      cabecera: "Sujeto",
      render: (v) => (
        <span className="text-[11px] font-medium text-[#9CA3AF] uppercase tracking-wider">
          {v.pasajero_nombre ?? "—"}
        </span>
      ),
    },
    {
      cabecera: "Valor",
      render: (v) => (
        <span className="font-black text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] whitespace-nowrap">
          {v.monto_display}
        </span>
      ),
    },
    {
      cabecera: "Estatus",
      render: (v) => <BadgeEstadoViaje estado={v.estado_actual} />,
    },
    {
      cabecera: "Inspección",
      render: (v) => (
        <VerDetallesButton onClick={() => setViajeSeleccionado(v)} id={v.id_viaje} />
      ),
    },
  ];

  // ── Renderer de tarjeta mobile ────────────────────────────────────────────
  const mobileRender = (v: ViajeSerializado) => (
    <>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex flex-col gap-1.5 min-w-0">
          <span className="font-mono text-[10px] font-semibold text-[#6B7280] tracking-widest uppercase">
            {v.fecha_display}
          </span>
          <BadgeEstadoViaje estado={v.estado_actual} />
        </div>
        <VerDetallesButton onClick={() => setViajeSeleccionado(v)} id={v.id_viaje} prominent />
      </div>

      <div className="border-t border-[rgba(255,255,255,0.06)] my-3" />

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-xs uppercase tracking-wider text-white truncate">
            {v.conductor_display}
          </p>
          <p className="text-[10px] font-mono text-primary tracking-widest">{v.patente}</p>
        </div>
        <span className="font-black text-sm text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] whitespace-nowrap shrink-0">
          {v.monto_display}
        </span>
      </div>

      {v.pasajero_nombre && (
        <p className="text-[11px] text-[#9CA3AF] mt-2">
          <span className="font-extrabold uppercase tracking-widest text-[#6B7280]">Sujeto: </span>
          <span className="uppercase">{v.pasajero_nombre}</span>
        </p>
      )}

      <div className="mt-3 space-y-2 border-t border-[rgba(255,255,255,0.03)] pt-2">
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" strokeWidth={2.5} />
          <span className="text-[11px] text-[#9CA3AF] line-clamp-1">
            {v.origen_direccion ?? "—"}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Flag className="w-3.5 h-3.5 mt-0.5 text-[#EF4444] shrink-0" strokeWidth={2.5} />
          <span className="text-[11px] text-[#9CA3AF] line-clamp-1">
            {v.destino_direccion ?? "—"}
          </span>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* ── Barra de búsqueda y filtros ── */}
      <div
        className={`space-y-5 mb-5 transition-opacity duration-200 ${isPending ? "opacity-60" : "opacity-100"}`}
      >
        {/* Input de búsqueda */}
        <div className="relative">
          <label htmlFor="busqueda-viaje" className="sr-only">
            Buscar reporte por Operador o Sujeto
          </label>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280] pointer-events-none"
            strokeWidth={2.5}
            aria-hidden
          />
          <input
            id="busqueda-viaje"
            type="search"
            value={inputValue}
            onChange={handleSearchChange}
            placeholder="Localizar registro..."
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

        {/* Filtro por estado */}
        <fieldset>
          <legend className="text-[10px] font-extrabold uppercase tracking-widest text-[#6B7280] mb-2">
            Estatus Operativo
          </legend>
          <div role="group" aria-label="Filtro por estado" className="flex flex-wrap gap-2">
            {OPCIONES_ESTADO.map(({ valor, label }) => {
              const activo = estadoActual === valor;
              return (
                <button
                  key={valor || "todos"}
                  type="button"
                  onClick={() => handleEstado(valor)}
                  disabled={isPending}
                  aria-pressed={activo}
                  className={`px-3 py-1.5 rounded-sharp border text-[10px] font-extrabold uppercase tracking-widest transition-all duration-150 disabled:opacity-60
                    ${
                      activo
                        ? "bg-[rgba(220,38,38,0.15)] border-[rgba(220,38,38,0.4)] text-primary shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                        : "bg-[#141414] text-[#9CA3AF] border-[rgba(255,255,255,0.06)] hover:border-[rgba(220,38,38,0.2)] hover:text-white"
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Contador */}
        <p className="text-[10px] font-extrabold text-[#9CA3AF] uppercase tracking-widest flex items-center gap-2 bg-[rgba(255,255,255,0.05)] px-3 py-1.5 rounded-sharp border border-[rgba(255,255,255,0.05)] w-fit">
          {isPending ? (
            <span className="flex items-center gap-2 text-primary">
              <Loader2 className="w-3 h-3 animate-spin" />
              Accediendo base de datos...
            </span>
          ) : (
            <>
              {totalFiltrado} registro{totalFiltrado !== 1 ? "s" : ""} encontrado{totalFiltrado !== 1 ? "s" : ""}
            </>
          )}
        </p>
      </div>

      {/* ── Tabla ── */}
      <AdminTabla<ViajeSerializado>
        columnas={columnas}
        filas={viajes}
        keyExtractor={(v) => v.id_viaje}
        mensajeVacio={
          queryActual || estadoActual
            ? "Ningún registro coincide con los parámetros actuales."
            : "No hay registros en la base de datos."
        }
        mobileRender={mobileRender}
      />

      {/* ── Paginación URL ── */}
      <PaginadorURL paginaActual={paginaActual} totalPaginas={totalPaginas} />

      {/* ── Modal de detalle ── */}
      <ViajeDetalleModal viaje={viajeSeleccionado} onClose={handleClose} />
    </>
  );
}
