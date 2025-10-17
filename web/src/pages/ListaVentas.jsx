import React, { useState } from "react";
import { Download } from "lucide-react";
import PageContainer from "../components/pages/PageContainer";
import FilterBar from "../components/forms/FilterBars";
import DataTable from "../components/tables/DataTable";
import DetailModal from "../components/modals/Details";
import Modified from "../components/modals/modified";
import { useNavigate } from "react-router-dom";

// 🔹 Datos simulados coherentes con RegistrarVentas
const DATA = [
  {
    numero: 101,
    tipo: "Caja",
    fecha: "2025-10-10",
    total: 15000,
    observaciones: "—",
    productos: [
      {
        tipo: "Caja",
        producto: "Caja de cartón",
        cantidad: 10,
        medida: "u",
        precio: 1500,
        subtotal: 15000,
      },
    ],
  },
  {
    numero: 102,
    tipo: "Producto",
    fecha: "2025-10-11",
    total: 12000,
    observaciones: "—",
    productos: [
      {
        tipo: "Producto",
        producto: "Papel Kraft",
        cantidad: 20,
        medida: "kg",
        precio: 600,
        subtotal: 12000,
      },
    ],
  },
  {
    numero: 103,
    tipo: "Mixta",
    fecha: "2025-10-12",
    total: 18000,
    observaciones: "Venta combinada",
    productos: [
      {
        tipo: "Caja",
        producto: "Combinado EcoPack",
        cantidad: 5,
        medida: "u",
        precio: 2000,
        subtotal: 10000,
      },
      {
        tipo: "Producto",
        producto: "Papel Kraft",
        cantidad: 10,
        medida: "kg",
        precio: 800,
        subtotal: 8000,
      },
    ],
  },
];

