import React, { useMemo, useState, useEffect, useCallback } from "react";

import PageContainer from "../components/pages/PageContainer";
import DataTable from "../components/tables/DataTable";
import Modal from "../components/modals/Modals";
import ReportDetail from "../components/modals/DetallesReporte";
import NuevoReporte from "../components/modals/NuevoReporte";
import MessageModal from "../components/modals/MessageModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import StockMaterialChart from "../components/charts/StockMaterialChart";
import CategoriaChart from "../components/charts/CategoriaChart";
import TopProductsChart from "../components/charts/TopProductsChart";
import PesajesMesChart from "../components/charts/PesajesMesChart";


import { listarReportes, crearReporte, deleteReportes } from "../services/reportesService.mjs";

export default function Reportes() {

  
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);

  const [nuevoOpen, setNuevoOpen] = useState(false);

  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    title: "",
    text: "",
    type: "success",
  });

  const [selectedIds, setSelectedIds] = useState([]);

  const [confirmOpen, setConfirmOpen] = useState(false);

  const toggleSelect = (idRepor) => {
    setSelectedIds((prev) => (prev.includes(idRepor) ? prev.filter((x) => x !== idRepor) : [...prev, idRepor]));
  };

  const toggleSelectAll = useCallback(() => {
    const allIds = reportes.map((r) => r.id_reporte);
    if (!allIds || allIds.length === 0) return;
    if (selectedIds.length === allIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
    }
  }, [reportes, selectedIds]);

  // ============================
  // CARGAR REPORTES
  // ============================
  const loadReportes = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await listarReportes();
      setReportes(data);
    } catch (e) {
      setErrorMsg(e.message || "Error al cargar reportes.");
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadReportes();
  }, [loadReportes]);

  // ============================
  // CREAR REPORTE
  // ============================
  const crearReporteHandler = async ({ tipo, id_producto, fecha_desde, fecha_hasta }) => {
    try {
      // Validaciones
      if (!tipo || !id_producto || !fecha_desde || !fecha_hasta) {
        setMessageModal({
          isOpen: true,
          title: "❌ Error",
          text: "Por favor complete todos los campos requeridos.",
          type: "error",
        });
        return { ok: false };
      }

      if (new Date(fecha_desde) > new Date(fecha_hasta)) {
        setMessageModal({
          isOpen: true,
          title: "❌ Error",
          text: "La fecha 'desde' no puede ser mayor que la fecha 'hasta'.",
          type: "error",
        });
        return { ok: false };
      }

      // Payload
      const payload = {
        tipo,
        id_producto: Number(id_producto),
        fecha_desde,
        fecha_hasta,
      };

    
          
      // ⬇ crearReporte YA NO DEVUELVE { ok }, DEVUELVE EL REPORTE DIRECTO
      const resp = await crearReporte(payload);
      console.log("RESP:", resp);
      // EXITO
      setMessageModal({
        isOpen: true,
        title: "✔ Reporte creado",
        text: `Reporte ${resp.id} generado correctamente.`,
        type: "success",
      });

      await loadReportes();

      return { ok: true };

    } catch (err) {
      setMessageModal({
        isOpen: true,
        title: "❌ Error",
        text: err.message || "Ocurrió un error al generar el reporte.",
        type: "error",
      });

      return { ok: false };
    }
  };




  // ============================
  // COLUMNAS TABLA
  // ============================
  const columns = useMemo(
    () => [
      { id: "id", header: "Codigo", accessor: "id", width: 100, align: "center" },
      { id: "tipo", header: "Tipo", accessor: "tipo", width: 150, align: "center" },
      { id: "producto", header: "Producto", accessor: "producto", width: 200, align: "center" },
      {
        id: "detalle",
        header: "Detalle",
        width: 150,
        align: "center",
        render: (row) => (
          <button
            onClick={() => {
              setDetailRow(row);
              setDetailOpen(true);
            }}
            className="border border-[#d8e4df] rounded-md px-4 py-1.5 text-[#154734] hover:bg-[#e8f4ef]"
          >
            Ver Detalle
          </button>
        ),
      },
      { id: "fecha", header: "Fecha generación", accessor: "fechaGen", width: 180, align: "center" },
      {
        id: "acciones",
        header: (
          <div className="flex items-center justify-center space-x-2">
            <span>Acciones</span>
            <button
              onClick={toggleSelectAll}
              disabled={!reportes || reportes.length === 0}
              title={selectedIds.length === reportes.length && reportes.length > 0 ? "Deseleccionar todos" : "Seleccionar todos"}
              aria-label={selectedIds.length === reportes.length && reportes.length > 0 ? "Deseleccionar todos" : "Seleccionar todos"}
              className={`px-2 py-1 rounded-full flex items-center justify-center gap-2 transition-transform select-none ${
                selectedIds.length === reportes.length && reportes.length > 0
                  ? 'bg-[#0f7a4e] text-white shadow-md hover:scale-105'
                  : 'bg-white text-[#154734] border border-[#d8e4df] hover:shadow-sm hover:scale-105'
              }`}
            >
              {selectedIds.length === reportes.length && reportes.length > 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" stroke="currentColor" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                </svg>
              )}
              <span className="text-xs font-semibold uppercase">TODOS</span>
            </button>
          </div>
        ),
        width: 140,
        align: "center",
        render: (row) => (
          <button
            onClick={() => toggleSelect(row.id_reporte)}
            className={
              selectedIds.includes(row.id_reporte)
                ? 'px-4 py-1.5 rounded-md border bg-[#0f7a4e] text-white hover:bg-[#0d6843]'
                : 'px-4 py-1.5 rounded-md border border-[#154734] text-[#154734] hover:bg-[#e8f4ef]'
            }
          >
            {selectedIds.includes(row.id_reporte) ? "Seleccionado" : "Seleccionar"}
          </button>
        ),
      },
    ],
    [selectedIds, reportes, toggleSelectAll]
  );

  const handleDeleteSelected = async () => {
    if (!selectedIds || selectedIds.length === 0) return;
    setConfirmOpen(true);
  };

  const performDeleteSelected = async () => {
    if (!selectedIds || selectedIds.length === 0) return;
    try {
      const res = await deleteReportes(selectedIds);

      setReportes((prev) => prev.filter((r) => !selectedIds.includes(r.id_reporte)));
      const deletedCount = res.deleted ?? selectedIds.length;
      setSelectedIds([]);

      setMessageModal({
        isOpen: true,
        title: "🗑️ Reportes eliminados",
        text: `Se eliminaron ${deletedCount} reporte(s) correctamente.`,
        type: "success",
      });
    } catch (err) {
      setMessageModal({
        isOpen: true,
        title: "❌ Error",
        text: err.message || "Error al eliminar reportes.",
        type: "error",
      });
    } finally {
      setConfirmOpen(false);
    }
  };

  const fmtARS = (n) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(Number(n || 0));

  const handlePrintSelected = () => {
    if (!selectedIds || selectedIds.length === 0) return;

    const toPrint = reportes.filter((r) => selectedIds.includes(r.id_reporte));

    toPrint.forEach((rep) => {
      try {
        const src = rep?.detalle ? { ...rep, ...rep.detalle } : rep;
        const id = src.id || src.id_reporte || "Reporte";

        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text(`Detalle Reporte ${id}`, 14, 20);

        const rows = [
          ["ID reporte", id],
          ["Tipo", src.tipo || "-"],
          ["Producto", src.producto || "-"],
          ["Desde", (src.fecha_desde || src.desde || "-").toString().slice(0, 10)],
          ["Hasta", (src.fecha_hasta || src.hasta || "-").toString().slice(0, 10)],
          ["Cantidad (unidades)", String(src.cantidadUnidad ?? src.cantidad ?? "-")],
          ["Monto (dinero)", fmtARS(src.cantidadDinero ?? src.monto ?? 0)],
        ];

        autoTable(doc, {
          startY: 30,
          theme: 'grid',
          body: rows,
          styles: { halign: 'left' },
          columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 'auto' } },
        });

        setTimeout(() => {
          doc.save(`Reporte_${id}.pdf`);
        }, 100);
      } catch (e) {
        console.error("Error generando PDF para reporte", rep, e);
      }
    });
  };

  return (
    <PageContainer title="Reportes" noDivider extraHeight>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setNuevoOpen(true)}
          className="px-4 py-2 rounded-xl text-white bg-[#154734] hover:bg-[#103a2b]"
        >
          Nuevo reporte
        </button>
      </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <CategoriaChart />
        <StockMaterialChart />
        <TopProductsChart />
        <PesajesMesChart />
      </div>
      {errorMsg && <p className="text-red-600 mb-4">{errorMsg}</p>}

      <div className="mt-6 space-y-5">
        {loading ? (
          <p className="text-slate-600 mt-4">Cargando reportes...</p>
        ) : (
          <div>
            <div className="hidden md:block">
              <DataTable
                columns={columns}
                data={reportes}
                zebra={false}
                stickyHeader={true}
                wrapperClass="!mb-0 !max-h-[480px] overflow-y-auto shadow-sm"
                tableClass="w-full text-sm border-collapse table-fixed"
                theadClass="bg-[#e8f4ef] text-[#154734]"
                rowClass="hover:bg-[#f6faf7] border-t border-[#edf2ef]"
                headerClass="px-4 py-3 font-semibold text-center"
                cellClass="px-4 py-4 text-center"
                enableSort
              />
            </div>

            <div className="md:hidden">
              <DataTable
                columns={columns}
                data={reportes}
                zebra={false}
                stickyHeader={false}
                wrapperClass="!mb-0 !max-h-[320px] overflow-y-auto shadow-sm"
                tableClass="w-full text-sm border-collapse table-fixed"
                theadClass="bg-[#e8f4ef] text-[#154734]"
                rowClass="hover:bg-[#f6faf7] border-t border-[#edf2ef]"
                headerClass="px-4 py-3 font-semibold text-center"
                cellClass="px-4 py-4 text-center"
                enableSort
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <span title={!selectedIds || selectedIds.length === 0 ? "Seleccionar reportes" : ""} className="inline-block mr-1">
          <button
            onClick={handlePrintSelected}
            disabled={!selectedIds || selectedIds.length === 0}
            aria-label="Imprimir seleccionados"
            className={`rounded-full px-6 py-3 ${
              selectedIds && selectedIds.length > 0
                ? 'bg-[#0f7a4e] text-white hover:bg-[#0d6843]'
                : 'bg-[#0f7a4e] text-white opacity-60 cursor-not-allowed'
            }`}
          >
            Imprimir seleccionados
          </button>
        </span>

        <span title={!selectedIds || selectedIds.length === 0 ? "Seleccionar reportes" : ""} className="inline-block">
          <button
            onClick={handleDeleteSelected}
            disabled={!selectedIds || selectedIds.length === 0}
            aria-label="Eliminar seleccionados"
            className={`rounded-full px-3 py-3 ml-2 flex items-center justify-center ${
              selectedIds && selectedIds.length > 0
                ? 'bg-[#9b102e] text-white hover:bg-[#630924]'
                : 'bg-[#9b102e] text-white opacity-60 cursor-not-allowed'
            }`}
          >
            🗑️ Eliminar Seleccionados
          </button>
        </span>
      </div>

      {detailOpen && (
        <Modal
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          size="max-w-lg"
          title=""
        >
          <ReportDetail
            title={detailRow ? `Detalle_${detailRow.id}` : "Detalle"}
            data={detailRow || {}}
            onClose={() => setDetailOpen(false)}
          />
        </Modal>
      )}

      {nuevoOpen && (
        <NuevoReporte
          isOpen={nuevoOpen}
          onClose={() => setNuevoOpen(false)}
          onCreate={crearReporteHandler}
        />
      )}

      <MessageModal
        isOpen={messageModal.isOpen}
        title={messageModal.title}
        text={messageModal.text}
        type={messageModal.type}
        onClose={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}
      />

      <MessageModal
        isOpen={confirmOpen}
        title="Confirmar eliminación"
        text={`¿Eliminar ${selectedIds.length} reporte(s) seleccionados? Esta acción no se puede deshacer.`}
        type="warning"
        onClose={() => setConfirmOpen(false)}
        confirm
        onConfirm={performDeleteSelected}
        confirmText="Sí, eliminar"
        cancelText="Cancelar"
      />

    </PageContainer>
  );
}
