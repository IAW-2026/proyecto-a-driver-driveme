"use client";

import { useState, useTransition } from "react";
import { CarFront, Plus, Trash2, X } from "lucide-react";
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

  const inputClass = "block w-full rounded-sharp border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-2.5 text-white font-medium placeholder:text-[#6B7280] focus:border-primary focus:shadow-[0_0_0_1px_#DC2626] outline-none transition-all";

  return (
    <div className="border-t border-[rgba(220,38,38,0.15)]">
      <div className="px-6 py-4 flex items-center justify-between border-b border-[rgba(220,38,38,0.15)] bg-[#0A0A0A]">
        <h2 className="font-extrabold text-lg uppercase tracking-wide text-white">
          Tus Vehículos
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-sharp border border-primary-dark bg-gradient-to-b from-primary-hover to-primary text-white font-bold text-sm hover:translate-y-[-1px] hover:shadow-[0_0_10px_rgba(220,38,38,0.2)] transition-all"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      <div className="divide-y divide-[rgba(255,255,255,0.06)]">
        {vehiculos.length === 0 ? (
          <div className="px-6 py-8 text-center text-[#6B7280] font-medium">
            No tienes vehículos activos.
          </div>
        ) : (
          vehiculos.map((v) => (
            <div key={v.id_vehiculo} className="px-6 py-4 flex items-center justify-between hover:bg-[#1F1F1F] transition-colors">
              <div className="flex items-center gap-4">
                <CarFront className="w-8 h-8 text-[#9CA3AF]" strokeWidth={2} aria-hidden />
                <div>
                  <p className="font-bold text-lg text-white uppercase tracking-wide">
                    {v.marca} {v.modelo} {v.anio}
                  </p>
                  <p className="text-sm font-mono font-medium text-[#9CA3AF]">
                    {v.patente} · {v.color}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleBaja(v.id_vehiculo)}
                disabled={isPending}
                className="p-2 text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] rounded-sharp transition-colors disabled:opacity-50"
                title="Dar de baja vehículo"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#141414] border border-[rgba(220,38,38,0.15)] rounded-modal shadow-[0_0_30px_rgba(220,38,38,0.1)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[rgba(220,38,38,0.15)]">
              <h2 className="font-extrabold text-xl text-white">Agregar Vehículo</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-[#1F1F1F] rounded-sharp text-[#6B7280] hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAgregar} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-sharp border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] text-[#EF4444] font-bold text-sm">
                  {errorMsg}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label htmlFor="patente" className="block text-sm font-bold text-[#9CA3AF] mb-1 uppercase tracking-wider">Patente</label>
                  <input id="patente" required type="text" name="patente" pattern="^([a-zA-Z]{3}\d{3}|[a-zA-Z]{2}\d{3}[a-zA-Z]{2})$" title="Debe tener formato argentino (ej: AAA123 o AA123AA)" className={`${inputClass} uppercase tracking-widest`} />
                </div>
                <div>
                  <label htmlFor="numero_poliza" className="block text-sm font-bold text-[#9CA3AF] mb-1 uppercase tracking-wider">Nº Póliza</label>
                  <input id="numero_poliza" required type="text" name="numero_poliza" pattern="^[a-zA-Z0-9\-]{6,25}$" title="Entre 6 y 25 caracteres alfanuméricos o guiones" className={`${inputClass} uppercase tracking-widest`} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="marca" className="block text-sm font-bold text-[#9CA3AF] mb-1 uppercase tracking-wider">Marca</label>
                  <input id="marca" required type="text" name="marca" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="modelo" className="block text-sm font-bold text-[#9CA3AF] mb-1 uppercase tracking-wider">Modelo</label>
                  <input id="modelo" required type="text" name="modelo" className={inputClass} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="anio" className="block text-sm font-bold text-[#9CA3AF] mb-1 uppercase tracking-wider">Año</label>
                  <input id="anio" required type="number" name="anio" min="1990" max={new Date().getFullYear() + 1} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="color" className="block text-sm font-bold text-[#9CA3AF] mb-1 uppercase tracking-wider">Color</label>
                  <input id="color" required type="text" name="color" className={inputClass} />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full mt-4 p-3 rounded-sharp border border-primary-dark bg-gradient-to-b from-primary-hover to-primary text-white font-bold text-sm uppercase tracking-wider shadow-[0_0_15px_rgba(220,38,38,0.15)] hover:translate-y-[-1px] hover:shadow-[0_0_20px_rgba(220,38,38,0.25)] transition-all disabled:opacity-60"
              >
                {isPending ? "Guardando..." : "Guardar Vehículo"}
              </button>
            </form>
          </div>
        </div>
      )}

      {vehiculoABorrar && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#141414] border border-[rgba(220,38,38,0.15)] rounded-modal shadow-[0_0_30px_rgba(220,38,38,0.1)] p-6 space-y-6">
            <h2 className="font-extrabold text-xl text-white uppercase tracking-wide">
              ¿Dar de baja vehículo?
            </h2>
            <p className="text-sm font-medium text-[#9CA3AF]">
              ¿Estás seguro de que deseas dar de baja este vehículo? Ya no podrás recibir viajes en él.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setVehiculoABorrar(null)}
                disabled={isPending}
                className="flex-1 p-3 rounded-sharp border border-[rgba(255,255,255,0.1)] bg-[#1F1F1F] text-white font-bold hover:bg-[#2A2A2A] transition-colors disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmarBaja(vehiculoABorrar)}
                disabled={isPending}
                className="flex-1 p-3 rounded-sharp border border-primary-dark bg-gradient-to-b from-[#EF4444] to-[#DC2626] text-white font-bold shadow-[0_0_15px_rgba(239,68,68,0.15)] hover:translate-y-[-1px] transition-all disabled:opacity-60"
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
