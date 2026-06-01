"use client";

import { useState, useTransition } from "react";
import { Car, Plus, Trash2, X } from "lucide-react";
import { agregarVehiculo } from "@/app/actions/conductor/agregarVehiculo";
import { bajaVehiculo } from "@/app/actions/conductor/bajaVehiculo";

type Vehiculo = {
  id_vehiculo: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
};

export default function GestorVehiculos({ vehiculos }: { vehiculos: Vehiculo[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vehiculoABorrar, setVehiculoABorrar] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleAgregar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await agregarVehiculo(formData);
      if (result.error) {
        setErrorMsg(result.error);
      } else {
        setIsModalOpen(false);
      }
    });
  }

  function handleBaja(idVehiculo: string) {
    setVehiculoABorrar(idVehiculo);
  }

  function confirmarBaja(idVehiculo: string) {
    startTransition(async () => {
      const result = await bajaVehiculo(idVehiculo);
      if (result.error) {
        alert(result.error);
      } else {
        setVehiculoABorrar(null);
      }
    });
  }

  return (
    <div className="border-t-2 border-zinc-950 dark:border-zinc-800">
      <div className="px-6 py-4 flex items-center justify-between border-b-2 border-zinc-950 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800">
        <h2 className="font-extrabold text-lg uppercase tracking-wide text-zinc-950 dark:text-white">
          Tus Vehículos
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-zinc-950 bg-brand text-zinc-950 font-bold text-sm shadow-[2px_2px_0px_0px_#09090b] hover:-translate-y-0.5 transition-transform"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      <div className="divide-y-2 divide-zinc-950 dark:divide-zinc-800">
        {vehiculos.length === 0 ? (
          <div className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400 font-medium">
            No tienes vehículos activos.
          </div>
        ) : (
          vehiculos.map((v) => (
            <div key={v.id_vehiculo} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Car className="w-8 h-8 text-zinc-950 dark:text-white" strokeWidth={2.5} aria-hidden />
                <div>
                  <p className="font-bold text-lg text-zinc-950 dark:text-white uppercase tracking-wide">
                    {v.marca} {v.modelo} {v.anio}
                  </p>
                  <p className="text-sm font-mono font-medium text-zinc-600 dark:text-zinc-300">
                    {v.patente} · {v.color}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleBaja(v.id_vehiculo)}
                disabled={isPending}
                className="p-2 text-alert hover:bg-alert/10 rounded-lg transition-colors disabled:opacity-50"
                title="Dar de baja vehículo"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border-2 border-zinc-950 rounded-2xl shadow-[8px_8px_0px_0px_#09090b] dark:shadow-[8px_8px_0px_0px_#CFFF04] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b-2 border-zinc-950 dark:border-zinc-800">
              <h2 className="font-extrabold text-xl text-zinc-950 dark:text-white">Agregar Vehículo</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md">
                <X className="w-6 h-6 text-zinc-950 dark:text-white" />
              </button>
            </div>
            
            <form onSubmit={handleAgregar} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg border-2 border-alert bg-alert/10 text-alert font-bold text-sm">
                  {errorMsg}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label htmlFor="patente" className="block text-sm font-medium mb-1">Patente</label>
                  <input id="patente" required type="text" name="patente" pattern="^([a-zA-Z]{3}\d{3}|[a-zA-Z]{2}\d{3}[a-zA-Z]{2})$" title="Debe tener formato argentino (ej: AAA123 o AA123AA)" className="block w-full rounded-xl border-2 border-zinc-950 bg-transparent p-2.5 uppercase tracking-widest focus:ring-0 focus:border-brand transition-colors" />
                </div>
                <div>
                  <label htmlFor="numero_poliza" className="block text-sm font-medium mb-1">Número de Póliza</label>
                  <input id="numero_poliza" required type="text" name="numero_poliza" pattern="^[a-zA-Z0-9\-]{6,25}$" title="Entre 6 y 25 caracteres alfanuméricos o guiones" className="block w-full rounded-xl border-2 border-zinc-950 bg-transparent p-2.5 uppercase tracking-widest focus:ring-0 focus:border-brand transition-colors" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="marca" className="block text-sm font-medium mb-1">Marca</label>
                  <input id="marca" required type="text" name="marca" className="block w-full rounded-xl border-2 border-zinc-950 bg-transparent p-2.5 focus:ring-0" />
                </div>
                <div>
                  <label htmlFor="modelo" className="block text-sm font-medium mb-1">Modelo</label>
                  <input id="modelo" required type="text" name="modelo" className="block w-full rounded-xl border-2 border-zinc-950 bg-transparent p-2.5 focus:ring-0" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="anio" className="block text-sm font-medium mb-1">Año</label>
                  <input id="anio" required type="number" name="anio" min="1990" max={new Date().getFullYear() + 1} className="block w-full rounded-xl border-2 border-zinc-950 bg-transparent p-2.5 focus:ring-0" />
                </div>
                <div>
                  <label htmlFor="color" className="block text-sm font-medium mb-1">Color</label>
                  <input id="color" required type="text" name="color" className="block w-full rounded-xl border-2 border-zinc-950 bg-transparent p-2.5 focus:ring-0" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full mt-4 p-3 rounded-xl border-2 border-zinc-950 bg-brand text-zinc-950 font-bold text-base shadow-[4px_4px_0px_0px_#09090b] transition-transform duration-200 hover:-translate-y-0.5 disabled:opacity-60"
              >
                {isPending ? "Guardando..." : "Guardar Vehículo"}
              </button>
            </form>
          </div>
        </div>
      )}

      {vehiculoABorrar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border-2 border-zinc-950 rounded-2xl shadow-[8px_8px_0px_0px_#09090b] dark:shadow-[8px_8px_0px_0px_#CFFF04] p-6 space-y-6">
            <h2 className="font-extrabold text-xl text-zinc-950 dark:text-white uppercase tracking-wide">
              ¿Dar de baja vehículo?
            </h2>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              ¿Estás seguro de que deseas dar de baja este vehículo? Ya no podrás recibir viajes en él.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setVehiculoABorrar(null)}
                disabled={isPending}
                className="flex-1 p-3 rounded-xl border-2 border-zinc-950 bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-white font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmarBaja(vehiculoABorrar)}
                disabled={isPending}
                className="flex-1 p-3 rounded-xl border-2 border-zinc-950 bg-alert text-zinc-950 font-bold shadow-[4px_4px_0px_0px_#09090b] hover:-translate-y-0.5 transition-transform disabled:opacity-60"
              >
                {isPending ? "Borrando..." : "Sí, dar de baja"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
