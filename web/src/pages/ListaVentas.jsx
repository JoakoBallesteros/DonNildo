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

  const [selectedVenta, setSelectedVenta] = useState(null);
  const [isDetailOpen, setDetailOpen] = useState(false);

  /* 
    PAGINACIÓN MANUAL PARA MOBILE:
    Se define el estado y efecto aquí (bucle principal) 
    para cumplir con Rules of Hooks.
  */
  const PAGE_SIZE_MOBILE = 8;
  const [pageMobile, setPageMobile] = useState(1);

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

  const ventasFiltradas = useMemo(() => {
    const tsel = TIPO_MAP[filtroTipo];

    // Fechas como strings YYYY-MM-DD
    const desdeStr = filtros.desde || "";
    const hastaStr = filtros.hasta || "";

    return ventas.filter((v) => {
      // 1) Filtro por tipo (tabs)
      if (tsel && v.tipo !== tsel) return false;

      // 2) Filtro de búsqueda
      if (filtros.buscar) {
        const txt = filtros.buscar.toLowerCase();
        const idStr = String(v.id_venta).toLowerCase();
        const tipoStr = (v.tipo || "").toLowerCase();
        const obsStr = (v.observaciones || "").toLowerCase();

        if (
          !idStr.includes(txt) &&
          !tipoStr.includes(txt) &&
          !obsStr.includes(txt)
        ) {
          return false;
        }
      }

      // 3) Filtro por fecha (TOTALMENTE inclusivo)
      const fechaStr = String(v.fecha).slice(0, 10); // "2025-11-25"

      if (desdeStr && fechaStr < desdeStr) return false;
      if (hastaStr && fechaStr > hastaStr) return false;

      return true;
    });
  }, [ventas, filtroTipo, filtros]);

  // Resetear página al cambiar los filtros (ventasFiltradas cambia)
  useEffect(() => {
    setPageMobile(1);
  }, [ventasFiltradas]);

  // Cálculo de filas visibles para mobile
  const totalPagesMobile = Math.ceil(ventasFiltradas.length / PAGE_SIZE_MOBILE);
  const startMobile = (pageMobile - 1) * PAGE_SIZE_MOBILE;
  const visibleRowsMobile = ventasFiltradas.slice(startMobile, startMobile + PAGE_SIZE_MOBILE);


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

    // Datos generales
    const ventaId = String(venta.id_venta).padStart(4, "0");
    const fecha = new Date(venta.fecha).toLocaleDateString("es-AR");
    const tipo = venta.tipo;
    const productos = venta.productos;
    const obs = venta.observaciones ?? null;
    const total = Number(venta.total).toLocaleString("es-AR", {
      minimumFractionDigits: 2,
    });

    // Colores corporativos
    const primaryColor = [21, 71, 52];
    const secondaryColor = [232, 244, 239];

    // --- ENCABEZADO ---
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...primaryColor);
    doc.text("Reciclados Don Nildo", 14, 22);

    // Subtítulo
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Gestión de Reciclaje y Ventas", 14, 28);

    // Dirección y Teléfono (Datos Reales)
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text("Álvarez Condarco 2496, Córdoba Capital", 14, 34);
    doc.text("Tel: +54 9 3513 23-2894", 14, 39);

    // Cuadro Info Derecha (Remito N°)
    doc.setDrawColor(...primaryColor);
    doc.setFillColor(...secondaryColor);
    doc.roundedRect(130, 12, 66, 24, 2, 2, "FD");

    doc.setFontSize(14);
    doc.setTextColor(...primaryColor);
    doc.setFont("helvetica", "bold");
    doc.text("REMITO DE VENTA", 163, 19, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.text(`N°: ${ventaId}`, 135, 26);
    doc.text(`Fecha: ${fecha}`, 135, 31);

    // Línea divisoria verde
    doc.setDrawColor(...primaryColor);
    doc.setLineWidth(0.5);
    doc.line(14, 45, 196, 45);

    // --- DATOS DEL CLIENTE Y VENTA ---
    doc.setFontSize(10);
    doc.setTextColor(60);
    
    // Tipo de Venta
    doc.text(`Tipo de Venta: ${tipo}`, 14, 53);

    // Cliente (Espacio punteado para completar a mano)
    // Si en el futuro tenés el dato del cliente, cambiá las comillas por venta.cliente_nombre
    const clienteTexto = venta.cliente_nombre || "............................................................."; 
    doc.text(`Cliente:  ${clienteTexto}`, 100, 53);

    if (obs) {
      doc.text(`Observaciones: ${obs}`, 14, 59);
    }

    // --- TABLA DE PRODUCTOS ---
    autoTable(doc, {
      startY: obs ? 65 : 62,
      head: [
        [
          "Producto",
          "Cantidad",
          "Medida / Detalle",
          "Precio Unit.",
          "Subtotal",
        ],
      ],
      body: productos.map((p) => {
        // 1. Unidad
        const unidad = p.unidad || "u";

        // 2. Cantidad concatenada
        const cantidadFormateada = `${p.cantidad} ${unidad}`;

        // 3. Medida (Limpieza de texto "Caja")
        let medidaTexto = p.medida_detalle || p.medida || "-";
        medidaTexto = medidaTexto.replace("Caja ", "").replace("caja ", "");

        return [
          p.producto,
          cantidadFormateada,
          medidaTexto,
          `$${Number(p.precio).toLocaleString("es-AR")}`,
          `$${Number(p.subtotal).toLocaleString("es-AR")}`,
        ];
      }),
      theme: "grid",
      headStyles: {
        fillColor: primaryColor,
        textColor: 255,
        fontSize: 10,
        halign: "center",
      },
      bodyStyles: {
        fontSize: 10,
        textColor: 50,
      },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "center" },
        2: { halign: "center" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    // --- TOTAL ---
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setDrawColor(200);
    doc.line(130, finalY - 2, 196, finalY - 2);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("TOTAL:", 150, finalY + 5, { align: "right" });
    doc.text(`$${total}`, 196, finalY + 5, { align: "right" });

    // Guardar PDF
    setTimeout(() => {
      doc.save(`Remito_DonNildo_${ventaId}.pdf`);
    }, 100);

    // Guardar en Backend
    try {
      const payload = {
        id_venta: venta.id_venta,
        fecha: venta.fecha,
        tipo_venta: venta.tipo,
        productos,
        observaciones: obs,
      };
      await api("/api/v1/remitos", {
        method: "POST",
        body: payload,
      });
    } catch (err) {
      console.error("Error backend:", err);
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
          return <span className="text-sm italic text-red-700">Anulada</span>;
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
          ${selected.includes(Number(r.id_remito))
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
          <>
            {/* VISTA DESKTOP */}
            <div className="hidden md:block">
              <DataTable
                columns={columns}
                data={ventasFiltradas}
                zebra={false}
                stickyHeader={true}
                wrapperClass="dn-table-wrapper overflow-y-auto shadow-sm"
                tableClass="w-full text-sm text-center border-collapse"
                theadClass="bg-[#e8f4ef] text-[#154734]"
                rowClass={(row) =>
                  `border-t border-[#edf2ef] ${row.estado === "ANULADO"
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
            </div>

            {/* VISTA MOBILE */}
            <div className="md:hidden space-y-3">
              {!ventasFiltradas.length && (
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-dashed text-gray-500 text-sm">
                  No se encontraron ventas.
                </div>
              )}
              {visibleRowsMobile.map((row) => {
                const isAnulada = row.estado === "ANULADO";
                const formattedDate = formatFecha(row.fecha);
                const formattedTotal = Number(row.total || 0).toLocaleString("es-AR", {
                  style: "currency",
                  currency: "ARS",
                  maximumFractionDigits: 0
                });

                return (
                  <div
                    key={row.id_venta}
                    className={`border rounded-lg p-3 shadow-sm ${isAnulada ? "bg-gray-100 border-gray-200" : "bg-white border-[#e3e9e5]"
                      }`}
                  >
                    {/* Cabecera: ID y Fecha */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#154734] bg-[#e8f4ef] px-2 py-0.5 rounded w-fit">
                          #{row.id_venta}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">{formattedDate}</span>
                      </div>
                      <div className="text-right">
                        {isAnulada ? (
                          <span className="text-xs font-bold text-red-600 uppercase border border-red-200 bg-red-50 px-2 py-1 rounded">
                            Anulada
                          </span>
                        ) : (
                          <span className="text-lg font-bold text-[#154734]">
                            {formattedTotal}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cuerpo: Tipo y Obs */}
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-xs text-gray-400 block">Tipo</span>
                        <span className="font-medium text-gray-700">
                          {TIPO_LABEL[row.tipo] || row.tipo}
                        </span>
                      </div>
                      <div>
                        {row.observaciones && (
                          <>
                            <span className="text-xs text-gray-400 block">Observaciones</span>
                            <span className="text-gray-600 truncate block">
                              {row.observaciones}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Botones de acción mobile */}
                    {!isAnulada && (
                      <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleVerDetalle(row)}
                          className="flex-1 text-xs text-[#154734] font-medium py-2 bg-gray-50 rounded hover:bg-gray-100"
                        >
                          Detalle
                        </button>
                        <button
                          onClick={() => handleModificar(row)}
                          className="flex-1 text-xs text-[#154734] font-medium py-2 bg-gray-50 rounded hover:bg-gray-100"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDownloadRemitoVenta(row)}
                          className="w-10 flex items-center justify-center text-[#154734] bg-gray-50 rounded hover:bg-gray-100"
                          title="Descargar Remito"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {/* Boton anular separado si no esta anulada */}
                    {!isAnulada && (
                      <div className="mt-2">
                        <button
                          onClick={() => handleOpenAnularConfirm(row.id_venta)}
                          className="w-full text-xs text-red-600 border border-red-100 py-1.5 rounded hover:bg-red-50"
                        >
                          Anular Venta
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Controles de paginación mobile */}
              {ventasFiltradas.length > PAGE_SIZE_MOBILE && (
                <div className="flex justify-center items-center gap-4 pt-2 pb-4">
                  <button
                    onClick={() => setPageMobile(p => Math.max(1, p - 1))}
                    disabled={pageMobile === 1}
                    className="px-3 py-1 text-sm border rounded bg-white disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="text-sm text-gray-600">
                    Página {pageMobile} de {totalPagesMobile}
                  </span>
                  <button
                    onClick={() => setPageMobile(p => Math.min(totalPagesMobile, p + 1))}
                    disabled={pageMobile === totalPagesMobile}
                    className="px-3 py-1 text-sm border rounded bg-white disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          </>
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
              className={`px-4 py-2 rounded-md font-semibold text-white transition ${messageModal.type === "success"
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
            {/* Desktop Table */}
            <div className="hidden md:block">
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

            {/* Mobile Card List */}
            <div className="md:hidden space-y-3 p-2 bg-slate-50">
              {remitos.length === 0 && (
                <p className="text-center text-gray-500 py-4 text-sm">No hay remitos.</p>
              )}
              {remitos.map((remito) => {
                // Determine if selected
                const isSelected = selected.includes(Number(remito.id_remito));
                return (
                  <div key={remito.id_remito} className={`bg-white border rounded-lg p-3 shadow-sm ${isSelected ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-[#154734]">Remito: {remito.id_remito}</p>
                        <span className="text-xs text-gray-600">Venta: {remito.id_venta}</span>
                      </div>
                      <span className="text-sm font-semibold">{formatFecha(remito.fecha)}</span>
                    </div>

                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => {
                          const isActive = remitoSel?.id_remito === remito.id_remito;
                          if (isActive) {
                            setRemitoSel(null);
                          } else {
                            setRemitoSel(remito);
                            fetchDetalleRemito(remito.id_remito);
                          }
                        }}
                        className={`flex-1 px-2 py-1.5 rounded text-xs transition ${remitoSel?.id_remito === remito.id_remito
                            ? "bg-[#154734] text-white hover:bg-[#103a2b]"
                            : "text-[#154734] border border-[#154734] hover:bg-[#e8f4ef]"
                          }`}
                      >
                        {remitoSel?.id_remito === remito.id_remito ? "Viendo" : "Ver detalle"}
                      </button>
                      <button
                        onClick={() => {
                          const id = Number(remito.id_remito);
                          if (selected.includes(id)) {
                            setSelected((prev) => prev.filter((x) => x !== id));
                          } else {
                            setSelected((prev) => [...prev, id]);
                          }
                        }}
                        className={`flex-1 px-2 py-1.5 rounded text-xs text-white transition ${isSelected ? 'bg-red-600 hover:bg-red-700' : 'bg-[#154734] hover:bg-[#103a2b]'}`}
                      >
                        {isSelected ? "Deseleccionar" : "Seleccionar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => {
                if (selected.length === 0) {
                  const allIds = remitos.map((r) => Number(r.id_remito));
                  setSelected(allIds);
                  setCheckAll(true);
                } else {
                  setSelected([]);
                  setCheckAll(false);
                }
              }}
              className="text-[#154734] border border-[#154734] px-4 py-2 rounded-md text-sm hover:bg-[#e8f4ef]"
            >
              {selected.length === remitos.length && remitos.length > 0
                ? "Deseleccionar todos"
                : "Seleccionar todos"}
            </button>

            {selected.length > 0 && (
              <button
                onClick={deleteSelectedRemitos}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 transition"
              >
                Eliminar seleccionados ({selected.length})
              </button>
            )}
          </div>

          {remitoSel && (
            <div className="mt-6 border-t pt-4">
              <h4 className="font-bold text-[#154734] mb-3">
                Detalle del Remito N° {remitoSel.id_remito}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4 bg-gray-50 p-3 rounded">
                <div>
                  <span className="block text-gray-500">Venta:</span>
                  <span className="font-medium">#{remitoSel.id_venta}</span>
                </div>
                <div>
                  <span className="block text-gray-500">Fecha:</span>
                  <span className="font-medium">
                    {formatFecha(remitoSel.fecha)}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-500">Tipo:</span>
                  <span className="font-medium">
                    {TIPO_LABEL[remitoSel.tipo_venta || remitoSel.tipo] ||
                      remitoSel.tipo_venta ||
                      remitoSel.tipo ||
                      "—"}
                  </span>
                </div>
                <div>
                  <span className="block text-gray-500">Observaciones:</span>
                  <span className="font-medium">
                    {remitoSel.observaciones || "—"}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#e8f4ef] text-[#154734]">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Producto</th>
                      <th className="px-4 py-2 font-semibold text-center">
                        Cant
                      </th>
                      <th className="px-4 py-2 font-semibold text-center">
                        Medida
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {remitoSel.productos &&
                      remitoSel.productos.map((item, idx) => (
                        <tr key={idx} className="border-t border-gray-100">
                          <td className="px-4 py-2">{item.producto}</td>
                          <td className="px-4 py-2 text-center">
                            {item.cantidad}
                          </td>
                          <td className="px-4 py-2 text-center">
                            {item.medida || "—"}
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
    </PageContainer>
  );
}
