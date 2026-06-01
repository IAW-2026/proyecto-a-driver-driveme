"use client";

import { useState } from "react";
import { AlertTriangle, X, CheckCircle2 } from "lucide-react";
import { reportarCalificacionAction } from "@/app/actions/conductor/reportarCalificacion";

export default function BotonReportarCalificacion({ idCalificacion }: { idCalificacion: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [motivo, setMotivo] = useState("COMENTARIO_INAPROPIADO");
  const [descripcion, setDescripcion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => {
    setIsOpen(false);
    setSuccessMessage("");
    setErrorMessage("");
    setDescripcion("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const res = await reportarCalificacionAction({
      id_calificacion: idCalificacion,
      motivo,
      descripcion,
    });

    if (res.success) {
      setSuccessMessage("Reporte enviado exitosamente.");
      setTimeout(() => {
        handleClose();
      }, 2000);
    } else {
      setErrorMessage(res.error || "Hubo un error al enviar el reporte.");
    }

    setIsSubmitting(false);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="text-alert hover:text-red-500 transition-colors p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
        title="Reportar calificación"
        aria-label="Reportar calificación"
      >
        <AlertTriangle className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border-2 border-zinc-950 dark:border-brand shadow-[8px_8px_0px_0px_#09090b] dark:shadow-[8px_8px_0px_0px_#CFFF04] rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b-2 border-zinc-950 dark:border-zinc-800">
              <h3 className="font-extrabold text-lg text-zinc-950 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Reportar Calificación
              </h3>
              <button
                onClick={handleClose}
                className="text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {successMessage ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                  <p className="font-bold text-zinc-950 dark:text-white text-lg">
                    {successMessage}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-950 dark:text-white mb-2 uppercase tracking-wide">
                      Motivo del reporte
                    </label>
                    <select
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-zinc-950 bg-white dark:bg-zinc-800 dark:border-zinc-700 text-zinc-950 dark:text-white font-medium focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all"
                    >
                      <option value="COMENTARIO_INAPROPIADO">Comentario inapropiado / Ofensivo</option>
                      <option value="SPAM">Spam</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-950 dark:text-white mb-2 uppercase tracking-wide">
                      Descripción (opcional)
                    </label>
                    <textarea
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Explica brevemente por qué reportas esta calificación..."
                      rows={3}
                      className="w-full p-3 rounded-xl border-2 border-zinc-950 bg-white dark:bg-zinc-800 dark:border-zinc-700 text-zinc-950 dark:text-white font-medium focus:ring-2 focus:ring-brand focus:border-brand outline-none transition-all resize-none"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold text-sm rounded-xl border-2 border-red-500">
                      {errorMessage}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 py-3 px-4 rounded-xl font-bold uppercase tracking-wider text-zinc-950 dark:text-white bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 border-2 border-transparent transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 px-4 rounded-xl font-extrabold uppercase tracking-wider text-zinc-950 bg-brand border-2 border-zinc-950 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#09090b] transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                    >
                      {isSubmitting ? "Enviando..." : "Reportar"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
