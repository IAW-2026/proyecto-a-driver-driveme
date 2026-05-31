// app/components/admin/ReportesClientLayout.tsx
"use client";

/**
 * ReportesClientLayout — Client Component para la tabla de viajes del admin.
 *
 * Responsabilidades:
 * 1. Barra de búsqueda (texto libre → ?query=) con debounce
 * 2. Filtro de estado (tabs → ?estado=) via URL
 * 3. Tabla de viajes con modal de detalle (estado local legítimo)
 * 4. Paginación via URL (?page=)
 *
 * El componente NO filtra datos — recibe los viajes ya filtrados/paginados
 * desde el Server Component (reportes/page.tsx) y solo gestiona la UI.
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
  { valor: "FINALIZADO", label: "Finalizado" },
  { valor: "EN_CURSO", label: "En Curso" },
  { valor: "ACEPTADO", label: "Aceptado" },
  { valor: "CANCELADO_POR_CONDUCTOR", label: "Cancelado" },
];

// ─── Badge de estado ──────────────────────────────────────────────────────────

const ESTADO_ESTILOS: Record<string, string> = {
  FINALIZADO:
    "bg-brand text-zinc-950 border-zinc-950 dark:border-brand dark:shadow-[2px_2px_0px_0px_#CFFF04]",
  EN_CURSO:
    "bg-info text-zinc-950 border-zinc-950 dark:border-info dark:shadow-[2px_2px_0px_0px_#8B5CF6]",
  ACEPTADO:
    "bg-zinc-200 text-zinc-700 border-zinc-950 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600",
  CANCELADO_POR_CONDUCTOR:
    "bg-alert text-zinc-950 border-zinc-950 dark:border-alert dark:shadow-[2px_2px_0px_0px_#FF007F]",
};
const ESTADO_ETIQUETAS: Record<string, string> = {
  FINALIZADO: "Finalizado",
  EN_CURSO: "En Curso",
  ACEPTADO: "Aceptado",
  CANCELADO_POR_CONDUCTOR: "Cancelado",
};

function BadgeEstadoViaje({ estado }: { estado: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-lg border-2 text-[10px] font-extrabold uppercase tracking-widest shadow-[2px_2px_0px_0px_#09090b] ${ESTADO_ESTILOS[estado] ?? ESTADO_ESTILOS.ACEPTADO}`}
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
          rounded-xl border-2 border-zinc-950 dark:border-zinc-600
          bg-zinc-950 dark:bg-zinc-700
          shadow-[3px_3px_0px_0px_#52525b] dark:shadow-none
          hover:bg-zinc-800 dark:hover:bg-zinc-600
          active:translate-y-0.5 active:shadow-none
          transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white
          shrink-0"
      >
        <Eye className="w-4 h-4 text-white" strokeWidth={2.5} />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-white">
          Ver detalles
        </span>
      </button>
    );
  }

  return (
    <button
      aria-label={`Ver detalles del viaje ${id}`}
      onClick={onClick}
      className="group flex items-center gap-1.5 px-2.5 py-1.5
        rounded-lg border-2 border-zinc-950 dark:border-zinc-600
        bg-white dark:bg-zinc-800
        shadow-[2px_2px_0px_0px_#09090b] dark:shadow-none
        hover:bg-zinc-950 dark:hover:bg-zinc-700
        hover:-translate-y-0.5 active:translate-y-0 active:shadow-none
        transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-white"
    >
      <Eye
        className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 group-hover:text-white dark:group-hover:text-white transition-colors duration-150"
        strokeWidth={2.5}
      />
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-700 dark:text-zinc-300 group-hover:text-white dark:group-hover:text-white transition-colors duration-150 hidden sm:inline">
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

  // ── Estado local LEGÍTIMO: solo controla el modal (UI efímera, no va en URL) ──
  const [viajeSeleccionado, setViajeSeleccionado] = useState<ViajeDetalle | null>(null);
  const handleClose = useCallback(() => setViajeSeleccionado(null), []);

  // ── Estado local del input de búsqueda (debounce hacia la URL) ────────────
  const queryActual = searchParams.get("query") ?? "";
  const estadoActual = (searchParams.get("estado") ?? "") as FiltroEstado;
  const [inputValue, setInputValue] = useState(queryActual);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincronizar si la URL cambia externamente
  useEffect(() => {
    setInputValue(queryActual);
  }, [queryActual]);

  /** Actualiza la URL preservando parámetros existentes */
  function actualizarURL(cambios: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(cambios)) {
      if (value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    params.set("page", "1"); // Cualquier cambio de filtro resetea a página 1
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
      cabecera: "Fecha",
      render: (v) => (
        <span className="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
          {v.fecha_display}
        </span>
      ),
    },
    {
      cabecera: "Conductor",
      render: (v) => (
        <div>
          <p className="font-bold text-zinc-950 dark:text-white whitespace-nowrap">
            {v.conductor_display}
          </p>
          <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">{v.patente}</p>
        </div>
      ),
    },
    {
      cabecera: "Origen",
      render: (v) => (
        <span className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2">
          {v.origen_direccion ?? "—"}
        </span>
      ),
    },
    {
      cabecera: "Destino",
      render: (v) => (
        <span className="text-xs text-zinc-700 dark:text-zinc-300 line-clamp-2">
          {v.destino_direccion ?? "—"}
        </span>
      ),
    },
    {
      cabecera: "Pasajero",
      render: (v) => (
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {v.pasajero_nombre ?? "—"}
        </span>
      ),
    },
    {
      cabecera: "Monto",
      render: (v) => (
        <span className="font-extrabold text-zinc-950 dark:text-brand whitespace-nowrap">
          {v.monto_display}
        </span>
      ),
    },
    {
      cabecera: "Estado",
      render: (v) => <BadgeEstadoViaje estado={v.estado_actual} />,
    },
    {
      cabecera: "Detalle",
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
          <span className="font-mono text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
            {v.fecha_display}
          </span>
          <BadgeEstadoViaje estado={v.estado_actual} />
        </div>
        <VerDetallesButton onClick={() => setViajeSeleccionado(v)} id={v.id_viaje} prominent />
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800 my-2" />

      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-extrabold text-sm text-zinc-950 dark:text-white truncate">
            {v.conductor_display}
          </p>
          <p className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400">{v.patente}</p>
        </div>
        <span className="font-extrabold text-base text-zinc-950 dark:text-brand whitespace-nowrap shrink-0">
          {v.monto_display}
        </span>
      </div>

      {v.pasajero_nombre && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          <span className="font-bold uppercase tracking-wide">Pasajero: </span>
          {v.pasajero_nombre}
        </p>
      )}

      <div className="mt-2 space-y-1">
        <div className="flex items-start gap-1.5">
          <MapPin className="w-3 h-3 mt-0.5 text-brand shrink-0" strokeWidth={2.5} />
          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-1">
            {v.origen_direccion ?? "—"}
          </span>
        </div>
        <div className="flex items-start gap-1.5">
          <Flag className="w-3 h-3 mt-0.5 text-alert shrink-0" strokeWidth={2.5} />
          <span className="text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-1">
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
        className={`space-y-4 mb-5 transition-opacity duration-200 ${isPending ? "opacity-60" : "opacity-100"}`}
      >
        {/* Input de búsqueda */}
        <div className="relative">
          <label htmlFor="busqueda-viaje" className="sr-only">
            Buscar viaje por conductor o pasajero
          </label>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none"
            strokeWidth={2.5}
            aria-hidden
          />
          <input
            id="busqueda-viaje"
            type="search"
            value={inputValue}
            onChange={handleSearchChange}
            placeholder="Buscar por conductor o pasajero…"
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

        {/* Filtro por estado */}
        <fieldset>
          <legend className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-2">
            Estado del viaje
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
                  className={`px-3 py-1.5 rounded-xl border-2 text-xs font-extrabold uppercase tracking-wide transition-all duration-150 disabled:opacity-60
                    ${
                      activo
                        ? "bg-zinc-950 text-white border-zinc-950 shadow-[3px_3px_0px_0px_#09090b] dark:bg-brand dark:text-zinc-950 dark:border-brand dark:shadow-[3px_3px_0px_0px_#CFFF04]"
                        : "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-950 hover:text-zinc-950 hover:-translate-y-0.5 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-400 dark:hover:text-white"
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Contador */}
        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
          {isPending ? (
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Filtrando…
            </span>
          ) : (
            <>
              {totalFiltrado} viaje{totalFiltrado !== 1 ? "s" : ""} encontrado
              {totalFiltrado !== 1 ? "s" : ""}
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
            ? "Ningún viaje coincide con los filtros actuales."
            : "No hay viajes registrados aún."
        }
        mobileRender={mobileRender}
      />

      {/* ── Paginación URL ── */}
      <PaginadorURL paginaActual={paginaActual} totalPaginas={totalPaginas} />

      {/* ── Modal de detalle (estado local legítimo — es UI efímera) ── */}
      <ViajeDetalleModal viaje={viajeSeleccionado} onClose={handleClose} />
    </>
  );
}
