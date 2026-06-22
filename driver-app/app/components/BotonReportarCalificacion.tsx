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
        className="text-[#EF4444] hover:text-[#FF0000] transition-colors p-1 rounded-sharp hover:bg-[rgba(239,68,68,0.1)]"
        title="Reportar calificación"
        aria-label="Reportar calificación"
      >
        <AlertTriangle className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#141414] border border-[rgba(220,38,38,0.15)] shadow-[0_0_30px_rgba(220,38,38,0.1)] rounded-modal overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[rgba(220,38,38,0.15)]">
              <h3 className="font-extrabold text-lg text-white uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#EF4444]" />
                Reportar Calificación
              </h3>
              <button
                onClick={handleClose}
                className="text-[#6B7280] hover:text-white transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {successMessage ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-[#059669]" />
                  <p className="font-bold text-white text-lg">
                    {successMessage}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-[#9CA3AF] mb-2 uppercase tracking-[0.2em]">
                      Motivo del reporte
                    </label>
                    <select
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      className="w-full p-3 rounded-sharp border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] text-white font-medium focus:border-primary focus:shadow-[0_0_0_1px_#DC2626] outline-none transition-all"
                    >
                      <option value="COMENTARIO_INAPROPIADO">Comentario inapropiado / Ofensivo</option>
                      <option value="SPAM">Spam</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-[#9CA3AF] mb-2 uppercase tracking-[0.2em]">
                      Descripción (opcional)
                    </label>
                    <textarea
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      placeholder="Explica brevemente por qué reportas esta calificación..."
                      rows={3}
                      className="w-full p-3 rounded-sharp border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] text-white font-medium placeholder:text-[#6B7280] focus:border-primary focus:shadow-[0_0_0_1px_#DC2626] outline-none transition-all resize-none"
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-3 bg-[rgba(239,68,68,0.1)] text-[#EF4444] font-bold text-sm rounded-sharp border border-[rgba(239,68,68,0.3)]">
                      {errorMessage}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 py-3 px-4 rounded-sharp font-bold uppercase tracking-wider text-[#9CA3AF] bg-[#1F1F1F] hover:bg-[#2A2A2A] hover:text-white border border-[rgba(255,255,255,0.06)] transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-3 px-4 rounded-sharp font-extrabold uppercase tracking-wider text-white bg-gradient-to-b from-primary-hover to-primary border border-primary-dark hover:translate-y-[-1px] hover:shadow-[0_0_15px_rgba(220,38,38,0.2)] transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
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
