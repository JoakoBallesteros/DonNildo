import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Plus, Filter, Download } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import PageContainer from "../components/pages/PageContainer";
import FilterBar from "../components/forms/FilterBars";
import DataTable from "../components/tables/DataTable.jsx";
import DetailModal from "../components/modals/Details";
import Modified from "../components/modals/Modified";
import Modal from "../components/modals/Modals.jsx";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/apiClient";

export default function Ventas() {
  const navigate = useNavigate();

  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [filtroTipo, setFiltroTipo] = useState("Todo");
  const [filtros, setFiltros] = useState({ buscar: "", desde: "", hasta: "" });
  const [resetSignal, setResetSignal] = useState(0);
  const [mostrarAnuladas, setMostrarAnuladas] = useState(false);

  const [isAnularConfirmOpen, setAnularConfirmOpen] = useState(false);
  const [ventaIdToAnular, setVentaIdToAnular] = useState(null);

  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    title: "",
    text: "",
    type: "",
  });

  // =========================
  // FILTROS
  // =========================
  const handleFilterSelect = (tipo) => setFiltroTipo(tipo);

  const aplicarFiltros = ({ buscar, desde, hasta, tipo }) => {
    setFiltros({ buscar, desde, hasta });
    if (tipo) setFiltroTipo(tipo);
  };

  const reiniciarFiltros = () => {
    setFiltros({ buscar: "", desde: "", hasta: "" });
    setFiltroTipo("Todo");
    setResetSignal((n) => n + 1);
  };

  // =========================
  // CARGA DE DATOS DESDE BACKEND
  // =========================

const loadVentas = useCallback(async () => {
  try {
    setLoading(true);
    setErr("");

    const qs = mostrarAnuladas ? "?only=anuladas" : "?only=activas";
    const data = await apiFetch(`/api/ventas${qs}`);
    setVentas(data);
  } catch (e) {
    console.error("Error al cargar ventas:", e);
    setErr(e.message);
  } finally {
    setLoading(false);
  }
}, [mostrarAnuladas]);

