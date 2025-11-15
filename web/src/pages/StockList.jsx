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
import ProductFormTabs from "../components/forms/ProductFormTabs";

import { apiFetch } from "../lib/apiClient";

const MAX_EXPORT_ROWS = 500;

// 🔎 Helper para mapear id_tipo_producto -> texto
// ⚠️ Ajustá los IDs según tu tabla tipo_producto
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

// 🔢 Helper para formatear cantidad + unidad (entero para "u", decimales para "kg")
function formatDisponible(r) {
  const n = Number(r.disponible ?? 0);

  if (!Number.isFinite(n)) {
    return `0 ${r.unidad || ""}`;
  }

  // 👉 Si es unidad (u) o no hay unidad, sin decimales
  if (!r.unidad || r.unidad === "u") {
    return `${n.toLocaleString("es-AR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })} ${r.unidad || ""}`;
  }

  // 👉 Si es otra cosa (kg), permitimos decimales (hasta 3)
  return `${n.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  })} ${r.unidad}`;
}

// Fecha corta dd-mm-aaaa para mostrar en UI
function formatFechaCorta(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return value; // fallback si viene algo raro

  return d
    .toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "-"); // 14-11-2025
}

// Mapea fila cruda de v_stock_list a la que usa la tabla de React
function mapDbRowToUi(row) {
  // armamos objeto medidas solo si vienen alto/ancho/profundidad
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
    medidas, // 👈 ahora viene de la view
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
  const [filtroTipo, setFiltroTipo] = useState("Todo"); // pills
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

  // === Modal editar (una sola fila)
  const [isEditOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  // === Modal crear nuevo producto (reutiliza ProductFormTabs)
  const [isNewOpen, setNewOpen] = useState(false);

  // === Modal detalle (notas, etc.)
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);

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
    // 1) por pill (tipo)
    const tSel = tipoMap[filtroTipo];
    if (tSel && r.tipo.toLowerCase() !== tSel.toLowerCase()) return false;

    // 2) búsqueda de texto
    if (filtros.buscar) {
      const t = filtros.buscar.toLowerCase();
      const hit =
        r.referencia?.toLowerCase().includes(t) ||
        r.tipo?.toLowerCase().includes(t);
      if (!hit) return false;
    }

    // 3) filtros específicos
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

    // 4) fechas (ultimoMov: YYYY-MM-DD)
    if (r.ultimoMov) {
      const f = new Date(r.ultimoMov);
      if (filtros.desde && f < new Date(filtros.desde)) return false;
      if (filtros.hasta && f > new Date(filtros.hasta)) return false;
    }

    return true;
  });

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
      },
      {
        id: "categoria",
        header: "Categoría",
        accessor: (r) => (r.tipo === "Caja" ? r.categoria || "—" : "—"),
        sortable: true,
        sortAccessor: (r) =>
          r.tipo === "Caja" ? (r.categoria || "").toLowerCase() : "",
      },
      {
        id: "medida",
        header: "Medida",
        accessor: (r) =>
          r.tipo === "Caja" && r.medidas
            ? `${r.medidas.l}x${r.medidas.a}x${r.medidas.h} cm`
            : "—",
      },
      {
        id: "disp",
        header: "Disponible (u/kg)",
        accessor: (r) => formatDisponible(r), // 👈 usamos el helper
        align: "right",
        cellClass: "text-right whitespace-nowrap",
        sortable: true,
        sortAccessor: (r) => Number(r.disponible || 0), // ordena por el número crudo
      },
      {
        id: "ult",
        header: "Últ. mov.",
        accessor: "ultimoMov",
        cellClass: "whitespace-nowrap",
        sortable: true,
        // para ordenar bien por fecha
        sortAccessor: (r) => {
          if (!r.ultimoMov) return 0;
          const d = new Date(r.ultimoMov);
          return isNaN(d.getTime()) ? 0 : d.getTime();
        },
        // para mostrarla cortita en la tabla
        render: (r) => {
          if (!r.ultimoMov) return "—";

          const d = new Date(r.ultimoMov);
          if (isNaN(d.getTime())) return r.ultimoMov; // fallback

          return d
            .toLocaleDateString("es-AR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })
            .replace(/\//g, "-"); // 14-11-2025
        },
      },
      {
        id: "precio",
        header: "Precio unitario",
        accessor: (r) =>
          r.precio?.toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
          }) ?? "—",
        align: "right",
        cellClass: "text-right whitespace-nowrap",
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
            DETALLE
          </button>
        ),
      },
      {
        id: "acciones",
        header: "Acciones",
        align: "center",
        cellClass: "text-center",
        render: (row) => (
          <button
            onClick={() => {
              setEditRow(row);
              setEditOpen(true);
            }}
            className="bg-[#154734] text-white px-3 py-1 text-xs rounded-md hover:bg-[#1E5A3E]"
          >
            MODIFICAR
          </button>
        ),
      },
    ],
    []
  );

  // =========================
  // EXPORTAR PDF (usa dataFiltrada)
  // =========================
  const onExport = () => {
    if (!dataFiltrada.length) {
      alert("No hay datos de stock para exportar.");
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

      // 👉 usamos el mismo formateo que en la grilla
      const dispStr = formatDisponible(r);

      const precioStr =
        r.precio != null ? `$${Number(r.precio).toLocaleString("es-AR")}` : "—";

      return [
        r.tipo || "",
        r.referencia || "",
        categoriaStr,
        medidaStr,
        dispStr,
        formatFechaCorta(r.ultimoMov), // 👈 fecha corta también en el PDF
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
  // Guardar cambios desde el modal Modified (solo front por ahora)
  // =========================
  const handleSaveEdited = (payload) => {
    let updated = payload?.rows?.[0];
    if (!updated || !editRow) return;

    if (editRow.tipo === "Caja") {
      const l = Number(updated.l ?? editRow.medidas?.l ?? 0);
      const a = Number(updated.a ?? editRow.medidas?.a ?? 0);
      const h = Number(updated.h ?? editRow.medidas?.h ?? 0);
      updated = {
        ...updated,
        medidas: { l, a, h },
      };
      delete updated.l;
      delete updated.a;
      delete updated.h;
      updated.unidad = "u";
    } else {
      if (updated.unidad !== "kg" && updated.unidad !== "u") {
        updated.unidad = editRow.unidad;
      }
    }

    updated.ultimoMov = editRow.ultimoMov;

    setItems((prev) =>
      prev.map((r) => (r.id === editRow.id ? { ...r, ...updated } : r))
    );
  };

  const mapFormToRow = (v) => {
    if (v.tipo === "Caja") {
      return {
        id: crypto.randomUUID?.() || String(Date.now()),
        tipo: "Caja",
        referencia: v.referencia,
        categoria: v.categoria,
        medidas: {
          l: Number(v.medidas.l || 0),
          a: Number(v.medidas.a || 0),
          h: Number(v.medidas.h || 0),
        },
        unidad: "u",
        disponible: Number(v.cantidad || 0),
        ultimoMov: new Date().toISOString().slice(0, 10),
        precio: Number(v.precio || 0),
        notas: v.notas || "",
      };
    } else {
      return {
        id: crypto.randomUUID?.() || String(Date.now()),
        tipo: "Material",
        referencia: v.referencia,
        categoria: "—",
        unidad: v.unidad,
        disponible: Number(v.cantidad || 0),
        ultimoMov: new Date().toISOString().slice(0, 10),
        precio: Number(v.precio || 0),
        notas: v.notas || "",
      };
    }
  };

  const editColumns = useMemo(() => {
    if (!editRow) return [];

    const cols = [
      { key: "referencia", label: "Referencia", readOnly: true },
      { key: "tipo", label: "Tipo", readOnly: true },
      {
        key: "disponible",
        label: "Disponible",
        type: "number",
        align: "text-center",
      },
      {
        key: "precio",
        label: "Precio unitario",
        type: "number",
        align: "text-center",
      },
      {
        key: "ultimoMov",
        label: "Últ. mov.",
        readOnly: true,
        align: "text-center",
      },
    ];

    if (editRow.tipo === "Caja") {
      cols.splice(
        2,
        0,
        { key: "categoria", label: "Categoría" },
        { key: "l", label: "Largo (cm)", type: "number", align: "text-center" },
        { key: "a", label: "Ancho (cm)", type: "number", align: "text-center" },
        { key: "h", label: "Alto (cm)", type: "number", align: "text-center" }
      );
      cols.splice(5, 0, { key: "unidad", label: "Unidad", readOnly: true });
    } else {
      cols.splice(2, 0, {
        key: "unidad",
        label: "Unidad",
        type: "select",
        options: [
          { value: "kg", label: "kg" },
          { value: "u", label: "u" },
        ],
        align: "text-center",
      });
    }

    return cols;
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
            onClick={() => setNewOpen(true)}
            className="rounded-md border border-[#154734] text-[#154734] px-4 py-2 hover:bg-[#e8f4ef]"
          >
            + Nuevo producto
          </button>
          <button
            type="button"
            onClick={() => nav("pesaje")}
            className="rounded-md border border-[#154734] text-[#154734] px-4 py-2 hover:bg-[#e8f4ef]"
          >
            Registrar Pesaje
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

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-slate-600">Cargando stock…</p>
        ) : (
          <DataTable
            columns={columns}
            data={dataFiltrada}
            zebra={false}
            stickyHeader={false}
            wrapperClass="!mb-0"
            tableClass="w-full table-fixed text-sm border-collapse"
            theadClass="bg-[#e8f4ef] text-[#154734]"
            rowClass="hover:bg-[#f6faf7] border-t border-[#edf2ef] first:border-t-0"
            headerClass="px-4 py-3 font-semibold"
            cellClass="px-4 py-4"
            enableSort
          />
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
          labels={{ caja: "Caja", material: "Producto" }}
          onCancel={() => setNewOpen(false)}
          onSubmit={async (values) => {
            try {
              // POST al backend
              const row = await apiFetch("/api/stock/productos", {
                method: "POST",
                body: JSON.stringify(values),
              });

              // la view devuelve una fila de v_stock_list → la mapeamos a UI
              const uiRow = mapDbRowToUi(row);

              // metemos el nuevo producto arriba del listado
              setItems((prev) => [uiRow, ...prev]);
              setNewOpen(false);
            } catch (e) {
              console.error("Error al crear producto:", e);
              alert(e.message || "Error al crear producto");
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
                // mostramos fecha formateada SOLO en el formulario
                ultimoMov: formatFechaCorta(editRow.ultimoMov),
                ...(editRow.tipo === "Caja"
                  ? {
                      l: editRow.medidas?.l ?? "",
                      a: editRow.medidas?.a ?? "",
                      h: editRow.medidas?.h ?? "",
                    }
                  : {}),
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
    </PageContainer>
  );
}