export default function Ventas() {
  const [ventas, setVentas] = useState(DATA);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const navigate = useNavigate();

  const [filtroTipo, setFiltroTipo] = useState("Todo");
  const [filtros, setFiltros] = useState({ buscar: "", desde: "", hasta: "" });
  const [resetSignal, setResetSignal] = useState(0);

  // 🔹 Aplicar filtros
  const aplicarFiltros = ({ buscar, desde, hasta, tipo }) => {
    setFiltros({ buscar, desde, hasta });
    if (tipo) setFiltroTipo(tipo);
  };

  const reiniciarFiltros = () => {
    setFiltros({ buscar: "", desde: "", hasta: "" });
    setFiltroTipo("Todo");
    setResetSignal((prev) => prev + 1);
  };

  const handleFilterSelect = (tipo) => setFiltroTipo(tipo);

  const tipoMap = {
    Todo: null,
    Productos: "Producto",
    Cajas: "Caja",
    Mixtas: "Mixta",
  };

  // 🔹 Filtrado de ventas
  const ventasFiltradas = ventas.filter((v) => {
    const tipoSeleccionado = tipoMap[filtroTipo];
    if (tipoSeleccionado && v.tipo.toLowerCase() !== tipoSeleccionado.toLowerCase())
      return false;

    if (filtros.buscar) {
      const texto = filtros.buscar.toLowerCase();
      const coincide =
        v.numero.toString().includes(texto) ||
        v.tipo.toLowerCase().includes(texto) ||
        (v.observaciones || "").toLowerCase().includes(texto);
      if (!coincide) return false;
    }

    const [y, m, d] = v.fecha.includes("-")
      ? v.fecha.split("-")
      : v.fecha.split("/").reverse();
    const fechaVenta = new Date(`${y}-${m}-${d}`);
    if (filtros.desde && fechaVenta < new Date(filtros.desde)) return false;
    if (filtros.hasta && fechaVenta > new Date(filtros.hasta)) return false;

    return true;
  });

  // 🔹 Modales
  const handleVerDetalle = (venta) => {
    setSelectedVenta(venta);
    setDetailOpen(true);
  };

  const handleModificar = (venta) => {
    setSelectedVenta(venta);
    setEditOpen(true);
  };

  const handleGuardarCambios = (updated) => {
    setVentas((prev) => prev.map((v) => (v.numero === updated.numero ? updated : v)));
  };

  const handleAnular = (numero) => {
    setVentas((prev) => prev.filter((v) => v.numero !== numero));
  };

  // 🔹 Columnas de la tabla
  const columns = [
    { id: "numero", header: "N° Venta", accessor: "numero", align: "center" },
    { id: "tipo", header: "Tipo", accessor: "tipo", align: "center" },
    { id: "fecha", header: "Fecha", accessor: "fecha", align: "center" },
    {
      id: "total",
      header: "Total ($)",
      render: (row) => `$${row.total.toLocaleString("es-AR")}`,
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
      id: "observaciones",
      header: "Observaciones",
      accessor: "observaciones",
      align: "center",
    },
    {
      id: "acciones",
      header: "Acciones",
      align: "center",
      render: (row) => (
        <div className="flex justify-center items-start gap-2">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleModificar(row)}
              className="bg-[#154734] text-white px-3 py-1 text-xs rounded-md hover:bg-[#1E5A3E]"
            >
              MODIFICAR
            </button>
            <button
              onClick={() =>
                setVentas((prev) => prev.filter((v) => v.numero !== row.numero))
              }
              className="bg-[#A30000] text-white px-3 py-1 text-xs rounded-md hover:bg-[#7A0000]"
            >
              ANULAR
            </button>
          </div>
          <button
            className="p-1 border border-[#d8e4df] rounded-md hover:bg-[#f7faf9] mt-1"
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
          className="bg-[#154734] text-white px-4 py-2 rounded-md hover:bg-[#103a2b] transition"
        >
          Añadir nueva venta
        </button>
      }
    >
      {/* 🔹 Barra de filtros */}
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
      />

      {/* 🔹 Tabla */}
      <div className="mt-6">
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
      </div>

      {/* 🔹 Modal Detalle */}
      <DetailModal
        isOpen={isDetailOpen}
        onClose={() => setDetailOpen(false)}
        title="Detalle de Venta"
        data={selectedVenta}
        itemsKey="productos"
        columns={[
          { key: "tipo", label: "Tipo" },
          { key: "producto", label: "Producto" },
          { key: "cantidad", label: "Cantidad" },
          { key: "medida", label: "Medida" },
          { key: "precio", label: "Precio Unitario" },
          { key: "subtotal", label: "Subtotal" },
        ]}
      />

      {/* 🔹 Modal Modificar */}
      {selectedVenta && (
        <Modified
          isOpen={isEditOpen}
          onClose={() => setEditOpen(false)}
          title={`Modificar productos de Venta N° ${selectedVenta.numero}`}
          data={selectedVenta}
          itemsKey="productos"
          columns={[
            { key: "tipo", label: "Tipo" },
            { key: "producto", label: "Producto" },
            { key: "cantidad", label: "Cantidad", type: "number", align: "text-center" },
            { key: "medida", label: "Medida", align: "text-center" },
            { key: "precio", label: "Precio Unitario", type: "number", align: "text-center" },
            { key: "subtotal", label: "Subtotal", readOnly: true, align: "text-center" },
          ]}
          computeTotal={(rows) =>
            rows.reduce((sum, r) => sum + Number(r.subtotal || 0), 0)
          }
          extraFooter={
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-semibold text-[#154734] mr-2">
                  Fecha:
                </label>
                <input
                  type="text"
                  value={selectedVenta.fecha || ""}
                  className="border border-slate-200 rounded-md px-3 py-1"
                  readOnly
                />
              </div>
              <p className="text-lg font-semibold text-[#154734]">
                Total: ${selectedVenta.total?.toFixed(2) || "0.00"}
              </p>
            </div>
          }
          onSave={handleGuardarCambios}
        />
      )}
    </PageContainer>
  );
}
