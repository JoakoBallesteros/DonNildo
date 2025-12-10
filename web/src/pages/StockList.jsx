// src/pages/StockList.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import PageContainer from "../components/pages/PageContainer";
import FilterBar from "../components/forms/FilterBars";
import DataTable from "../components/tables/DataTable";
import Modified from "../components/modals/Modified";
import Modal from "../components/modals/Modals";
import MessageModal from "../components/modals/MessageModal";
import ProductFormTabs from "../components/forms/ProductFormTabs";

import { apiFetch } from "../lib/apiClient";

const MAX_EXPORT_ROWS = 500;

// 🔎 Helper para mapear id_tipo_producto -> texto
function mapTipoPorId(id_tipo_producto, fallback) {
  if (fallback) return fallback;
  switch (id_tipo_producto) {
    case 1:
      return "Caja";
    case 2:
      return "Material";
    default:
      return "Material";
  }
}

// Calcula categoría de caja según la mayor dimensión
function calcCategoriaCaja(l, a, h) {
  const maxDim = Math.max(Number(l) || 0, Number(a) || 0, Number(h) || 0);
  if (!maxDim) return "";
  if (maxDim <= 30) return "Chica";
  if (maxDim <= 60) return "Mediana";
  return "Grande";
}

// 🔢 Formateo de cantidad + unidad
function formatDisponible(r) {
  const n = Number(r.disponible ?? 0);

  if (!Number.isFinite(n)) {
    return `0 ${r.unidad || ""}`;
  }

  if (!r.unidad || r.unidad === "u") {
    return `${n.toLocaleString("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })} ${r.unidad || ""}`;
  }

  return `${n.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })} ${r.unidad}`;
}

// Fecha corta dd-mm-aaaa
function formatFechaCorta(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;

  return d
    .toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "-");
}

// Mapea fila cruda de la view a UI
function mapDbRowToUi(row) {
  let medidas = null;
  if (row.alto != null && row.ancho != null && row.profundidad != null) {
    medidas = {
      l: Number(row.alto),
      a: Number(row.ancho),
      h: Number(row.profundidad),
    };
  }

  return {
    id: row.id_producto,
    tipo: row.tipo || mapTipoPorId(row.id_tipo_producto),
    referencia: row.referencia,
    categoria: row.categoria || "—",
    unidad: row.unidad_stock || row.unidad || "",
    disponible: row.disponible ?? 0,
    ultimoMov: row.ultimo_mov || row.ultimoMov || "",
    precio: row.precio ?? null,
    medidas,
    notas: row.notas || "",
  };
}

