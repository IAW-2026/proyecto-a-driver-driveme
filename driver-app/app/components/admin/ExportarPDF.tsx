"use client";

/**
 * app/components/admin/ExportarPDF.tsx
 * Client Component — Genera un reporte PDF profesional usando window.print()
 * con estilos @media print. Sin dependencias externas.
 */
import { useRef, useCallback } from "react";
import { FileText } from "lucide-react";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ViajeParaPDF {
  id_viaje: string;
  fecha: string;           // ya formateada con formatFecha()
  conductor: string;       // "Apellido, Nombre"
  patente: string;
  origen: string;
  destino: string;
  pasajero: string;
  monto: string;           // ya formateada con formatARS()
  estado: string;
}

interface ExportarPDFProps {
  viajes: ViajeParaPDF[];
  timestamp: string;       // fecha de generación del reporte
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const ETIQUETAS_ESTADO: Record<string, string> = {
  FINALIZADO: "Finalizado",
  EN_CURSO: "En Curso",
  ACEPTADO: "Aceptado",
  CANCELADO_POR_CONDUCTOR: "Cancelado",
};

// ── Componente ─────────────────────────────────────────────────────────────────

export default function ExportarPDF({ viajes, timestamp }: ExportarPDFProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    if (!printRef.current) return;

    // Clonar el contenido del reporte en un iframe oculto y llamar a print()
    // para imprimir sólo ese frame, sin afectar el layout de la app.
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>DriveMe — Reporte de Flota</title>
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Tipografía base ── */
    body {
      font-family: 'Arial', sans-serif;
      font-size: 11px;
      color: #09090b;
      background: #fff;
      padding: 32px;
    }

    /* ── Encabezado del reporte ── */
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #09090b;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .report-title {
      font-size: 24px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.5px;
    }
    .report-subtitle {
      font-size: 11px;
      font-weight: 700;
      color: #52525b;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .report-meta {
      text-align: right;
      font-size: 10px;
      color: #71717a;
      font-weight: 600;
    }
    .report-meta strong {
      display: block;
      font-size: 11px;
      color: #09090b;
      font-weight: 800;
      margin-bottom: 2px;
    }

    /* ── Resumen ── */
    .summary {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
      padding: 12px 16px;
      border: 2px solid #09090b;
      background: #f4f4f5;
    }
    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .summary-label {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #71717a;
    }
    .summary-value {
      font-size: 18px;
      font-weight: 900;
      color: #09090b;
    }

    /* ── Tabla ── */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    thead {
      background: #09090b;
      color: #fff;
    }
    th {
      padding: 8px 10px;
      text-align: left;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 9px;
    }
    td {
      padding: 7px 10px;
      border-bottom: 1px solid #e4e4e7;
      vertical-align: top;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    .driver-name { font-weight: 700; }
    .plate { font-family: monospace; font-weight: 800; font-size: 11px; }
    .amount { font-weight: 900; text-align: right; }
    .estado-badge {
      display: inline-block;
      padding: 2px 6px;
      border: 1.5px solid #09090b;
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .estado-FINALIZADO    { background: #CFFF04; color: #09090b; }
    .estado-EN_CURSO      { background: #8B5CF6; color: #fff; }
    .estado-ACEPTADO      { background: #e4e4e7; color: #52525b; }
    .estado-CANCELADO     { background: #FF007F; color: #fff; }

    /* ── Pie de página ── */
    .report-footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 2px solid #09090b;
      font-size: 9px;
      color: #71717a;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      display: flex;
      justify-content: space-between;
    }

    @page { margin: 0; }
    @media print {
      body { padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="report-header">
    <div>
      <div class="report-title">DriveMe</div>
      <div class="report-subtitle">Reporte de Viajes — Flota Completa</div>
    </div>
    <div class="report-meta">
      <strong>Generado el</strong>
      ${timestamp}
    </div>
  </div>

  <div class="summary">
    <div class="summary-item">
      <span class="summary-label">Total de viajes</span>
      <span class="summary-value">${viajes.length}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Viajes finalizados</span>
      <span class="summary-value">${viajes.filter((v) => v.estado === "FINALIZADO").length}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Viajes cancelados</span>
      <span class="summary-value">${viajes.filter((v) => v.estado === "CANCELADO_POR_CONDUCTOR").length}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Conductor</th>
        <th>Patente</th>
        <th>Origen</th>
        <th>Destino</th>
        <th>Pasajero</th>
        <th style="text-align:right">Monto</th>
        <th>Estado</th>
      </tr>
    </thead>
    <tbody>
      ${viajes
        .map(
          (v) => `
      <tr>
        <td style="white-space:nowrap">${v.fecha}</td>
        <td>
          <span class="driver-name">${v.conductor}</span><br/>
          <span class="plate">${v.patente}</span>
        </td>
        <td class="plate">${v.patente}</td>
        <td style="max-width:120px">${v.origen}</td>
        <td style="max-width:120px">${v.destino}</td>
        <td>${v.pasajero}</td>
        <td class="amount">${v.monto}</td>
        <td>
          <span class="estado-badge estado-${v.estado === "CANCELADO_POR_CONDUCTOR" ? "CANCELADO" : v.estado}">
            ${ETIQUETAS_ESTADO[v.estado] ?? v.estado}
          </span>
        </td>
      </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <div class="report-footer">
    <span>DriveMe — Sistema de Gestión de Flota</span>
    <span>Página 1</span>
  </div>
</body>
</html>`);
    doc.close();

    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    // Limpieza del iframe tras imprimir
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, [viajes, timestamp]);

  return (
    <>
      {/* Botón neobrutalist visible en pantalla */}
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-zinc-950 bg-brand text-zinc-950 font-extrabold text-sm uppercase tracking-wide shadow-[3px_3px_0px_0px_#09090b] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#09090b] transition-all duration-150 dark:border-brand dark:shadow-[3px_3px_0px_0px_#CFFF04] dark:hover:shadow-[4px_4px_0px_0px_#CFFF04]"
        title="Exportar reporte de viajes a PDF"
      >
        <FileText className="w-4 h-4" strokeWidth={2.5} />
        Exportar PDF
      </button>

      {/* Contenedor oculto — solo se usa como referencia para ref, no se imprime */}
      <div ref={printRef} className="hidden" aria-hidden="true" />
    </>
  );
}
