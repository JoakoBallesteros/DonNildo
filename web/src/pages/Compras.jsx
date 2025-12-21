import { useEffect, useMemo, useState } from "react";
import { Plus, Filter, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../lib/apiClient";
import PageContainer from "../components/pages/PageContainer.jsx";
import FilterBar from "../components/forms/FilterBars.jsx";
import DataTable from "../components/tables/DataTable.jsx";
import Details from "../components/modals/Details.jsx";
import Modified from "../components/modals/Modified.jsx";
import Modals from "../components/modals/Modals.jsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const TABS = ["Todo", "Materiales", "Cajas", "Mixta"];

const fmtARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function toYMD(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function formatDMY(value) {
  const ymd = toYMD(value);
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return value ? String(value) : "—";
  const [, yyyy, mm, dd] = m;
  return `${dd}/${mm}/${yyyy}`;
}

function getNumericIdFromDisplay(id) {
  if (typeof id === "number") return id;
  const match = String(id).match(/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function normalizeTipo(tipo) {
  const t = String(tipo || "").trim().toLowerCase();
  if (!t) return "Mixta";
  if (t === "mixtas" || t === "mixta") return "Mixta";
  if (t === "materiales") return "Materiales";
  if (t === "cajas") return "Cajas";
  return String(tipo);
}

function mapCompraFromApi(c) {
  const idRaw = c.id ?? c.id_compra ?? c.numero_oc;

  const id =
    typeof idRaw === "string"
      ? idRaw
      : idRaw != null
      ? `OC-${String(idRaw).padStart(4, "0")}`
      : "OC-S/N";

  const dbId =
    typeof c.id_compra === "number"
      ? c.id_compra
      : typeof idRaw === "number"
      ? idRaw
      : null;

  const proveedor =
    c.proveedor ?? c.proveedor_nombre ?? c.proveedorNombre ?? "—";

  const estado = c.estado ?? c.estado_compra ?? "ACTIVO";

  const tipoRaw = c.tipo ?? c.tipo_compra ?? c.clase ?? "Mixta";
  const tipo = normalizeTipo(tipoRaw);

  const fecha =
    c.fecha ??
    c.fecha_compra ??
    c.fecha_emision ??
    new Date().toISOString().slice(0, 10);

  const total = Number(c.total ?? 0);
  const obs = c.observaciones ?? c.obs ?? "—";
  const rawItems = c.items ?? c.detalles ?? c.detalle_compra ?? [];

  const items = rawItems.map((it, idx) => ({
    tipo,
    proveedor: proveedor || "—",
    producto:
      it.producto ?? it.nombre_producto ?? it.nombre ?? `Item ${idx + 1}`,
    medida: it.medida ?? it.unidad ?? it.unidad_stock ?? "u",
    cantidad: Number(it.cantidad ?? 0),
    precio: Number(it.precio ?? it.precio_unitario ?? 0),
    descuento: Number(it.descuento ?? 0),
    subtotal: Number(it.subtotal ?? 0),
  }));

  return { id, dbId, proveedor, tipo, total, fecha, obs, items, estado };
}

export default function Compras() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("Todo");
  const [q, setQ] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [resetSignal, setResetSignal] = useState(0);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  const [mostrarAnuladas, setMostrarAnuladas] = useState(false);
  const [compraIdToAnular, setCompraIdToAnular] = useState(null);
  const [isAnularConfirmOpen, setAnularConfirmOpen] = useState(false);

  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    title: "",
    text: "",
    type: "",
  });

  useEffect(() => {
    async function fetchCompras() {
      try {
        setLoading(true);
        setErrorMsg("");

        const qs = mostrarAnuladas ? "?only=anuladas" : "?only=activas";
        const resp = await api(`/api/compras${qs}`);

        if (!resp?.ok || !Array.isArray(resp.compras)) {
          setRows([]);
          return;
        }

        const mapped = resp.compras.map(mapCompraFromApi);
        setRows(mapped);
      // eslint-disable-next-line no-unused-vars
      } catch (err) {
        setErrorMsg("No se pudieron cargar las compras desde el servidor.");
      } finally {
        setLoading(false);
      }
    }

    fetchCompras();
  }, [mostrarAnuladas]);

  const filtered = useMemo(() => {
    const qLower = (q || "").trim().toLowerCase();

    return rows
      .filter((r) =>
        mostrarAnuladas ? r.estado === "ANULADO" : r.estado !== "ANULADO"
      )
      .filter((r) => (tab === "Todo" ? true : r.tipo === tab))
      .filter((r) => {
        if (!qLower) return true;
        return (
          String(r.id || "").toLowerCase().includes(qLower) ||
          String(r.proveedor || "").toLowerCase().includes(qLower) ||
          String(r.obs || "").toLowerCase().includes(qLower)
        );
      })
      .filter((r) => {
        const key = toYMD(r.fecha);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return true;
        if (desde && key < desde) return false;
        if (hasta && key > hasta) return false;
        return true;
      });
  }, [rows, tab, q, desde, hasta, mostrarAnuladas]);

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

  const handleDownloadDetalleCompra = (compra) => {
    const doc = new jsPDF();
    if (!compra || !compra.items) return;

    const compraCodigo = compra.id || "OC-S/N";
    const compraId = compra.dbId ?? compra.id_compra ?? null;

    const fecha = formatDMY(
      compra.fecha || new Date().toISOString().slice(0, 10)
    );
    const proveedor = compra.proveedor || "—";
    const obs = compra.obs || "—";

    doc.setFontSize(16);
    doc.text(`Detalle de Compra ${compraCodigo}`, 14, 20);

    doc.setFontSize(12);
    doc.text(`N° interno: ${compraId ?? "—"}`, 14, 28);
    doc.text(`Proveedor: ${proveedor}`, 14, 34);
    doc.text(`Fecha: ${fecha}`, 14, 40);
    doc.text(`Observaciones: ${obs}`, 14, 46);

    const head = [["Producto", "Cantidad", "Medida", "Precio Unit.", "Subtotal"]];

    const body = compra.items.map((p) => [
      p.producto,
      p.cantidad,
      p.medida,
      `$${Number(p.precio).toLocaleString("es-AR")}`,
      `$${Number(p.subtotal).toLocaleString("es-AR")}`,
    ]);

    autoTable(doc, { startY: 55, head, body });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Total: $${Number(compra.total).toLocaleString("es-AR")}`, 14, finalY);

    setTimeout(() => doc.save(`Detalle de ${compraCodigo}.pdf`), 100);
  };

  function onViewDetail(row) {
    setEditOpen(false);
    setEditRow(null);
    setDetailRow(row);
    setDetailOpen(true);
  }

  async function confirmarAnulacion() {
    if (!compraIdToAnular) return;

    try {
      setAnularConfirmOpen(false);

      const resp = await api(`/api/compras/${compraIdToAnular}/anular`, {
        method: "PUT",
      });

      if (!resp?.ok) {
        setMessageModal({
          isOpen: true,
          title: "Error al anular",
          text: resp?.message || "No se pudo anular la compra.",
          type: "error",
        });
        return;
      }

      setMessageModal({
        isOpen: true,
        title: "Compra anulada",
        text: `La compra ${compraIdToAnular} fue anulada correctamente.`,
        type: "success",
      });

      setRows((prev) =>
        prev.map((r) =>
          r.dbId === compraIdToAnular ? { ...r, estado: "ANULADO" } : r
        )
      );
    } catch (e) {
      setMessageModal({
        isOpen: true,
        title: "❌ Error de red",
        text: e.message,
        type: "error",
      });
    } finally {
      setCompraIdToAnular(null);
    }
  }

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
      accessor: (r) => toYMD(r.fecha),
      render: (r) => formatDMY(r.fecha),
      align: "center",
      width: "120px",
      sortable: true,
      sortAccessor: (r) => toYMD(r.fecha),
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
          Ver detalle
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
      render: (row) => {
        const isAnulada = row.estado === "ANULADO";
        if (isAnulada) {
          return <span className="text-sm italic text-red-700">Anulada</span>;
        }

        const numericId =
          row.dbId ?? row.id_compra ?? getNumericIdFromDisplay(row.id);

        return (
          <div className="flex flex-wrap justify-center items-center gap-2">
            <button
              onClick={() => navigate(`/compras/editar/${numericId}`)}
              className="bg-[#154734] text-white px-4 py-1.5 text-xs rounded-md hover:bg-[#1E5A3E]"
            >
              MODIFICAR
            </button>

            <button
              onClick={() => {
                setCompraIdToAnular(numericId);
                setAnularConfirmOpen(true);
              }}
              className="bg-[#A30000] text-white px-6 py-1.5 text-xs rounded-md hover:bg-[#7A0000]"
            >
              ANULAR
            </button>

            <button
              onClick={() => handleDownloadDetalleCompra(row)}
              className="p-1 border border-[#d8e4df] rounded-md hover:bg-[#f7faf9] flex items-center justify-center"
              title="Descargar Detalle de Compra"
            >
              <Download className="w-4 h-4 text-[#154734]" />
            </button>
          </div>
        );
      },
    },
  ];

  const editColumns = [
    { key: "producto", label: "Producto / Material", width: "220px", type: "text" },
    { key: "medida", label: "Medida/Estado", width: "140px", type: "text" },
    { key: "cantidad", label: "Cantidad", width: "120px", type: "number" },
    { key: "precio", label: "Precio Unitario", width: "140px", type: "number" },
    { key: "descuento", label: "Desc. %", width: "110px", type: "number" },
    { key: "subtotal", label: "Subtotal", width: "140px", readOnly: true },
  ];

  const computeTotal = (list) =>
    list.reduce((sum, it) => sum + Number(it.subtotal || 0), 0).toFixed(2);

  async function onSaveEdit(updated) {
    const compraId =
      updated.dbId ?? updated.id_compra ?? getNumericIdFromDisplay(updated.id);

    setRows((prev) =>
      prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
    );
    setEditOpen(false);
    setEditRow(null);

    if (!compraId) return;

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

      if (!resp?.ok) return;

      if (resp.compra) {
        const mapped = mapCompraFromApi(resp.compra);
        setRows((prev) => prev.map((r) => (r.id === mapped.id ? mapped : r)));
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <PageContainer
      title="Lista de Compras"
      actions={
        <button
          onClick={() => navigate("/compras/nueva")}
          className="flex items-center gap-2 bg-[#154734] text-white px-4 py-2 rounded-md hover:bg-[#103a2b] transition"
        >
          <Plus size={16} /> Añadir nueva compra
        </button>
      }
    >
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-5">
          {errorMsg}
        </div>
      )}

      <FilterBar
        filters={TABS}
        selectedFilter={tab}
        onFilterSelect={setTab}
        resetSignal={resetSignal}
        onApply={onApplyFilters}
        onReset={onResetFilters}
        fields={[
          {
            name: "buscar",
            label: "Buscar",
            type: "text",
            placeholder: "Proveedor, orden u observacion…",
          },
          { name: "fechaDesde", label: "Fecha desde", type: "date" },
          { name: "fechaHasta", label: "Fecha hasta", type: "date" },
        ]}
        applyButton={(props) => (
          <button
            {...props}
            className="flex items-center gap-2 bg-[#154734] text-white px-4 py-2 rounded-md hover:bg-[#103a2b] transition"
          >
            <Filter size={16} /> Aplicar Filtros
          </button>
        )}
      />

      <div className="flex justify-end mb-4 gap-4">
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
            data={filtered}
            zebra={false}
            stickyHeader={true}
            wrapperClass="dn-table-wrapper overflow-y-auto shadow-sm"
            tableClass="w-full text-sm text-center border-collapse"
            theadClass="bg-[#e8f4ef] text-[#154734]"
            rowClass={(row) =>
              `border-t border-[#edf2ef] ${
                row.estado === "ANULADO"
                  ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  : "bg-white hover:bg-[#f6faf7]"
              }`
            }
            headerClass="px-4 py-3 font-semibold text-center"
            cellClass="px-4 py-2 text-center"
            enableSort={true}
            enablePagination={true}
            pageSize={8}
          />
        )}
      </div>

      <Details
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detailRow ? `Detalle de Compra ${detailRow.id}` : "Detalle de Compra"}
        data={detailRow}
        itemsKey="items"
        columns={[
          { key: "tipo", label: "Tipo" },
          { key: "proveedor", label: "Proveedor" },
          { key: "producto", label: "Producto" },
          { key: "cantidad", label: "Cantidad" },
          { key: "precio", label: "Precio Unitario" },
          { key: "subtotal", label: "Subtotal" },
        ]}
      />

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
                  value={formatDMY(editRow.fecha || "")}
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

      <Modals
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
              onClick={confirmarAnulacion}
              className="px-4 py-2 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 transition"
            >
              Sí, Anular
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-700">
          ¿Seguro que querés anular la compra{" "}
          <strong className="text-slate-900">N° {compraIdToAnular}</strong>?
          <br />
          Esta acción no se puede deshacer.
        </p>
      </Modals>

      <Modals
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
      </Modals>
    </PageContainer>
  );
}