export default function StockList() {
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // === Filtros
  const [filtroTipo, setFiltroTipo] = useState("Todo");
  const [filtros, setFiltros] = useState({
    buscar: "",
    categoria: "",
    medida: "",
    medidaL: "",
    medidaA: "",
    medidaH: "",
    desde: "",
    hasta: "",
  });
  const [resetSignal, setResetSignal] = useState(0);

  // === Modal editar
  const [isEditOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  // === Modal crear nuevo producto
  const [isNewOpen, setNewOpen] = useState(false);

  // === Modal detalle
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);

  // === Modales de mensajes y confirmaciones (igual estilo que Ventas)
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    title: "",
    text: "",
    type: "",
  });

  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // =========================
  // CARGA DESDE BACKEND
  // =========================
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");

      const [stockRows, cats, units] = await Promise.all([
        apiFetch("/api/stock"),
        apiFetch("/api/stock/categorias"),
        apiFetch("/api/stock/unidades"),
      ]);

      setItems((stockRows || []).map(mapDbRowToUi));
      setCategorias(cats || []);
      setUnidades(units || []);
    } catch (e) {
      console.error("Error al cargar stock:", e);
      setErr(e.message || "Error al cargar stock");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // =========================
  // FILTROS
  // =========================

  const tipoMap = {
    Todo: null,
    Cajas: "Caja",
    Materiales: "Material",
  };

  const categoriaOptions = useMemo(
    () => [
      { value: "", label: "Todas" },
      ...(categorias || []).map((c) => ({
        value: c.nombre,
        label: c.nombre,
      })),
    ],
    [categorias]
  );

  const unidadOptions = useMemo(
    () => [
      { value: "", label: "Todas" },
      ...(unidades || []).map((u) => ({
        value: u.unidad,
        label: u.unidad,
      })),
    ],
    [unidades]
  );

  const aplicarFiltros = ({
    buscar,
    categoria,
    medida,
    medidaL,
    medidaA,
    medidaH,
    desde,
    hasta,
    tipo,
  }) => {
    setFiltros({
      buscar: buscar || "",
      categoria: categoria ?? "",
      medida: medida ?? "",
      medidaL: medidaL ?? "",
      medidaA: medidaA ?? "",
      medidaH: medidaH ?? "",
      desde: desde || "",
      hasta: hasta || "",
    });
    if (tipo) setFiltroTipo(tipo);
  };

  const reiniciarFiltros = () => {
    setFiltros({
      buscar: "",
      categoria: "",
      medida: "",
      medidaL: "",
      medidaA: "",
      medidaH: "",
      desde: "",
      hasta: "",
    });
    setFiltroTipo("Todo");
    setResetSignal((n) => n + 1);
  };

  const handleFilterSelect = (tipo) => setFiltroTipo(tipo);

  const filterFields = [
    {
      label: "Referencia / material",
      type: "text",
      placeholder: "Buscar…",
      name: "buscar",
    },
    ...(filtroTipo === "Cajas"
      ? [
        {
          label: "Categoría",
          type: "select",
          name: "categoria",
          options: categoriaOptions,
        },
        {
          label: "Largo (cm)",
          type: "number",
          name: "medidaL",
          placeholder: "Ej: 40",
        },
        {
          label: "Ancho (cm)",
          type: "number",
          name: "medidaA",
          placeholder: "Ej: 30",
        },
        {
          label: "Alto (cm)",
          type: "number",
          name: "medidaH",
          placeholder: "Ej: 20",
        },
      ]
      : [
        {
          label: "Unidad",
          type: "select",
          name: "medida",
          inputClass: "lg:w-40",
          options: unidadOptions,
        },
      ]),
    { label: "Desde", type: "date", name: "desde", inputClass: "w-44" },
    { label: "Hasta", type: "date", name: "hasta", inputClass: "w-44" },
  ];

  // === Filtrado (cliente)
  const dataFiltrada = items.filter((r) => {
    const tSel = tipoMap[filtroTipo];
    if (tSel && r.tipo.toLowerCase() !== tSel.toLowerCase()) return false;

    if (filtros.buscar) {
      const t = filtros.buscar.toLowerCase();
      const hit =
        r.referencia?.toLowerCase().includes(t) ||
        r.tipo?.toLowerCase().includes(t);
      if (!hit) return false;
    }

    if (filtroTipo === "Cajas") {
      if (filtros.categoria && r.categoria !== filtros.categoria) return false;

      const L = Number(filtros.medidaL || 0);
      const A = Number(filtros.medidaA || 0);
      const H = Number(filtros.medidaH || 0);
      if (L || A || H) {
        const ml = r.medidas?.l ?? null;
        const ma = r.medidas?.a ?? null;
        const mh = r.medidas?.h ?? null;
        if (L && ml !== L) return false;
        if (A && ma !== A) return false;
        if (H && mh !== H) return false;
      }
    } else {
      if (filtros.medida && filtros.medida !== r.unidad) return false;
    }

    if (r.ultimoMov) {
      const f = new Date(r.ultimoMov);
      if (filtros.desde && f < new Date(filtros.desde)) return false;
      if (filtros.hasta && f > new Date(filtros.hasta)) return false;
    }

    return true;
  });

  // =========================
  // ELIMINAR (con modal de confirmación + mensaje)
  // =========================
  const openDeleteConfirm = useCallback((row) => {
    setProductToDelete(row);
    setDeleteConfirmOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!productToDelete) return;

    try {
      setDeleteConfirmOpen(false);

      await apiFetch(`/api/stock/productos/${productToDelete.id}`, {
        method: "DELETE",
      });

      setItems((prev) => prev.filter((r) => r.id !== productToDelete.id));

      setMessageModal({
        isOpen: true,
        title: "✅ Producto eliminado",
        text: `El producto "${productToDelete.referencia}" fue eliminado correctamente.`,
        type: "success",
      });
    } catch (e) {
      console.error("Error al eliminar producto:", e);
      setMessageModal({
        isOpen: true,
        title: "❌ Error al eliminar",
        text: e.message || "Error al eliminar producto",
        type: "error",
      });
    } finally {
      setProductToDelete(null);
    }
  }, [productToDelete]);

  // =========================
  // COLUMNAS TABLA
  // =========================
  const columns = useMemo(
    () => [
      { id: "tipo", header: "Tipo", accessor: "tipo", sortable: true },
      {
        id: "referencia",
        header: "Referencia",
        accessor: "referencia",
        sortable: true,
         align: "center",
         cellClass: "text-center",
      },
      {
        id: "categoria",
        header: "Categoría",
        accessor: (r) => (r.tipo === "Caja" ? r.categoria || "—" : "—"),
        sortable: true,
        sortAccessor: (r) =>
          r.tipo === "Caja" ? (r.categoria || "").toLowerCase() : "",
        align: "center",
         cellClass: "text-center",
      },
      {
        id: "medida",
        header: "Medida",
        accessor: (r) =>
          r.tipo === "Caja" && r.medidas
            ? `${r.medidas.l}x${r.medidas.a}x${r.medidas.h} cm`
            : "—",
            align: "center",
         cellClass: "text-center",
      },
      {
        id: "disp",
        header: "Disponible (u/kg)",
        accessor: (r) => formatDisponible(r),
        align: "center",
        cellClass: "text-center whitespace-nowrap",
        sortable: true,
        sortAccessor: (r) => Number(r.disponible || 0),
        
      },
      {
        id: "ult",
        header: "Últ. mov.",
        accessor: "ultimoMov",
        cellClass: "whitespace-nowrap, text-center",
        sortable: true,
         align: "center",
        sortAccessor: (r) => {
          if (!r.ultimoMov) return 0;
          const d = new Date(r.ultimoMov);
          return isNaN(d.getTime()) ? 0 : d.getTime();
        },
        render: (r) => {
          if (!r.ultimoMov) return "—";
          const d = new Date(r.ultimoMov);
          if (isNaN(d.getTime())) return r.ultimoMov;
          return d
            .toLocaleDateString("es-AR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
            .replace(/\//g, "-");
        },
      },
      {
        id: "precio",
        header: "Precio unitario",
        
        accessor: (r) => {
          if (r.precio == null) return "—";

          const monto = Number(r.precio).toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
          });

          const unidad = r.unidad || "u"; // u / kg
          return `${monto} / ${unidad}`;
        },
        align: "center",
        cellClass: "text-center whitespace-nowrap",
        sortable: true,
        sortAccessor: (r) => Number(r.precio || 0),
      },
      {
        id: "detalle",
        header: "Detalle",
        align: "center",
        cellClass: "text-center",
        render: (row) => (
          <button
            onClick={() => {
              setDetailRow(row);
              setDetailOpen(true);
            }}
            className="border border-[#154734] text-[#154734] px-3 py-1 text-xs rounded-md hover:bg-[#e8f4ef]"
          >
            Ver Detalle
          </button>
        ),
      },
      {
        id: "acciones",
        header: "Acciones",
        align: "center",
        cellClass: "text-center",
        render: (row) => (
          <div className="flex justify-center items-center gap-1">

            <div className="flex flex-row items-center gap-1">
              <button
                onClick={() => {
                  setEditRow(row);
                  setEditOpen(true);
                }}
                className="bg-[#154734] text-white px-2 py-1 text-xs rounded-md hover:bg-[#1E5A3E]"
              >
                MODIFICAR
              </button>
              <button
                onClick={() => openDeleteConfirm(row)}
                className="bg-red-700 text-white px-2 py-1 text-xs rounded-md hover:bg-red-800"
              >
                ELIMINAR
              </button>
            </div>
          </div>
        ),
      },
    ],
    [openDeleteConfirm]
  );

  // =========================
  // EXPORTAR PDF
  // =========================
  const onExport = () => {
    if (!dataFiltrada.length) {
      setMessageModal({
        isOpen: true,
        title: "Información",
        text: "No hay datos de stock para exportar.",
        type: "error",
      });
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Listado de stock", 14, 18);

    let filas = dataFiltrada;
    let startY = 22;

    if (dataFiltrada.length > MAX_EXPORT_ROWS) {
      filas = dataFiltrada.slice(0, MAX_EXPORT_ROWS);
      doc.setFontSize(9);
      doc.text(
        `* Exportadas solo las primeras ${MAX_EXPORT_ROWS} filas (de ${dataFiltrada.length}).`,
        14,
        24
      );
      startY = 30;
    }

    const head = [
      [
        "Tipo",
        "Referencia",
        "Categoría",
        "Medida",
        "Disponible",
        "Últ. mov.",
        "Precio unit.",
      ],
    ];

    const body = filas.map((r) => {
      const medidaStr =
        r.tipo === "Caja" && r.medidas
          ? `${r.medidas.l}x${r.medidas.a}x${r.medidas.h} cm`
          : "—";

      const categoriaStr = r.tipo === "Caja" ? r.categoria || "—" : "—";
      const dispStr = formatDisponible(r);
      const precioStr =
        r.precio != null
          ? `${Number(r.precio).toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
          })} / ${r.unidad || "u"}`
          : "—";

      return [
        r.tipo || "",
        r.referencia || "",
        categoriaStr,
        medidaStr,
        dispStr,
        formatFechaCorta(r.ultimoMov),
        precioStr,
      ];
    });

    autoTable(doc, {
      startY,
      head,
      body,
    });

    const today = new Date().toISOString().slice(0, 10);
    doc.save(`Stock_${today}.pdf`);
  };

  // =========================
  // Guardar cambios desde el modal Modified
  // =========================
  const handleSaveEdited = async (payload) => {
    let updated = payload?.rows?.[0];
    if (!updated || !editRow) return;

    if (editRow.tipo === "Caja") {
      const l = Number(updated.l ?? editRow.medidas?.l ?? 0);
      const a = Number(updated.a ?? editRow.medidas?.a ?? 0);
      const h = Number(updated.h ?? editRow.medidas?.h ?? 0);

      const nuevaCategoria = calcCategoriaCaja(l, a, h);

      const disponible =
        parseInt(updated.disponible ?? editRow.disponible ?? 0, 10) || 0;
      const precio = Number(updated.precio ?? editRow.precio ?? 0) || 0;

      updated = {
        ...updated,
        tipo: "Caja",
        categoria: nuevaCategoria,
        medidas: { l, a, h },
        unidad: "u",
        disponible,
        precio,
      };

      delete updated.l;
      delete updated.a;
      delete updated.h;
    } else {
      const disponible =
        Number(updated.disponible ?? editRow.disponible ?? 0) || 0;
      const precio = Number(updated.precio ?? editRow.precio ?? 0) || 0;

      updated = {
        ...updated,
        disponible,
        precio,
        unidad:
          updated.unidad === "kg" || updated.unidad === "u"
            ? updated.unidad
            : editRow.unidad,
      };
    }

    updated.ultimoMov = editRow.ultimoMov;
    const notas = updated.notas ?? editRow.notas ?? "";

    const body = {
      referencia: updated.referencia,
      tipo: editRow.tipo,
      medidas: editRow.tipo === "Caja" ? updated.medidas : null,
      unidad: updated.unidad,
      disponible: updated.disponible,
      precio: updated.precio,
      notas,
    };

    try {
      const row = await apiFetch(`/api/stock/productos/${editRow.id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });

      const uiRow = mapDbRowToUi(row);

      setItems((prev) => prev.map((r) => (r.id === uiRow.id ? uiRow : r)));
      setEditOpen(false);
      setEditRow(null);

      setMessageModal({
        isOpen: true,
        title: "✅ Producto actualizado",
        text: "Los datos del producto se actualizaron correctamente.",
        type: "success",
      });
    } catch (e) {
      console.error("Error al actualizar producto:", e);
      setMessageModal({
        isOpen: true,
        title: "❌ Error al actualizar",
        text: e.message || "Error al actualizar producto",
        type: "error",
      });
    }
  };

  const editColumns = useMemo(() => {
    if (!editRow) return [];

    if (editRow.tipo === "Caja") {
      return [
        { key: "referencia", label: "Nombre / Modelo" },
        { key: "l", label: "Largo (cm)", type: "number", align: "text-center" },
        { key: "a", label: "Ancho (cm)", type: "number", align: "text-center" },
        { key: "h", label: "Alto (cm)", type: "number", align: "text-center" },
        { key: "unidad", label: "Unidad", readOnly: true },
        {
          key: "disponible",
          label: "Disponible",
          type: "number",
          step: 1,
          align: "text-center",
        },
        {
          key: "precio",
          label: "Precio unitario",
          type: "number",
          step: "0.01",
          align: "text-center",
        },
        {
          key: "ultimoMov",
          label: "Últ. mov.",
          readOnly: true,
          align: "text-center",
        },
        {
          key: "notas",
          label: "Notas / Descripción",
          type: "textarea",
        },
      ];
    }

    return [
      { key: "referencia", label: "Nombre" },
      {
        key: "unidad",
        label: "Unidad",
        type: "select",
        options: [
          { value: "kg", label: "kg" },
          { value: "u", label: "u" },
        ],
        align: "text-center",
      },
      {
        key: "disponible",
        label: "Disponible",
        type: "number",
        step: "0.001",
        align: "text-center",
      },
      {
        key: "precio",
        label: "Precio unitario",
        type: "number",
        step: "0.01",
        align: "text-center",
      },
      {
        key: "ultimoMov",
        label: "Últ. mov.",
        readOnly: true,
        align: "text-center",
      },
      {
        key: "notas",
        label: "Notas / Descripción",
        type: "textarea",
      },
    ];
  }, [editRow]);

  // =========================
  // RENDER
  // =========================
  return (
    <PageContainer
      title="Stock"
      actions={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => nav("pesaje")}
            className="flex items-center gap-2 bg-[#154734] text-white px-4 py-2 rounded-md hover:bg-[#103a2b] transition"
          >
            Registrar Pesaje
          </button>
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="rounded-md border border-[#154734] text-[#154734] px-4 py-2 hover:bg-[#e8f4ef]"
          >
            + Nuevo producto
          </button>
          
        </div>
      }
    >
      <FilterBar
        filters={["Todo", "Cajas", "Materiales"]}
        fields={filterFields}
        onApply={aplicarFiltros}
        onReset={reiniciarFiltros}
        onFilterSelect={handleFilterSelect}
        resetSignal={resetSignal}
        selectedFilter={filtroTipo}
      />

      {err && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {err}
        </div>
      )}

      <div className="mt-6 space-y-5">
        {loading ? (
          <p className="text-sm text-slate-600">Cargando stock…</p>
        ) : (
          <>
            <div className="hidden md:block">
              <DataTable
                columns={columns}
                data={dataFiltrada}
                zebra={false}
                stickyHeader={true}
                  wrapperClass="dn-table-wrapper-tall overflow-y-auto shadow-sm !mb-0"

                tableClass="w-full table-fixed text-sm border-collapse"
                theadClass="bg-[#e8f4ef] text-[#154734]"
                rowClass="hover:bg-[#f6faf7] border-t border-[#edf2ef] first:border-t-0"
                headerClass="px-4 py-3 font-semibold"
                cellClass="px-4 py-3"
                enableSort
              />
            </div>

            <div className="md:hidden space-y-3">
              {!dataFiltrada.length && (
                <div className="rounded-2xl border border-dashed border-[#d8e4df] bg-[#f7fbf9] px-4 py-6 text-center text-sm text-[#62736a]">
                  No hay productos que coincidan con los filtros.
                </div>
              )}
              {dataFiltrada.map((row) => (
                <div
                  key={row.id}
                  className="rounded-2xl border border-[#e3e9e5] bg-white shadow-sm p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#7a8b82]">
                        {row.tipo}
                      </p>
                      <p className="text-lg font-semibold text-[#0d231a]">
                        {row.referencia}
                      </p>
                      {row.tipo === "Caja" && (
                        <p className="text-sm text-[#4c5f56]">
                          {row.categoria || "—"} ·{" "}
                          {row.medidas
                            ? `${row.medidas.l}x${row.medidas.a}x${row.medidas.h} cm`
                            : "—"}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-[#7a8b82]">
                        Disponible
                      </p>
                      <p className="text-base font-semibold text-[#154734]">
                        {formatDisponible(row)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm text-[#1f2e27]">
                    <div>
                      <p className="text-xs font-semibold text-[#7a8b82]">
                        Unidad
                      </p>
                      <p className="font-medium">{row.unidad || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#7a8b82]">
                        Último mov.
                      </p>
                      <p className="font-medium">
                        {row.ultimoMov ? formatFechaCorta(row.ultimoMov) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#7a8b82]">
                        Precio
                      </p>
                      <p className="font-medium">
                        {row.precio != null
                          ? `${Number(row.precio).toLocaleString("es-AR", {
                            style: "currency",
                            currency: "ARS",
                            maximumFractionDigits: 0,
                          })} / ${row.unidad || "u"}`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#7a8b82]">
                        Observaciones
                      </p>
                      <p className="font-medium">
                        {row.notas?.trim() || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setDetailRow(row);
                        setDetailOpen(true);
                      }}
                      className="flex-1 rounded-md border border-[#154734] text-[#154734] px-3 py-2 text-sm font-medium hover:bg-[#e8f4ef] transition"
                    >
                      Detalle
                    </button>
                    <button
                      onClick={() => {
                        setEditRow(row);
                        setEditOpen(true);
                      }}
                      className="flex-1 rounded-md bg-[#154734] text-white px-3 py-2 text-sm font-medium hover:bg-[#103a2b] transition"
                    >
                      Modificar
                    </button>
                    <button
                      onClick={() => openDeleteConfirm(row)}
                      className="flex-1 rounded-md bg-red-700 text-white px-3 py-2 text-sm font-medium hover:bg-red-800 transition"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Export */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onExport}
          className="inline-flex items-center gap-2 rounded-md bg-[#0f7a4e] text-white px-4 py-2 hover:bg-[#0d6843]"
        >
          <Download className="h-4 w-4" />
          Exportar (PDF)
        </button>
      </div>

      {/* Modal CREAR */}
      <Modal
        isOpen={isNewOpen}
        title="Registrar nuevo producto"
        onClose={() => setNewOpen(false)}
        size="max-w-2xl"
      >
        <ProductFormTabs
          mode="create"
          initialValues={{
            tipo: "Caja",
            referencia: "",
            categoria: "",
            medidas: { l: "", a: "", h: "" },
            unidad: "u",
            cantidad: "",
            precio: "",
            notas: "",
          }}
          labels={{ caja: "Caja", material: "Material" }}
          onCancel={() => setNewOpen(false)}
          onSubmit={async (values) => {
            try {
              const row = await apiFetch("/api/stock/productos", {
                method: "POST",
                body: JSON.stringify(values),
              });

              const uiRow = mapDbRowToUi(row);
              setItems((prev) => [uiRow, ...prev]);
              setNewOpen(false);

              setMessageModal({
                isOpen: true,
                title: "✅ Producto creado",
                text: `El producto "${uiRow.referencia}" fue creado correctamente.`,
                type: "success",
              });
            } catch (e) {
              console.error("Error al crear producto:", e);
              setMessageModal({
                isOpen: true,
                title: "❌ Error al crear",
                text: e.message || "Error al crear producto",
                type: "error",
              });
            }
          }}
        />
      </Modal>

      {/* Modal EDITAR */}
      {editRow && (
        <Modified
          isOpen={isEditOpen}
          onClose={() => setEditOpen(false)}
          title={`Modificar stock de ${editRow.referencia}`}
          data={{
            rows: [
              {
                ...editRow,
                ultimoMov: formatFechaCorta(editRow.ultimoMov),
                notas: editRow.notas ?? "",
                ...(editRow.tipo === "Caja"
                  ? {
                    l: editRow.medidas?.l ?? "",
                    a: editRow.medidas?.a ?? "",
                    h: editRow.medidas?.h ?? "",
                    disponible: Math.round(editRow.disponible ?? 0),
                  }
                  : {
                    disponible: editRow.disponible ?? 0,
                  }),
              },
            ],
          }}
          itemsKey="rows"
          columns={editColumns}
          onSave={handleSaveEdited}
        />
      )}

      {/* Modal DETALLE */}
      {detailRow && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setDetailOpen(false)}
          title={`Detalle de ${detailRow.referencia}`}
          size="max-w-lg"
        >
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="font-semibold text-[#154734]">Tipo:</span>
              <span className="col-span-2">{detailRow.tipo}</span>

              <span className="font-semibold text-[#154734]">Categoría:</span>
              <span className="col-span-2">
                {detailRow.tipo === "Caja" ? detailRow.categoria || "—" : "—"}
              </span>

              <span className="font-semibold text-[#154734]">Medidas:</span>
              <span className="col-span-2">
                {detailRow.tipo === "Caja" && detailRow.medidas
                  ? `${detailRow.medidas.l}x${detailRow.medidas.a}x${detailRow.medidas.h} cm`
                  : "—"}
              </span>

              <span className="font-semibold text-[#154734]">Unidad:</span>
              <span className="col-span-2">{detailRow.unidad}</span>

              <span className="font-semibold text-[#154734]">Disponible:</span>
              <span className="col-span-2">{formatDisponible(detailRow)}</span>

              <span className="font-semibold text-[#154734]">Últ. mov.:</span>
              <span className="col-span-2">
                {formatFechaCorta(detailRow.ultimoMov)}
              </span>

              <span className="font-semibold text-[#154734]">
                Precio unit.:
              </span>
              <span className="col-span-2">
                {detailRow.precio?.toLocaleString("es-AR", {
                  style: "currency",
                  currency: "ARS",
                  maximumFractionDigits: 0,
                }) ?? "—"}
              </span>
            </div>

            <div>
              <div className="font-semibold text-[#154734] mb-1">Notas</div>
              <div className="rounded-md border border-[#e2e8e4] bg-[#f8fbf9] p-3 whitespace-pre-wrap">
                {detailRow.notas?.trim() || "—"}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setDetailOpen(false)}
                className="rounded-md border border-[#154734] text-[#154734] px-4 py-2 hover:bg-[#e8f4ef]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal CONFIRMAR ELIMINACIÓN (MessageModal en modo confirm) */}
      <MessageModal
        isOpen={isDeleteConfirmOpen}
        title="Confirmar eliminación"
        text={`¿Estás seguro de que quieres eliminar el producto ${productToDelete?.referencia || ""}? Esta acción no se puede deshacer.`}
        type="warning"
        confirm
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        confirmText="Sí, eliminar"
        cancelText="Volver"
      />

      {/* Modal MENSAJE (success / error) */}
      <MessageModal
        isOpen={messageModal.isOpen}
        title={messageModal.title}
        text={messageModal.text}
        type={messageModal.type}
        onClose={() => setMessageModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </PageContainer>
  );
}
