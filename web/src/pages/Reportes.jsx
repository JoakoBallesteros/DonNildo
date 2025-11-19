import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";

import PageContainer from "../components/pages/PageContainer";
import DataTable from "../components/tables/DataTable";
import Modal from "../components/modals/Modals";
import ReportDetail from "../components/modals/DetallesReporte";
import NuevoReporte from "../components/modals/NuevoReporte";
import MessageModal from "../components/modals/MessageModal";

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

  const tableRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelect = (idRepor) => {
    setSelectedIds((prev) => (prev.includes(idRepor) ? prev.filter((x) => x !== idRepor) : [...prev, idRepor]));
  };

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
  const crearReporteHandler = async ({ ambito, id_producto, desde, hasta }) => {
  try {

    // ============================
    // VALIDACIONES DEL FRONT
    // ============================
    if (!ambito || !id_producto || !desde || !hasta) {
      return setMessageModal({
        isOpen: true,
        title: "❌ Error",
        text: "Por favor complete todos los campos requeridos.",
        type: "error",
      });
    }

    if (new Date(desde) > new Date(hasta)) {
      return setMessageModal({
        isOpen: true,
        title: "❌ Error",
        text: "La fecha desde no puede ser mayor que la fecha hasta.",
        type: "error",
      });
    }

    // -----------------------------
    const tipo = ambito === "Compras" ? "Compra" : "Venta";
    const payload = {
      tipo,
      id_producto: Number(id_producto),
      fecha_desde: desde,
      fecha_hasta: hasta,
    };
    // -----------------------------


    // ============================
    // LLAMAR AL BACKEND
    // ============================
    await crearReporte(payload);


    // ============================
    // SI TODO OK → Cerrar modal
    // ============================
    setNuevoOpen(false);
    await loadReportes();

    setMessageModal({
      isOpen: true,
      title: "📊 Reporte generado",
      text: "El reporte fue creado correctamente.",
      type: "success",
    });
   } catch (e) {
    console.error("Error creando reporte:", e);

    let msg = e.message || "No se pudo crear el reporte.";

    const match = msg.match(/→\s*\d+\s+(.+)$/);
    if (match) msg = match[1];

    setMessageModal({
      isOpen: true,
      title: "❌ Error al generar reporte",
      text: msg,
      type: "error",
    });
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
        header: "Acciones",
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
    [selectedIds]
  );

  // ============================
  // RENDER
  // ============================
  const handleDeleteSelected = async () => {
    if (!selectedIds || selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `¿Eliminar ${selectedIds.length} reporte(s) seleccionados? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    try {
      const res = await deleteReportes(selectedIds);

      // Actualizar la lista en el frontend
      setReportes((prev) => prev.filter((r) => !selectedIds.includes(r.id_reporte)));
      setSelectedIds([]);

      setMessageModal({
        isOpen: true,
        title: "🗑️ Reportes eliminados",
        text: `Se eliminaron ${res.deleted ?? selectedIds.length} reporte(s) correctamente.`,
        type: "success",
      });
    } catch (err) {
      console.error("Error eliminando reportes:", err);
      setMessageModal({
        isOpen: true,
        title: "❌ Error",
        text: err.message || "Error al eliminar reportes.",
        type: "error",
      });
    }
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

      {errorMsg && <p className="text-red-600 mb-4">{errorMsg}</p>}

      <div ref={tableRef}>
        {loading ? (
          <p className="text-slate-600 mt-4">Cargando reportes...</p>
        ) : (
          <DataTable
            columns={columns}
            data={reportes}
            zebra={false}
            stickyHeader={false}
            tableClass="w-full text-sm border-collapse table-fixed"
            theadClass="bg-[#e8f4ef] text-[#154734]"
            rowClass="hover:bg-[#f6faf7] border-t border-[#edf2ef]"
            headerClass="px-4 py-3 font-semibold text-center"
            cellClass="px-4 py-4 text-center"
            enableSort
            wrapperClass="max-h-[88vh]"
          />
        )}
      </div>
      <div className="mt-1 flex items-center gap-1 justify-end">
        <button className="rounded-full bg-[#0f7a4e] text-white px-6 py-3 hover:bg-[#0d6843]">
          Imprimir seleccionados
        </button>

        <button className="rounded-full bg-[#0f7a4e] text-white px-6 py-3 hover:bg-[#0d6843]">
          Exportar seleccionados a PDF
        </button>

        <button
          onClick={handleDeleteSelected}
          disabled={!selectedIds || selectedIds.length === 0}
          aria-label="Eliminar seleccionados"
          className={`rounded-full px-3 py-3 ml-2 flex items-center justify-center ${
            selectedIds && selectedIds.length > 0
              ? 'bg-[#9b102e] text-white hover:bg-[#630924]'
              : 'bg-[#9b102e] text-white opacity-60'
          }`}
          title={selectedIds && selectedIds.length > 0 ? 'Eliminar seleccionados' : 'Seleccionar reportes'}
          aria-disabled={(!selectedIds || selectedIds.length === 0) ? 'true' : 'false'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </button>
      </div>

      {detailOpen && (
        <Modal
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          size="max-w-lg"
          title=""
        >
          <ReportDetail title={detailRow ? `Detalle_${detailRow.id}` : "Detalle"} data={detailRow || {}} />
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

    </PageContainer>
  );
}
