// src/pages/Compras.jsx
import { useEffect, useMemo, useState } from "react";
import { Plus, Filter, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../lib/apiClient";

/* Layout */
import PageContainer from "../components/pages/PageContainer.jsx";

/* Componentes reutilizables */
import PrimaryButton from "../components/buttons/PrimaryButton.jsx";

/* Barra de filtros */
import FilterBar from "../components/forms/FilterBars.jsx";

/* Tabla genérica */
import DataTable from "../components/tables/DataTable.jsx";

/* Modales reutilizables */
import Details from "../components/modals/Details.jsx";
import Modified from "../components/modals/Modified.jsx";

/* ===== Datos mock (fallback si la API falla) ===== */
const INITIAL = [
  {
    id: "OC-0003",
    proveedor: "Vidrios Industriales",
    tipo: "Mixtas",
    total: 900,
    fecha: "2024-09-30",
    obs: "—",
    items: [
      {
        producto: "PRITTY20X20",
        medida: "20x20",
        cantidad: 1,
        precio: 900,
        descuento: 0,
        subtotal: 900,
      },
    ],
  },
  {
    id: "OC-0002",
    proveedor: "Plásticos del Sur",
    tipo: "Cajas",
    total: 1800,
    fecha: "2024-10-02",
    obs: "—",
    items: [
      {
        producto: "Caja 40x30",
        medida: "40x30",
        cantidad: 1,
        precio: 1800,
        descuento: 0,
        subtotal: 1800,
      },
    ],
  },
  {
    id: "OC-0001",
    proveedor: "Reciclados Norte S.A.",
    tipo: "Materiales",
    total: 2500,
    fecha: "2024-10-04",
    obs: "—",
    items: [
      {
        producto: "Papel blanco",
        medida: "kg",
        cantidad: 5,
        precio: 500,
        descuento: 0,
        subtotal: 2500,
      },
    ],
  },
];

const TABS = ["Todo", "Materiales", "Cajas", "Mixtas"];
const fmtARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

// Saca el número de un ID tipo "OC-0012" → 12
function getNumericIdFromDisplay(id) {
  if (typeof id === "number") return id;
  const match = String(id).match(/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function mapCompraFromApi(c) {
  // Normalizamos varios posibles nombres de campos para que el front no explote
  const idRaw = c.id ?? c.id_compra ?? c.numero_oc;
  const id =
    typeof idRaw === "string"
      ? idRaw
      : idRaw != null
      ? `OC-${String(idRaw).padStart(4, "0")}`
      : "OC-S/N";

  // ID numérico real de la compra en la DB
  const dbId =
    typeof c.id_compra === "number"
      ? c.id_compra
      : typeof idRaw === "number"
      ? idRaw
      : null;

  const proveedor =
    c.proveedor ?? c.proveedor_nombre ?? c.proveedorNombre ?? "—";

  const tipo = c.tipo ?? c.tipo_compra ?? c.clase ?? "Mixtas";

  const fecha =
    c.fecha ?? c.fecha_compra ?? c.fecha_emision ?? new Date().toISOString().slice(0, 10);

  const total = Number(c.total ?? 0);
  const obs = c.observaciones ?? c.obs ?? "—";

  // Detalles: puede venir como items, detalles, detalle_compra, etc.
  const rawItems = c.items ?? c.detalles ?? c.detalle_compra ?? [];

  const items = rawItems.map((it, idx) => ({
    producto:
      it.producto ?? it.nombre_producto ?? it.nombre ?? `Item ${idx + 1}`,
    medida: it.medida ?? it.unidad ?? it.unidad_stock ?? "u",
    cantidad: Number(it.cantidad ?? 0),
    precio: Number(it.precio ?? it.precio_unitario ?? 0),
    descuento: Number(it.descuento ?? 0),
    subtotal: Number(it.subtotal ?? 0),
  }));

  return { id, dbId, proveedor, tipo, total, fecha, obs, items };
}

export default function Compras() {
  const navigate = useNavigate();

  /* Filtros */
  const [tab, setTab] = useState("Todo");
  const [q, setQ] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [resetSignal, setResetSignal] = useState(0);

  /* Filas */
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  /* Modales */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  /* ======================
   * Cargar compras de la API
   * ====================== */
  useEffect(() => {
    async function fetchCompras() {
      try {
        setLoading(true);
        setErrorMsg("");

        const resp = await api("/api/compras"); // GET /api/compras
        if (!resp?.ok || !Array.isArray(resp.compras)) {
          console.warn("Respuesta inesperada en GET /api/compras:", resp);
          // fallback al mock si algo viene raro
          setRows(INITIAL);
          return;
        }

        const mapped = resp.compras.map(mapCompraFromApi);
        setRows(mapped);
      } catch (err) {
        console.error("Error cargando compras:", err);
        setErrorMsg(
          "No se pudieron cargar las compras desde el servidor."
        );
        // fallback al mock
        setRows(INITIAL);
      } finally {
        setLoading(false);
      }
    }

    fetchCompras();
  }, []);

  /* Filtrado */
  const filtered = useMemo(() => {
    return rows
      .filter((r) => (tab === "Todo" ? true : r.tipo === tab))
      .filter((r) =>
        q
          ? r.id.toLowerCase().includes(q.toLowerCase()) ||
            r.proveedor.toLowerCase().includes(q.toLowerCase())
          : true
      )
      .filter((r) => {
        const d = new Date(r.fecha);
        const okFrom = desde ? d >= new Date(desde) : true;
        const okTo = hasta ? d <= new Date(hasta) : true;
        return okFrom && okTo;
      });
  }, [rows, tab, q, desde, hasta]);

  /* Handlers filtros */
  function onApplyFilters(form) {
    setQ(form.buscar ?? "");
    setDesde(form.fechaDesde ?? "");
    setHasta(form.fechaHasta ?? "");
  }
  function onResetFilters() {
    setQ("");
    setDesde("");
    setHasta("");
    setTab("Todo");
    setResetSignal((x) => x + 1);
  }

  /* Acciones por fila */
  function onViewDetail(row) {
    setEditOpen(false);
    setEditRow(null);
    setDetailRow(row);
    setDetailOpen(true);
  }

  function onEdit(row) {
    setDetailOpen(false);
    setDetailRow(null);
    setEditRow(row);
    setEditOpen(true);
  }

  // ===> AHORA ANULA EN BACKEND Y DESPUÉS ACTUALIZA EL FRONT
  async function onAnular(row) {
    const compraId =
      row.dbId ?? row.id_compra ?? getNumericIdFromDisplay(row.id);

    if (!compraId) {
      // Sin ID numérico: sólo afectamos el front y listo
      if (window.confirm(`¿Anular sólo visualmente la compra ${row.id}?`)) {
        setRows((prev) => prev.filter((r) => r.id !== row.id));
      }
      return;
    }

    if (
      !window.confirm(
        `¿Seguro que querés anular la compra ${row.id}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      const resp = await api(`/api/compras/${compraId}/anular`, {
        method: "PUT",
      });

      if (!resp?.ok) {
        console.error("Error anulando compra:", resp);
        alert(
          resp?.message ||
            "No se pudo anular la compra. Revisá el servidor."
        );
        return;
      }

      // Podés elegir: o la sacás de la lista, o la marcás como ANULADA.
      // Acá la saco (comportamiento original):
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      console.error("Error de red anulando compra:", err);
      alert("Error de red al anular la compra.");
    }
  }

  function onDownload(row) {
    console.log("Descargar compra:", row.id);
    // Acá podrías llamar a /api/compras/:id/pdf o similar.
  }

  /* Columnas DataTable */
  const columns = [
    {
      id: "id",
      header: "Orden",
      accessor: (r) => r.id,
      align: "center",
      nowrap: true,
      width: "120px",
      sortable: true,
    },
    {
      id: "proveedor",
      header: "Proveedor",
      accessor: (r) => r.proveedor,
      align: "center",
      sortable: true,
    },
    {
      id: "tipo",
      header: "Tipo",
      accessor: (r) => r.tipo,
      align: "center",
      width: "110px",
      sortable: true,
    },
    {
      id: "fecha",
      header: "Fecha",
      accessor: (r) => r.fecha,
      render: (r) => new Date(r.fecha).toLocaleDateString(),
      align: "center",
      width: "120px",
      sortable: true,
      sortAccessor: (r) => r.fecha,
    },
    {
      id: "total",
      header: "Total ($)",
      render: (r) => fmtARS.format(r.total),
      accessor: (r) => r.total,
      align: "center",
      width: "140px",
      sortable: true,
      sortAccessor: (r) => Number(r.total || 0),
    },
    {
      id: "detalle",
      header: "Detalle",
      align: "center",
      render: (row) => (
        <button
          onClick={() => onViewDetail(row)}
          className="border border-[#d8e4df] rounded-md px-4 py-1.5 text-[#154734] hover:bg-[#e8f4ef] transition"
        >
          Ver Detalle
        </button>
      ),
      width: "140px",
    },
    {
      id: "obs",
      header: "Observaciones",
      accessor: (r) => r.obs,
      align: "center",
    },
    {
      id: "acciones",
      header: "Acciones",
      align: "center",
      render: (row) => (
        <div className="flex justify-center items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => onEdit(row)}
              className="bg-[#154734] text-white px-3 py-1 text-xs rounded-md hover:bg-[#1E5A3E]"
            >
              MODIFICAR
            </button>
            <button
              onClick={() => onAnular(row)}
              className="bg-[#A30000] text-white px-5 py-1 text-xs rounded-md hover:bg-[#7A0000]"
            >
              ANULAR
            </button>
          </div>
          <button
            onClick={() => onDownload(row)}
            className="p-1 border border-[#d8e4df] rounded-md hover:bg-[#f7faf9] flex items-center justify-center"
            title="Descargar comprobante"
          >
            <Download className="w-4 h-4 text-[#154734]" />
          </button>
        </div>
      ),
      width: "170px",
    },
  ];

  /* Columnas para Modified */
  const editColumns = [
    {
      key: "producto",
      label: "Producto / Material",
      width: "220px",
      type: "text",
    },
    { key: "medida", label: "Medida/Estado", width: "140px", type: "text" },
    { key: "cantidad", label: "Cantidad", width: "120px", type: "number" },
    { key: "precio", label: "Precio Unitario", width: "140px", type: "number" },
    { key: "descuento", label: "Desc. %", width: "110px", type: "number" },
    { key: "subtotal", label: "Subtotal", width: "140px", readOnly: true },
  ];

  const computeTotal = (list) =>
    list
      .reduce((sum, it) => sum + Number(it.subtotal || 0), 0)
      .toFixed(2);

  // ===> AHORA GUARDA EN BACKEND Y LUEGO ACTUALIZA LA FILA
  async function onSaveEdit(updated) {
    const compraId =
      updated.dbId ??
      updated.id_compra ??
      getNumericIdFromDisplay(updated.id);

    // Actualización visual inmediata (optimista)
    setRows((prev) =>
      prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
    );
    setEditOpen(false);
    setEditRow(null);

    if (!compraId) {
      console.warn(
        "No hay ID numérico de compra; sólo se actualizó en el front."
      );
      return;
    }

    try {
      const payload = {
        fecha: updated.fecha,
        observaciones: updated.obs,
        items: updated.items,
      };

      const resp = await api(`/api/compras/${compraId}`, {
        method: "PUT",
        body: payload,
      });

      if (!resp?.ok) {
        console.error("Error modificando compra en backend:", resp);
        alert(
          resp?.message ||
            "La compra se modificó visualmente, pero falló al guardar en el servidor."
        );
        return;
      }

      // Si el backend devuelve la compra actualizada, podés re-mapearla:
      if (resp.compra) {
        const mapped = mapCompraFromApi(resp.compra);
        setRows((prev) =>
          prev.map((r) => (r.id === mapped.id ? mapped : r))
        );
      }
    } catch (err) {
      console.error("Error de red modificando compra:", err);
      alert(
        "La compra se modificó visualmente, pero hubo un error de red al guardar."
      );
    }
  }

  return (
    <PageContainer
      title="Lista de Compras"
      actions={
        <PrimaryButton
          onClick={() => navigate("/compras/nueva")}
          text={
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Añadir nueva compra
            </span>
          }
        />
      }
    >
      {/* Filtros */}
      <FilterBar
        filters={TABS}
        selectedFilter={tab}
        onFilterSelect={setTab}
        resetSignal={resetSignal}
        onApply={onApplyFilters}
        onReset={onResetFilters}
        applyLabel={
          <span className="inline-flex items-center gap-2">
            <Filter className="h-4 w-4" /> Aplicar Filtros
          </span>
        }
        fields={[
          {
            name: "buscar",
            label: "Buscar",
            type: "text",
            placeholder: "Proveedor u orden…",
          },
          { name: "fechaDesde", label: "Fecha desde", type: "date" },
          { name: "fechaHasta", label: "Fecha hasta", type: "date" },
        ]}
      />

      {/* Mensajes de estado */}
      {loading && (
        <p className="mt-4 text-sm text-gray-500">Cargando compras…</p>
      )}
      {errorMsg && !loading && (
        <p className="mt-4 text-sm text-red-600">{errorMsg}</p>
      )}

      {/* Tabla */}
      <div className="mt-6">
        <DataTable
          columns={columns}
          data={filtered}
          zebra={false}
          stickyHeader={true}
          tableClass="w-full text-sm text-center border-collapse"
          theadClass="bg-[#e8f4ef] text-[#154734]"
          rowClass="hover:bg-[#f6faf7] border-t border-[#edf2ef]"
          headerClass="px-4 py-3 font-semibold text-center"
          cellClass="px-4 py-4 text-center"
          enableSort
        />
      </div>

      {/* Detalle */}
      <Details
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={
          detailRow
            ? `Detalle de Compra ${detailRow.id}`
            : "Detalle de Compra"
        }
        data={detailRow}
        itemsKey="items"
        columns={[
          { key: "producto", label: "Producto / Material" },
          { key: "medida", label: "Medida/Estado" },
          { key: "cantidad", label: "Cantidad" },
          { key: "precio", label: "Precio Unitario" },
          { key: "descuento", label: "Desc. %" },
          { key: "subtotal", label: "Subtotal" },
        ]}
      />

      {/* Modificar */}
      {editOpen && editRow && (
        <Modified
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          title={`Modificar productos de Compra ${editRow.id}`}
          data={editRow}
          itemsKey="items"
          columns={editColumns}
          computeTotal={computeTotal}
          extraFooter={
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-semibold text-[#154734] mr-2">
                  Fecha:
                </label>
                <input
                  type="text"
                  value={editRow.fecha || ""}
                  className="border border-slate-200 rounded-md px-3 py-1"
                  readOnly
                />
              </div>
              <p className="text-lg font-semibold text-[#154734]">
                Total: {fmtARS.format(Number(editRow.total || 0))}
              </p>
            </div>
          }
          onSave={onSaveEdit}
          size="max-w-5xl"
        />
      )}
    </PageContainer>
  );
}
