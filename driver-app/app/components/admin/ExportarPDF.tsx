"use client";

/**
 * app/components/admin/ExportarPDF.tsx
 * Client Component — Genera un reporte PDF profesional usando window.print()
 * Dark Sci-Fi aesthetic.
 */
import { useRef, useCallback } from "react";
import { FileText } from "lucide-react";

export interface ViajeParaPDF {
  id_viaje: string;
  fecha: string;
  conductor: string;
  patente: string;
  origen: string;
  destino: string;
  pasajero: string;
  monto: string;
  estado: string;
}

interface ExportarPDFProps {
  viajes: ViajeParaPDF[];
  timestamp: string;
}

const ETIQUETAS_ESTADO: Record<string, string> = {
  FINALIZADO: "Finalizado",
  EN_CURSO: "En Curso",
  ACEPTADO: "Aceptado",
  CANCELADO_POR_CONDUCTOR: "Cancelado",
};

export default function ExportarPDF({ viajes, timestamp }: ExportarPDFProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    if (!printRef.current) return;

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
    // Use a sleek printable format inspired by command logs.
    doc.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>DriveMe — Reporte de Viajes</title>
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Tipografía base ── */
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 11px;
      color: #000;
      background: #fff;
      padding: 32px;
    }

    /* ── Encabezado del reporte ── */
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #000;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .report-title {
      font-size: 24px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .report-subtitle {
      font-size: 10px;
      font-weight: bold;
      color: #333;
      margin-top: 4px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .report-meta {
      text-align: right;
      font-size: 9px;
      color: #666;
      font-weight: normal;
    }
    .report-meta strong {
      display: block;
      font-size: 11px;
      color: #000;
      font-weight: bold;
      margin-bottom: 2px;
    }

    /* ── Resumen ── */
    .summary {
      display: flex;
      gap: 24px;
      margin-bottom: 24px;
      padding: 12px 16px;
      border: 1px solid #000;
      background: #fcfcfc;
    }
    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .summary-label {
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
    }
    .summary-value {
      font-size: 18px;
      font-weight: bold;
      color: #000;
    }

    /* ── Tabla ── */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    thead {
      border-bottom: 2px solid #000;
    }
    th {
      padding: 8px 10px;
      text-align: left;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-size: 9px;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px dotted #ccc;
      vertical-align: top;
    }
    .driver-name { font-weight: bold; }
    .plate { font-weight: bold; }
    .amount { font-weight: bold; text-align: right; }
    .estado-badge {
      display: inline-block;
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* ── Pie de página ── */
    .report-footer {
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #000;
      font-size: 9px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
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
      <div class="report-title">DriveMe // Reporte de Viajes</div>
      <div class="report-subtitle">Historial de Operaciones — Flota Completa</div>
    </div>
    <div class="report-meta">
      <strong>GENERADO</strong>
      ${timestamp}
    </div>
  </div>

  <div class="summary">
    <div class="summary-item">
      <span class="summary-label">Viajes Totales</span>
      <span class="summary-value">${viajes.length}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Viajes Completados</span>
      <span class="summary-value">${viajes.filter((v) => v.estado === "FINALIZADO").length}</span>
    </div>
    <div class="summary-item">
      <span class="summary-label">Viajes Cancelados</span>
      <span class="summary-value">${viajes.filter((v) => v.estado === "CANCELADO_POR_CONDUCTOR").length}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Fecha / Hora</th>
        <th>Conductor</th>
        <th>Vehículo</th>
        <th>Origen</th>
        <th>Destino</th>
        <th>Pasajero</th>
        <th style="text-align:right">Valor</th>
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
          <span class="driver-name">${v.conductor}</span>
        </td>
        <td class="plate">${v.patente}</td>
        <td style="max-width:120px">${v.origen}</td>
        <td style="max-width:120px">${v.destino}</td>
        <td>${v.pasajero}</td>
        <td class="amount">${v.monto}</td>
        <td>
          <span class="estado-badge">
            ${ETIQUETAS_ESTADO[v.estado] ?? v.estado}
          </span>
        </td>
      </tr>`
        )
        .join("")}
    </tbody>
  </table>

  <div class="report-footer">
    <span>DriveMe — Mando Central v1.0</span>
    <span>SOPORTE DOCUMENTAL</span>
  </div>
</body>
</html>`);
    doc.close();

    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, [viajes, timestamp]);

  return (
    <>
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 rounded-sharp border border-[rgba(255,255,255,0.1)] bg-gradient-to-b from-[#1F1F1F] to-[#0A0A0A] text-[#9CA3AF] font-bold text-xs uppercase tracking-widest hover:border-primary/40 hover:text-white hover:shadow-[0_0_15px_rgba(220,38,38,0.15)] transition-all duration-150 active:scale-[0.98]"
        title="Descargar Reporte en PDF"
      >
        <FileText className="w-4 h-4" strokeWidth={2.5} />
        Exportar Reporte
      </button>

      <div ref={printRef} className="hidden" aria-hidden="true" />
    </>
  );
}
