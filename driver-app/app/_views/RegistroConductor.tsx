/**
 * app/_views/RegistroConductor.tsx
 * Server Component — Formulario de onboarding para conductores nuevos.
 * El <form> usa una Server Action directamente (no necesita "use client").
 */
import { registrarConductor } from "@/app/actions/conductor/registrarConductor";

export default function RegistroConductor() {
  return (
    <section className="max-w-2xl w-full p-8 rounded-2xl border-2 border-zinc-950 bg-white dark:border-white dark:bg-zinc-900 shadow-[6px_6px_0px_0px_#09090b] dark:shadow-[6px_6px_0px_0px_#ffffff]">
      <div className="mb-6 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
          Completá tu perfil para empezar a manejar
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>
          Ingresá tus datos personales y los de tu vehículo para activar tu cuenta.
        </p>
      </div>

      <form action={registrarConductor} className="space-y-6">
        {/* ── Datos Personales ─────────────────────────────────── */}
        <fieldset className="space-y-4">
          <legend className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Datos personales
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
                Nombre
              </label>
              <input
                id="nombre"
                required
                type="text"
                name="nombre"
                autoComplete="given-name"
                className="block w-full rounded-2xl border-2 border-zinc-950 bg-transparent p-3 focus:outline-none focus:ring-0"
                style={{ color: "var(--foreground)" }}
              />
            </div>
            <div>
              <label htmlFor="apellido" className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
                Apellido
              </label>
              <input
                id="apellido"
                required
                type="text"
                name="apellido"
                autoComplete="family-name"
                className="block w-full rounded-2xl border-2 border-zinc-950 bg-transparent p-3 focus:outline-none focus:ring-0"
                style={{ color: "var(--foreground)" }}
              />
            </div>
          </div>
          <div>
            <label htmlFor="licencia" className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
              Número de licencia de conducir
            </label>
            <input
              id="licencia"
              required
              type="text"
              name="licencia"
              className="block w-full rounded-2xl border-2 border-zinc-950 bg-transparent p-3 focus:outline-none focus:ring-0"
              style={{ color: "var(--foreground)" }}
            />
          </div>
        </fieldset>

        {/* ── Datos del Vehículo ───────────────────────────────── */}
        <fieldset className="space-y-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <legend className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
            Datos del vehículo
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="patente" className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
                Patente
              </label>
              <input
                id="patente"
                required
                type="text"
                name="patente"
                className="block w-full rounded-2xl border-2 border-zinc-950 bg-transparent p-3 uppercase tracking-widest focus:outline-none focus:ring-0"
                style={{ color: "var(--foreground)" }}
              />
            </div>
            <div>
              <label htmlFor="anio" className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
                Año
              </label>
              <input
                id="anio"
                required
                type="number"
                name="anio"
                min="1990"
                max={new Date().getFullYear() + 1}
                className="block w-full rounded-2xl border-2 border-zinc-950 bg-transparent p-3 focus:outline-none focus:ring-0"
                style={{ color: "var(--foreground)" }}
              />
            </div>
            <div>
              <label htmlFor="marca" className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
                Marca
              </label>
              <input
                id="marca"
                required
                type="text"
                name="marca"
                className="block w-full rounded-2xl border-2 border-zinc-950 bg-transparent p-3 focus:outline-none focus:ring-0"
                style={{ color: "var(--foreground)" }}
              />
            </div>
            <div>
              <label htmlFor="modelo" className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
                Modelo
              </label>
              <input
                id="modelo"
                required
                type="text"
                name="modelo"
                className="block w-full rounded-2xl border-2 border-zinc-950 bg-transparent p-3 focus:outline-none focus:ring-0"
                style={{ color: "var(--foreground)" }}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="color" className="block text-sm font-medium mb-1" style={{ color: "var(--foreground)" }}>
                Color del vehículo
              </label>
              <input
                id="color"
                required
                type="text"
                name="color"
                className="block w-full rounded-2xl border-2 border-zinc-950 bg-transparent p-3 focus:outline-none focus:ring-0"
                style={{ color: "var(--foreground)" }}
              />
            </div>
          </div>
        </fieldset>

        <button
          type="submit"
          className="w-full p-4 rounded-2xl border-2 border-zinc-950 bg-zinc-950 text-white font-bold text-base shadow-[6px_6px_0px_0px_#09090b] transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-brand/30"
          aria-label="Guardar datos y activar cuenta de conductor"
        >
          Activar mi cuenta de conductor
        </button>
      </form>
    </section>
  );
}
