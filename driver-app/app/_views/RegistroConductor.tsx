/**
 * app/_views/RegistroConductor.tsx
 * Client Component — Formulario de onboarding para conductores nuevos.
 * Dark Sci-Fi aesthetic — High-clearance registration gate.
 */
"use client";

import { useState, useTransition } from "react";
import { registrarConductor } from "@/app/actions/conductor/registrarConductor";
import { reactivarConductor } from "@/app/actions/conductor/reactivarConductor";

export default function RegistroConductor() {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reactivationLicencia, setReactivationLicencia] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await registrarConductor(formData);
      if (result?.code === "BANNED_DRIVER") {
        setErrorMsg("Esta licencia/patente se encuentra inhabilitada permanentemente por un administrador. Contactá a soporte.");
        return;
      }
      if (result?.code === "REQUIRES_REACTIVATION") {
        setReactivationLicencia(result.licencia);
        return;
      }
      if (result?.error) {
        setErrorMsg(result.error);
      }
    });
  }

  function handleReactivate() {
    if (!reactivationLicencia) return;
    setErrorMsg(null);
    startTransition(async () => {
      const result = await reactivarConductor(reactivationLicencia);
      if (result?.error) {
        setErrorMsg(result.error);
      }
    });
  }

  const inputClass = "block w-full min-h-[48px] rounded-sharp border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-3 text-white font-medium placeholder:text-[#9CA3AF] focus:outline-none focus:border-primary focus:shadow-[0_0_0_1px_#DC2626,0_0_15px_rgba(220,38,38,0.2)] transition-all";

  if (reactivationLicencia) {
    return (
      <section className="max-w-2xl w-full p-8 rounded-modal border border-[rgba(220,38,38,0.15)] bg-[rgba(20,20,20,0.8)] backdrop-blur-sm shadow-[0_0_40px_rgba(220,38,38,0.08)]">
        <div className="mb-6 pb-4 border-b border-[rgba(220,38,38,0.15)]">
          <h1 className="text-2xl font-bold text-white">
            Cuenta inactiva detectada
          </h1>
          <p className="mt-2 text-sm text-[#9CA3AF]">
            Vemos que ya tenías una cuenta registrada en DriveMe. ¿Deseas recuperar tu perfil y tu historial de viajes?
          </p>
        </div>
        
        {errorMsg && (
          <div className="mb-6 p-4 rounded-sharp border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] text-[#EF4444] font-bold">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <button
            onClick={handleReactivate}
            disabled={isPending}
            className="w-full p-4 rounded-sharp border border-primary-dark bg-gradient-to-b from-primary-hover to-primary text-white font-bold text-base uppercase tracking-wider shadow-[0_0_15px_rgba(220,38,38,0.15)] transition-all duration-150 hover:translate-y-[-1px] hover:shadow-[0_0_25px_rgba(220,38,38,0.25)] focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "Reactivando..." : "Sí, recuperar mi cuenta"}
          </button>
          <button
            onClick={() => {
              setReactivationLicencia(null);
              setErrorMsg(null);
            }}
            disabled={isPending}
            className="w-full p-4 rounded-sharp border border-[rgba(255,255,255,0.1)] bg-[#1F1F1F] text-white font-bold text-base hover:bg-[#2A2A2A] transition-colors"
          >
            Cancelar y volver
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-2xl w-full p-8 rounded-modal border border-[rgba(220,38,38,0.15)] bg-[rgba(20,20,20,0.8)] backdrop-blur-sm shadow-[0_0_40px_rgba(220,38,38,0.08)]">
      <div className="mb-6 pb-4 border-b border-[rgba(220,38,38,0.15)]">
        <h1 className="text-2xl font-bold text-white">
          Completá tu perfil para empezar a manejar
        </h1>
        <p className="mt-2 text-sm text-[#9CA3AF]">
          Ingresá tus datos personales y los de tu vehículo para activar tu cuenta.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-sharp border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.1)] text-[#EF4444] font-bold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Datos Personales ─────────────────────────────────── */}
        <fieldset className="space-y-4">
          <legend className="text-sm font-extrabold uppercase tracking-[0.2em] text-red-400">
            Datos personales
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nombre" className="block text-sm font-bold mb-1 text-[#9CA3AF] uppercase tracking-wider">
                Nombre
              </label>
              <input
                id="nombre"
                required
                type="text"
                name="nombre"
                autoComplete="given-name"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="apellido" className="block text-sm font-bold mb-1 text-[#9CA3AF] uppercase tracking-wider">
                Apellido
              </label>
              <input
                id="apellido"
                required
                type="text"
                name="apellido"
                autoComplete="family-name"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label htmlFor="licencia" className="block text-sm font-bold mb-1 text-[#9CA3AF] uppercase tracking-wider">
              Número de licencia de conducir
            </label>
            <input
              id="licencia"
              required
              type="text"
              name="licencia"
              pattern="^\d{7,8}$"
              title="Debe ingresar 7 u 8 dígitos numéricos (DNI)"
              className={inputClass}
            />
          </div>
        </fieldset>

        {/* ── Datos del Vehículo ───────────────────────────────── */}
        <fieldset className="space-y-4 pt-4 border-t border-[rgba(220,38,38,0.15)]">
          <legend className="text-sm font-extrabold uppercase tracking-[0.2em] text-red-400">
            Datos del vehículo
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid grid-cols-2 gap-4 col-span-2">
              <div>
                <label htmlFor="patente" className="block text-sm font-bold mb-1 text-[#9CA3AF] uppercase tracking-wider">
                  Patente
                </label>
                <input
                  id="patente"
                  required
                  type="text"
                  name="patente"
                  pattern="^([a-zA-Z]{3}\d{3}|[a-zA-Z]{2}\d{3}[a-zA-Z]{2})$"
                  title="Debe tener formato argentino (ej: AAA123 o AA123AA)"
                  className={`${inputClass} uppercase tracking-widest`}
                />
              </div>
              <div>
                <label htmlFor="numero_poliza" className="block text-sm font-bold mb-1 text-[#9CA3AF] uppercase tracking-wider">
                  Número de Póliza
                </label>
                <input
                  id="numero_poliza"
                  required
                  type="text"
                  name="numero_poliza"
                  pattern="^[a-zA-Z0-9\-]{6,25}$"
                  title="Entre 6 y 25 caracteres alfanuméricos o guiones"
                  className={`${inputClass} uppercase tracking-widest`}
                />
              </div>
            </div>
            <div>
              <label htmlFor="anio" className="block text-sm font-bold mb-1 text-[#9CA3AF] uppercase tracking-wider">
                Año
              </label>
              <input
                id="anio"
                required
                type="number"
                name="anio"
                min="1990"
                max={new Date().getFullYear() + 1}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="marca" className="block text-sm font-bold mb-1 text-[#9CA3AF] uppercase tracking-wider">
                Marca
              </label>
              <input
                id="marca"
                required
                type="text"
                name="marca"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="modelo" className="block text-sm font-bold mb-1 text-[#9CA3AF] uppercase tracking-wider">
                Modelo
              </label>
              <input
                id="modelo"
                required
                type="text"
                name="modelo"
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="color" className="block text-sm font-bold mb-1 text-[#9CA3AF] uppercase tracking-wider">
                Color del vehículo
              </label>
              <input
                id="color"
                required
                type="text"
                name="color"
                className={inputClass}
              />
            </div>
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={isPending}
          className="w-full p-4 rounded-sharp border border-primary-dark bg-gradient-to-b from-primary-hover to-primary text-white font-bold text-base uppercase tracking-wider shadow-[0_0_15px_rgba(220,38,38,0.15)] transition-all duration-150 hover:translate-y-[-1px] hover:shadow-[0_0_25px_rgba(220,38,38,0.25)] focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          aria-label="Guardar datos y activar cuenta de conductor"
        >
          {isPending ? "Activando cuenta…" : "Activar mi cuenta de conductor"}
        </button>
      </form>
    </section>
  );
}
