// ListaVentas.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Plus, Filter, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PageContainer from "../components/pages/PageContainer";
import FilterBar from "../components/forms/FilterBars";
import DataTable from "../components/tables/DataTable.jsx";
import DetailModal from "../components/modals/Details";
import Modal from "../components/modals/Modals.jsx";
import { useNavigate } from "react-router-dom";
import api from "../lib/apiClient";
import ReportDetail from "../components/modals/DetallesReporte.jsx";

const TIPO_MAP = {
  Todo: null,
  Materiales: "Material",
  Cajas: "Caja",
  Mixtas: "Mixta",
};
const TIPO_LABEL = {
  Material: "Materiales",
  Caja: "Cajas",
  Mixta: "Mixta",
};

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

  const [remitosOpen, setRemitosOpen] = useState(false);
  const [remitos, setRemitos] = useState([]);
  const [remitoSel, setRemitoSel] = useState(null);
  const [, setCheckAll] = useState(false);
  const [selected, setSelected] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
      const data = await api(`/api/ventas${qs}`);
      setVentas(data);
    } catch (e) {
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

  const handleVerDetalle = (venta) => {
    setSelectedVenta(venta);
    setDetailOpen(true);
  };

  const handleModificar = (venta) => {
    navigate(`/ventas/editar/${venta.id_venta}`);
  };

  const handleOpenAnularConfirm = (id_venta) => {
    setVentaIdToAnular(id_venta);
    setAnularConfirmOpen(true);
  };

  const handleAnular = async () => {
    try {
      if (!ventaIdToAnular) return;

      setAnularConfirmOpen(false);
      await api(`/api/ventas/${ventaIdToAnular}/anular`, {
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

  const loadRemitos = async () => {
    try {
      const resp = await api("/api/v1/remitos");
      if (resp.ok && resp.remitos) {
        setRemitos(resp.remitos);
      }
    } catch (err) {
      console.error("Error cargando remitos:", err);
    }
  };

  const openRemitos = async () => {
    await loadRemitos();
    setRemitosOpen(true);
  };

  const deleteSelectedRemitos = async () => {
    if (selected.length === 0) return;

    await api(`/api/v1/remitos`, {
      method: "DELETE",
      body: { ids: selected },
    });

    await loadRemitos();
    setSelected([]);
    setCheckAll(false);
  };

  const handleDownloadRemitoVenta = async (venta) => {
    const doc = new jsPDF();

    if (!venta || !venta.productos) return;

    const ventaId = venta.id_venta;
    const fecha = venta.fecha;
    const tipo = venta.tipo;
    const productos = venta.productos;
    const obs = venta.observaciones ?? null;

    // --- PDF ---
    doc.setFontSize(16);
    doc.text(`Remito de Venta N° ${ventaId}`, 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Producto", "Cantidad", "Medida", "Precio Unit.", "Subtotal"]],
      body: productos.map((p) => [
        p.producto,
        p.cantidad,
        p.medida,
        `$${Number(p.precio).toLocaleString("es-AR")}`,
        `$${Number(p.subtotal).toLocaleString("es-AR")}`,
      ]),
    });

    doc.text(
      `Total: $${Number(venta.total).toLocaleString("es-AR")}`,
      14,
      doc.lastAutoTable.finalY + 10
    );

    // Descargar PDF
    setTimeout(() => {
      doc.save(`Remito_Venta_${ventaId}.pdf`);
    }, 100);

    // --- GUARDAR REMITO EN BD ---
    try {
      const payload = {
        id_venta: ventaId,
        fecha,
        tipo_venta: tipo,
        productos,
        observaciones: obs,
      };

      const resp = await api("/api/v1/remitos", {
        method: "POST",
        body: payload,
      });

      if (!resp.ok) {
        console.error("Error registrando remito de venta:", resp);
      }
    } catch (err) {
      console.error("Error de red creando remito de venta:", err);
    }
  };

  const fetchDetalleRemito = async (idRemito) => {
    try {
      const resp = await api(`/api/v1/remitos/${idRemito}`);
      if (resp.ok) {
        setRemitoSel({
          ...resp.remito,
          productos: resp.productos ?? [],
        });
      }
    } catch (err) {
      console.error("Error cargando detalle del remito:", err);
    }
  };

  // =========================
  // FILTROS DE VISUALIZACIÓN
  // =========================

  const ventasFiltradas = useMemo(() => {
    const tsel = TIPO_MAP[filtroTipo];
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

  const formatFecha = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);

    return d
      .toLocaleDateString("es-AR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\//g, "-"); // 25-11-2025
  };

  // =========================
  // COLUMNAS TABLA
  // =========================
  const columns = [
    {
      id: "numero",
      header: "N° Venta",
      accessor: "id_venta",
      align: "center",
      sortable: true,
    },
    {
      id: "tipo",
      header: "Tipo",
      align: "center",
      sortable: true,
      render: (row) => TIPO_LABEL[row.tipo] || row.tipo,
    },
    {
      id: "fecha",
      header: "Fecha",
      align: "center",
      sortable: true,
      sortAccessor: (row) => row.fecha,
      render: (row) => {
        const fecha = new Date(row.fecha);
        return fecha
          .toLocaleDateString("es-AR", {
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
      sortable: true,
      sortAccessor: (row) => Number(row.total || 0),
      render: (row) => `$${Number(row.total).toLocaleString("es-AR")}`,
      align: "center",
    },
    {
      id: "detalle",
      header: "Detalle",
      align: "center",
      sortable: false,
      render: (row) => (
        <button
          onClick={() => handleVerDetalle(row)}
          className="border border-[#d8e4df] rounded-md px-4 py-1.5 text-[#154734] hover:bg-[#e8f4ef] transition"
        >
          Ver detalle
        </button>
      ),
    },
    {
      id: "obs",
      header: "Observaciones",
      accessor: "observaciones",
      align: "center",
      render: (row) => row.observaciones || "—",
    },
    {
      id: "acciones",
      header: "Acciones",
      align: "center",
      render: (row) => {
        const isAnulada = row.estado === "ANULADO";

        if (isAnulada) {
          return (
            <span className="text-sm italic text-red-700">Anulada</span>
          );
        }

        return (
          <div className="flex flex-wrap justify-center items-center gap-2">
            <button
              onClick={() => handleModificar(row)}
              className="bg-[#154734] text-white px-4 py-1.5 text-xs rounded-md hover:bg-[#1E5A3E]"
            >
              MODIFICAR
            </button>
            <button
              onClick={() => handleOpenAnularConfirm(row.id_venta)}
              className="bg-[#A30000] text-white px-6 py-1.5 text-xs rounded-md hover:bg-[#7A0000]"
            >
              ANULAR
            </button>
            <button
              onClick={() => handleDownloadRemitoVenta(row)}
              className="p-1 border border-[#d8e4df] rounded-md hover:bg-[#f7faf9] flex items-center justify-center"
              title="Descargar remito"
            >
              <Download className="w-4 h-4 text-[#154734]" />
            </button>
          </div>
        );
      },
    },
  ];

  const columnsRemitos = [
    {
      id: "id_remito",
      header: "Remito",
      accessor: (r) => `Rm-${String(r.id_remito).padStart(4, "0")}`,
      align: "left",
      sortable: true,
    },
    {
      id: "id_venta",
      header: "Venta",
      accessor: (r) => `V-${String(r.id_venta).padStart(4, "0")}`,
      align: "left",
      sortable: true,
    },
    {
      id: "fecha",
      header: "Fecha",
      accessor: (r) => formatFecha(r.fecha),
      align: "center",
      sortable: true,
    },
    {
      id: "detalle",
      header: "Detalle",
      align: "center",
      render: (r) => {
        const isActive = remitoSel?.id_remito === r.id_remito;
        return (
          <button
            onClick={() => {
              if (isActive) {
                setRemitoSel(null);
              } else {
                fetchDetalleRemito(r.id_remito);
              }
            }}
            className={
              isActive
                ? "bg-[#154734] text-white px-4 py-1.5 rounded-md text-sm"
                : "border border-[#154734] text-[#154734] px-4 py-1.5 rounded-md text-sm hover:bg-[#e8f4ef]"
            }
          >
            {isActive ? "Viendo" : "Ver detalle"}
          </button>
        );
      },
    },
    {
      id: "acciones",
      header: "Acciones",
      align: "center",
      render: (r) => (
        <button
          onClick={() => {
            const id = Number(r.id_remito);

            if (selected.includes(id)) {
              setSelected((prev) => prev.filter((x) => x !== id));
            } else {
              setSelected((prev) => [...prev, id]);
            }
          }}
          className={`px-3 py-1.5 rounded-md border text-sm 
          ${
            selected.includes(Number(r.id_remito))
              ? "bg-[#0f7a4e] text-white hover:bg-[#0d6843]"
              : "border-[#154734] text-[#154734] hover:bg-[#e8f4ef]"
          }`}
        >
          {selected.includes(Number(r.id_remito))
            ? "Seleccionado"
            : "Seleccionar"}
        </button>
      ),
    },
  ];

  // =========================
  // RENDER PRINCIPAL
  // =========================
  return (
    <PageContainer
      title="Lista de Ventas"
      noDivider
      extraHeight
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
        filters={["Todo", "Materiales", "Cajas", "Mixtas"]}
        fields={[
          {
            label: "Buscar",
            type: "text",
            placeholder: "N° venta, tipo u observación...",
            name: "buscar",
          },
          { label: "Desde", type: "date", name: "desde" },
          { label: "Hasta", type: "date", name: "hasta" },
        ]}
        onApply={aplicarFiltros}
        onReset={reiniciarFiltros}
        onFilterSelect={handleFilterSelect}
        resetSignal={resetSignal}
        selectedFilter={filtroTipo}
        applyButton={(props) => (
          <button
            {...props}
            className="flex items-center gap-2 bg-[#154734] text-white px-4 py-2 rounded-md hover:bg-[#103a2b] transition"
          >
            <Filter size={16} /> Aplicar Filtros
          </button>
        )}
      />

      <div className="flex justify-end mb-4 gap-3">
        <button
          onClick={openRemitos}
          className="flex items-center gap-2 border border-[#154734] text-[#154734] px-3 py-1 rounded-md hover:bg-[#e8f4ef] transition"
        >
          Ver remitos
        </button>

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
          { key: "precio", label: "Precio Unitario" },
          { key: "subtotal", label: "Subtotal" },
        ]}
        footerRight={
          selectedVenta
            ? `Total: $${Number(selectedVenta.total).toLocaleString("es-AR")}`
            : ""
        }
      />

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
        onClose={() =>
          setMessageModal({ isOpen: false, title: "", text: "", type: "" })
        }
        title={messageModal.title}
        size="max-w-md"
        footer={
          <div className="flex justify-end">
            <button
              onClick={() =>
                setMessageModal({
                  isOpen: false,
                  title: "",
                  text: "",
                  type: "",
                })
              }
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

      <Modal
        isOpen={remitosOpen}
        onClose={() => {
          setRemitosOpen(false);
          setRemitoSel(null);
        }}
        title="Lista de Remitos"
        size="max-w-4xl"
      >
        <div className="max-h-[50vh] overflow-y-auto pr-2">
          {/* LISTA DE REMITOS */}
          <div className="overflow-x-auto max-h-[400px] border rounded-lg shadow-sm">
            <DataTable
              columns={columnsRemitos}
              data={remitos}
              zebra={false}
              stickyHeader={true}
              enableSort={true}
              enablePagination={false}
              wrapperClass="dn-table-wrapper-sm overflow-y-auto"
            />
          </div>

          {/* BOTÓN ELIMINAR SELECCIONADOS */}
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={selected.length === 0}
              className={`rounded-full px-6 py-3 ml-2 flex items-center justify-center
            ${
              selected.length > 0
                ? "bg-[#9b102e] text-white hover:bg-[#630924]"
                : "bg-[#9b102e] text-white opacity-60 cursor-not-allowed"
            }`}
            >
              🗑️ Eliminar seleccionados
            </button>
          </div>

          {/* DETALLE DEL REMITO */}
          {remitoSel && (
            <div className="mt-6 ">
              <h3 className="text-xl font-semibold text-[#154734] mb-4">
                Detalle del Remito V-
                {String(remitoSel.id_venta).padStart(4, "0")}
              </h3>

              {/* HEADER DEL REMITO */}
              <div className="grid grid-cols-2 gap-4 mb-4 overflow-y-auto">
                <div className="bg-[#f2f7f5] p-4 rounded-lg">
                  <p className="text-xs text-slate-500">ID Remito</p>
                  <p className="font-semibold">{`Rm-${String(
                    remitoSel.id_remito
                  ).padStart(4, "0")}`}</p>
                </div>

                <div className="bg-[#f2f7f5] p-4 rounded-lg">
                  <p className="text-xs text-slate-500">Fecha</p>
                  <p className="font-semibold">{formatFecha(remitoSel.fecha)}</p>
                </div>

                <div className="bg-[#f2f7f5] p-4 rounded-lg col-span-2">
                  <p className="text-xs text-slate-500">Observaciones</p>
                  <p>{remitoSel.observaciones || "—"}</p>
                </div>
              </div>

              {/* PRODUCTOS */}
              <h4 className="text-lg font-semibold mb-2">Productos</h4>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#e8f4ef] text-[#154734]">
                    <tr>
                      <th className="px-4 py-3 text-left">Producto</th>
                      <th className="px-4 py-3 text-center">Cantidad</th>
                      <th className="px-4 py-3 text-center">Precio Unit.</th>
                      <th className="px-4 py-3 text-center">Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(remitoSel.productos ?? []).map((p, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-4 py-3">{p.producto}</td>
                        <td className="px-4 py-3 text-center">
                          {p.cantidad}
                        </td>
                        <td className="px-4 py-3 text-center">
                          ${p.precio_unitario}
                        </td>
                        <td className="px-4 py-3 text-center">
                          ${p.subtotal}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirmar eliminación"
        size="max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setConfirmOpen(false)}
              className="px-4 py-2 rounded-md font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              Cancelar
            </button>

            <button
              onClick={async () => {
                await deleteSelectedRemitos();
                setConfirmOpen(false);
              }}
              className="px-4 py-2 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 transition"
            >
              Sí, eliminar
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-700">
          ¿Eliminar <strong>{selected.length}</strong> remito(s) seleccionados?
          <br />
          Esta acción no se puede deshacer.
        </p>
      </Modal>
    </PageContainer>
  );
}
