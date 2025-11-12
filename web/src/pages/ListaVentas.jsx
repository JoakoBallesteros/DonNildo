import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Plus, Filter, Download } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import PageContainer from "../components/pages/PageContainer";
import FilterBar from "../components/forms/FilterBars";
import DataTable from "../components/tables/DataTable";
import DetailModal from "../components/modals/Details";
import Modified from "../components/modals/Modified";
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
    const data = await apiFetch("/api/ventas");
    setVentas(data);
  } catch (e) {
    console.error("Error al cargar ventas:", e);
    setErr(e.message);
  } finally {
    setLoading(false);
  }
}, []);

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

    alert("✅ Venta modificada correctamente.");
    setEditOpen(false);
    setSelectedVenta(null);
    await loadVentas();
  } catch (e) {
    console.error("Error al guardar cambios:", e);
    alert("❌ Error al guardar: " + e.message);
  }
};

 const handleAnular = async (id_venta) => {
  if (!confirm(`¿Anular la venta N° ${id_venta}?`)) return;

  try {
    await apiFetch(`/api/ventas/${id_venta}/anular`, { method: "PUT" });
    alert("✅ Venta anulada correctamente.");
    setVentas((prev) =>
      prev.map((v) =>
        v.id_venta === id_venta ? { ...v, estado: "ANULADO" } : v
      )
    );
  } catch (e) {
    console.error("Error al anular venta:", e);
    alert("❌ Error al anular: " + e.message);
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
        .replace(/\//g, "-"); // 👈 reemplaza / por -
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
      render: (row) => (
        <div className="flex justify-center items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => handleModificar(row)}
              className="bg-[#154734] text-white px-3 py-1 text-xs rounded-md hover:bg-[#1E5A3E]"
            >
              MODIFICAR
            </button>
            <button
              onClick={() => handleAnular(row.id_venta)}
              className="bg-[#A30000] text-white px-5 py-1 text-xs rounded-md hover:bg-[#7A0000]"
            >
              ANULAR
            </button>
          </div>
          <button
            onClick={() => handleDownloadPDF(row)}
            className="p-1 border border-[#d8e4df] rounded-md hover:bg-[#f7faf9]"
            title="Descargar comprobante"
          >
            <Download className="w-4 h-4 text-[#154734]" />
          </button>
        </div>
      ),
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

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-slate-600">Cargando…</p>
        ) : (
          <DataTable
            columns={columns}
            data={ventasFiltradas}
            zebra={false}
            stickyHeader={false}
            tableClass="w-full text-sm text-center border-collapse"
            theadClass="bg-[#e8f4ef] text-[#154734]"
            rowClass="hover:bg-[#f6faf7] border-t border-[#edf2ef]"
            headerClass="px-4 py-3 font-semibold text-center"
            cellClass="px-4 py-4 text-center"
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
    </PageContainer>
  );
}