useEffect(() => {
  loadVentas();
}, [loadVentas]);

  // =========================
  // MODALES
  // =========================
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);

  const handleVerDetalle = (venta) => {
    setSelectedVenta(venta);
    setDetailOpen(true);
  };

  const handleModificar = (venta) => {
    setSelectedVenta(venta);
    setEditOpen(true);
  };

  const handleGuardarCambios = async (updated) => {
  try {
    if (!updated) return setEditOpen(false);

    const id_venta = updated.id_venta; // 👈 usamos el id real, no "numero"
    const body = { id_venta, productos: updated.productos };

    console.log("🧾 Guardando venta:", body);

    const data = await apiFetch(`/api/ventas/${id_venta}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setMessageModal({
      isOpen: true,
      title: "✅ Venta Modificada",
      text: "La venta ha sido modificada correctamente.",
      type: "success",
    });
    setEditOpen(false);
    setSelectedVenta(null);
    await loadVentas();
  } catch (e) {
    console.error("Error al guardar cambios:", e);
    setMessageModal({ isOpen: true, title: "❌ Error al Guardar", text: e.message, type: "error" });
  }
};

const handleOpenAnularConfirm = (id_venta) => {
  setVentaIdToAnular(id_venta);
  setAnularConfirmOpen(true);
};

const handleAnular = async () => {
  try {
    if (!ventaIdToAnular) return;

    setAnularConfirmOpen(false);
    await apiFetch(`/api/ventas/${ventaIdToAnular}/anular`, {
      method: "PUT",
    });

    setMessageModal({
      isOpen: true,
      title: "✅ Venta Anulada",
      text: `La venta N° ${ventaIdToAnular} ha sido anulada correctamente.`,
      type: "success",
    });
    await loadVentas();
  } catch (e) {
    console.error("Error al anular venta:", e);
    setMessageModal({
      isOpen: true,
      title: "❌ Error al Anular",
      text: e.message,
      type: "error",
    });
  } finally {
    setVentaIdToAnular(null);
  }
};

  // =========================
  // DESCARGAR PDF
  // =========================
  const handleDownloadPDF = (venta) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Detalle de Venta N° ${venta.numero}`, 14, 20);

    const head = [["Tipo", "Producto", "Cantidad", "Medida", "Precio Unitario", "Subtotal"]];
    const body = (venta.productos || []).map((p) => [
      p.tipo,
      p.producto,
      String(p.cantidad),
      p.medida,
      `$${p.precio}`,
      `$${p.subtotal}`,
    ]);

    doc.autoTable({ startY: 30, head, body });
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total: $${venta.total}`, 14, finalY);
    doc.save(`Venta_${venta.numero}.pdf`);
  };

  // =========================
  // FILTROS DE VISUALIZACIÓN
  // =========================
  const tipoMap = { Todo: null, Productos: "Producto", Cajas: "Caja", Mixtas: "Mixta" };
  const ventasFiltradas = useMemo(() => {
    const tsel = tipoMap[filtroTipo];
    return ventas.filter((v) => {
      if (tsel && v.tipo !== tsel) return false;
      if (filtros.buscar) {
        const txt = filtros.buscar.toLowerCase();
        if (
          !String(v.id_venta).includes(txt) &&
          !v.tipo.toLowerCase().includes(txt) &&
          !(v.observaciones || "").toLowerCase().includes(txt)
        )
          return false;
      }
      const fecha = new Date(v.fecha);
      if (filtros.desde && fecha < new Date(filtros.desde)) return false;
      if (filtros.hasta && fecha > new Date(filtros.hasta)) return false;
      return true;
    });
  }, [ventas, filtroTipo, filtros]);

  // =========================
  // COLUMNAS TABLA
  // =========================
  const columns = [
    { id: "numero", header: "N° Venta", accessor: "id_venta", align: "center" },
    { id: "tipo", header: "Tipo", accessor: "tipo", align: "center" },
    {
      id: "fecha",
      header: "Fecha",
      align: "center",
      render: (row) => {
        const fecha = new Date(row.fecha);
        return fecha.toLocaleDateString("es-AR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
         })
        .replace(/\//g, "-"); 
      },
    },
    {
      id: "total",
      header: "Total ($)",
      render: (row) => `$${Number(row.total).toLocaleString("es-AR")}`,
      align: "center",
    },
    {
      id: "detalle",
      header: "Detalle",
      align: "center",
      render: (row) => (
        <button
          onClick={() => handleVerDetalle(row)}
          className="border border-[#d8e4df] rounded-md px-4 py-1.5 text-[#154734] hover:bg-[#e8f4ef] transition"
        >
          Ver Detalle
        </button>
      ),
    },
    {
  id: "acciones",
  header: "Acciones",
  align: "center",
  render: (row) => {
    // 💡 Aquí comprobamos el estado de la venta
    const isAnulada = row.estado === "ANULADO"; 
    
    // Si la venta está anulada, mostramos un mensaje y ocultamos todos los botones.
    if (isAnulada) {
      return (
        <span className="text-sm italic text-red-700">
          Anulada
        </span>
      );
    }

    // Si NO está anulada, mostramos los botones
    return (
          <div className="flex justify-center items-center gap-2">
            <div className="flex flex-col items-center gap-1 ml-10">
              <button
                onClick={() => handleModificar(row)}
                className="bg-[#154734] text-white px-3 py-1 text-xs rounded-md hover:bg-[#1E5A3E]"
              >
                MODIFICAR
              </button>
              <button
                // Usamos el nuevo handler para abrir el modal de confirmación
                onClick={() => handleOpenAnularConfirm(row.id_venta)} 
                className="bg-[#A30000] text-white px-5 py-1 text-xs rounded-md hover:bg-[#7A0000]"
              >
                ANULAR
              </button>
            </div>
            {/* Botón de Descarga: también se oculta si está anulada */}
            <button
              onClick={() => handleDownloadPDF(row)}
              className="p-1 border border-[#d8e4df] rounded-md hover:bg-[#f7faf9]"
              title="Descargar comprobante"
            >
              <Download className="w-4 h-4 text-[#154734]" />
            </button>
          </div>
        );
      },
    },
  ];

  // =========================
  // RENDER PRINCIPAL
  // =========================
  return (
    <PageContainer
      title="Lista de Ventas"
      actions={
        <button
          onClick={() => navigate("/ventas/nueva")}
          className="flex items-center gap-2 bg-[#154734] text-white px-4 py-2 rounded-md hover:bg-[#103a2b] transition"
        >
          <Plus size={16} /> Añadir nueva venta
        </button>
      }
    >
      {err && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-5">
          {err}
        </div>
      )}

      <FilterBar
        filters={["Todo", "Productos", "Cajas", "Mixtas"]}
        fields={[
          { label: "Buscar", type: "text", placeholder: "N° venta, tipo u observación...", name: "buscar" },
          { label: "Desde", type: "date", name: "desde" },
          { label: "Hasta", type: "date", name: "hasta" },
        ]}
        onApply={aplicarFiltros}
        onReset={reiniciarFiltros}
        onFilterSelect={handleFilterSelect}
        resetSignal={resetSignal}
        selectedFilter={filtroTipo}
        applyButton={(props) => (
          <button {...props} className="flex items-center gap-2 bg-[#154734] text-white px-4 py-2 rounded-md hover:bg-[#103a2b] transition">
            <Filter size={16} /> Aplicar Filtros
          </button>
        )}
      />
        <div className="flex justify-end mb-4">
        <button
          onClick={() => setMostrarAnuladas((prev) => !prev)}
          className="border border-[#154734] text-[#154734] px-3 py-1 rounded-md hover:bg-[#e8f4ef] transition"
        >
          {mostrarAnuladas ? "Ocultar anuladas" : "Ver anuladas"}
        </button>
      </div>
      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-slate-600">Cargando…</p>
        ) : (
          <DataTable
            columns={columns}
            data={ventasFiltradas}
            zebra={false}
            stickyHeader={true}
            tableClass="w-full text-sm text-center border-collapse"
            theadClass="bg-[#e8f4ef] text-[#154734] sticky top-0"
            rowClass={(row) => `border-t border-[#edf2ef] ${row.estado === "ANULADO" ? "bg-gray-100 text-gray-500 hover:bg-gray-200" : "bg-white hover:bg-[#f6faf7]"}`}
            headerClass="px-4 py-3 font-semibold text-center"
            cellClass="px-4 py-2 text-center"
          />
        )}
      </div>

      <DetailModal
        isOpen={isDetailOpen}
        onClose={() => setDetailOpen(false)}
        title="Detalle de Venta"
        data={selectedVenta || {}}
        itemsKey="productos"
        columns={[
          { key: "tipo", label: "Tipo" },
          { key: "producto", label: "Producto" },
          { key: "cantidad", label: "Cantidad" },
          { key: "medida", label: "Medida" },
          { key: "precio", label: "Precio Unitario" },
          { key: "subtotal", label: "Subtotal" },
        ]}
        footerRight={
          selectedVenta
            ? `Total: $${Number(selectedVenta.total).toLocaleString("es-AR")}`
            : ""
        }
      />

      {selectedVenta && (
        <Modified
          isOpen={isEditOpen}
          onClose={() => setEditOpen(false)}
          title={`Modificar productos de Venta ${selectedVenta?.numero || ""}`}
          data={selectedVenta}
          itemsKey="productos"
          columns={[
            { key: "tipo", label: "Tipo", readOnly: true },
            { key: "producto", label: "Producto", readOnly: true },
            { key: "cantidad", label: "Cantidad", type: "number" },
            { key: "medida", label: "Medida", readOnly: true },
            { key: "precio", label: "Precio Unitario", type: "number" },
            { key: "subtotal", label: "Subtotal", readOnly: true },
          ]}
          computeTotal={(rows) =>
            rows.reduce((sum, r) => sum + r.cantidad * r.precio, 0)
          }
          onSave={handleGuardarCambios}
        />
      )}

      <Modal
        isOpen={isAnularConfirmOpen}
        onClose={() => setAnularConfirmOpen(false)}
        title="Confirmar Anulación"
        size="max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setAnularConfirmOpen(false)}
              className="px-4 py-2 rounded-md font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              Volver
            </button>
            <button
              onClick={handleAnular}
              className="px-4 py-2 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 transition"
            >
              Sí, Anular
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-700">
          ¿Estás seguro de que quieres anular la venta{" "}
          <strong className="text-slate-900">N° {ventaIdToAnular}</strong>? Esta
          acción no se puede deshacer y el stock de los productos involucrados
          será restaurado.
        </p>
      </Modal>

      <Modal
        isOpen={messageModal.isOpen}
        onClose={() => setMessageModal({ isOpen: false, title: "", text: "", type: "" })}
        title={messageModal.title}
        size="max-w-md"
        footer={
          <div className="flex justify-end">
            <button
              onClick={() => setMessageModal({ isOpen: false, title: "", text: "", type: "" })}
              className={`px-4 py-2 rounded-md font-semibold text-white transition ${
                messageModal.type === "success"
                  ? "bg-emerald-700 hover:bg-emerald-800"
                  : "bg-red-700 hover:bg-red-800"
              }`}
            >
              Aceptar
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-700">{messageModal.text}</p>
      </Modal>
    </PageContainer>
  );
}
