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
import { supa } from "../lib/supabaseClient";

export default function Ventas() {
  const navigate = useNavigate();

  const [ventas, setVentas] = useState([]);
  const [idEstadoAnulado, setIdEstadoAnulado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [filtroTipo, setFiltroTipo] = useState("Todo");
  const [filtros, setFiltros] = useState({ buscar: "", desde: "", hasta: "" });
  const [resetSignal, setResetSignal] = useState(0);

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
  // CARGA DE DATOS
  // =========================
  const loadVentas = useCallback(async () => {
      try {
        setLoading(true);
        setErr("");

        console.log("Cargando ventas...");

        const { data: ventasData, error: e1 } = await supa
          .from("venta")
          .select("id_venta, fecha, total, observaciones, id_estado")
          .order("id_venta", { ascending: true });
        if (e1) throw e1;

        if (!ventasData?.length) {
          setVentas([]);
          return;
        }

        const ids = ventasData.map((v) => v.id_venta);

        const { data: detalles, error: e2 } = await supa
          .from("detalle_venta")
          .select("id_detalle_venta, id_venta, id_producto, cantidad, precio_unitario, subtotal")
          .in("id_venta", ids);
        if (e2) throw e2;

        const { data: productos, error: e3 } = await supa
          .from("productos")
          .select("id_producto, nombre, id_tipo_producto");
        if (e3) throw e3;

        console.log("ventas:", ventasData);
        console.log("detalles:", detalles);
        console.log("productos:", productos);

        const prodMap = new Map(productos.map((p) => [p.id_producto, p]));
        const byVenta = new Map();

        for (const d of detalles) {
          if (!byVenta.has(d.id_venta)) byVenta.set(d.id_venta, []);
          const prod = prodMap.get(d.id_producto);
          const tipo = prod?.id_tipo_producto === 1 ? "Caja" : "Producto";
          byVenta.get(d.id_venta).push({
            id_detalle_venta: d.id_detalle_venta,
            id_producto: d.id_producto,
            tipo,
            producto: prod?.nombre || "—",
            cantidad: Number(d.cantidad) || 0,
            medida: tipo === "Caja" ? "u" : "kg",
            precio: Number(d.precio_unitario) || 0,
            subtotal: Number(d.subtotal) || 0,
          });
        }

        const mapped = ventasData.map((v) => {
          const items = byVenta.get(v.id_venta) || [];
          const tipoVenta =
            new Set(items.map((i) => i.tipo)).size === 1
              ? items[0]?.tipo || "—"
              : "Mixta";
          const total =
            v.total || items.reduce((sum, i) => sum + (Number(i.subtotal) || 0), 0);
          return {
            numero: v.id_venta,
            fecha: v.fecha,
            tipo: tipoVenta,
            observaciones: v.observaciones || "—",
            total,
            productos: items,
          };
        });

        console.log("ventas final:", mapped);
        setVentas(mapped);
      } catch (e) {
        console.error("Error al cargar ventas:", e);
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadVentas();
    const ch = supa
      .channel("ventas-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "venta" }, () =>
        loadVentas()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "detalle_venta" },
        () => loadVentas()
      )
      .subscribe();

    return () => supa.removeChannel(ch);
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

  const handleModificar = async (venta) => {
    try {
      console.log("Buscando detalles de venta:", venta.numero);
      const { data: detalles, error } = await supa
        .from("detalle_venta")
        .select("id_detalle_venta, id_producto, cantidad, precio_unitario, subtotal")
        .eq("id_venta", Number(venta.numero));

      if (error) throw error;

      if (!detalles?.length) {
        alert("No hay productos asociados a esta venta.");
        return;
      }

      const ids = detalles.map((d) => d.id_producto);
      const { data: productos, error: prodErr } = await supa
        .from("productos")
        .select("id_producto, nombre, id_tipo_producto")
        .in("id_producto", ids);

      if (prodErr) throw prodErr;

      const prodMap = new Map(productos.map((p) => [p.id_producto, p]));

      const items = detalles.map((d) => {
        const p = prodMap.get(d.id_producto);
        const tipo = p?.id_tipo_producto === 1 ? "Caja" : "Producto";
        return {
          id_detalle_venta: d.id_detalle_venta,   // ✅ necesario para update
          id_producto: d.id_producto,
          tipo,
          producto: p?.nombre || "—",
          cantidad: Number(d.cantidad) || 0,
          precio: Number(d.precio_unitario) || 0,
          medida: tipo === "Caja" ? "u" : "kg",
          descuento: 0,
          subtotal: Number(d.subtotal) || 0,
        };
      });

      // ✅ incluye numero de venta
      setSelectedVenta({ numero: venta.numero, productos: items });
      setEditOpen(true);
    } catch (e) {
      console.error("Error al cargar detalle venta:", e);
      alert("❌ No se pudo cargar los productos de la venta.");
    }
};

  const handleGuardarCambios = async (updated) => {
    try {
      if (!updated) return setEditOpen(false);

      const productosActualizados = updated.productos.map((p) => ({
        ...p,
        subtotal: Number((p.cantidad * p.precio).toFixed(2)),
      }));
      const totalNuevo = productosActualizados.reduce(
        (acc, p) => acc + p.subtotal,
        0
      );

      for (const p of productosActualizados) {
        const { error } = await supa
          .from("detalle_venta")
          .update({
            cantidad: p.cantidad,
            precio_unitario: p.precio,
            subtotal: p.subtotal,
          })
          .eq("id_detalle_venta", p.id_detalle_venta);
        if (error) throw error;
      }

      const { error: ventaErr } = await supa
        .from("venta")
        .update({ total: totalNuevo })
        .eq("id_venta", updated.numero);
      if (ventaErr) throw ventaErr;

      setEditOpen(false);
      setSelectedVenta(null);
      await loadVentas();
      alert("✅ Venta actualizada correctamente.");
    } catch (e) {
      console.error("Error al guardar cambios:", e);
      alert("❌ Error al guardar: " + e.message);
    }
  };

  const handleAnular = async (id_venta) => {
    if (!idEstadoAnulado) return alert("No se encontró el estado ANULADO");
    if (!confirm(`¿Anular la venta N° ${id_venta}?`)) return;
    try {
      const { error } = await supa
        .from("venta")
        .update({ id_estado: idEstadoAnulado })
        .eq("id_venta", id_venta);
      if (error) throw error;
      alert("Venta anulada correctamente.");
    } catch (e) {
      alert("Error al anular: " + e.message);
    }
  };

  const handleDownloadPDF = (venta) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Detalle de Venta N° ${venta.numero}`, 14, 20);
    const head = [
      ["Tipo", "Producto", "Cantidad", "Medida", "Precio Unitario", "Subtotal"],
    ];
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
  // FILTROS
  // =========================
  const tipoMap = { Todo: null, Productos: "Producto", Cajas: "Caja", Mixtas: "Mixta" };
  const ventasFiltradas = useMemo(() => {
    const tsel = tipoMap[filtroTipo];
    return ventas.filter((v) => {
      if (tsel && v.tipo !== tsel) return false;
      if (filtros.buscar) {
        const txt = filtros.buscar.toLowerCase();
        if (
          !String(v.numero).includes(txt) &&
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
  // COLUMNAS
  // =========================
  const columns = [
    { id: "numero", header: "N° Venta", accessor: "numero", align: "center" },
    { id: "tipo", header: "Tipo", accessor: "tipo", align: "center" },
    { id: "fecha", header: "Fecha", accessor: "fecha", align: "center" },
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
              onClick={() => handleAnular(row.numero)}
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
            rows.reduce(
              (sum, r) =>
                rows.reduce((sum, r) => sum + r.cantidad * r.precio, 0),
            0
          )
          }
          onSave={handleGuardarCambios}
        />
      )}
    </PageContainer>
  );
}
