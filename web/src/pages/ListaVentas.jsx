import React, { useState } from "react";
import { Download } from "lucide-react";
import PageContainer from "../components/pages/PageContainer";
import FilterBar from "../components/forms/FilterBars";
import DataTable from "../components/tables/DataTable";
import DetailModal from "../components/modals/Details";
import Modified from "../components/modals/modified";
import { useNavigate } from "react-router-dom";


// 🔹 Datos de ejemplo (mock)
const DATA = [
  {
    numero: 1,
    tipo: "Mixta",
    fecha: "08/10/2025",
    total: 3500,
    observaciones: "—",
    productos: [
      { tipo: "Caja", producto: "Cartón reciclado", cantidad: 10, medida: "kg", precio: 200, subtotal: 2000 },
      { tipo: "Producto", producto: "Papel Kraft", cantidad: 5, medida: "kg", precio: 300, subtotal: 1500 },
    ],
  },
  {
    numero: 2,
    tipo: "Producto",
    fecha: "09/10/2025",
    total: 1250,
    observaciones: "Sin observaciones",
    productos: [
      { tipo: "Producto", producto: "Cartón blanco", cantidad: 2, medida: "kg", precio: 625, subtotal: 1250 },
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

 
  const aplicarFiltros = ({ buscar, desde, hasta, tipo }) => {
    setFiltros({ buscar, desde, hasta });
    if (tipo) setFiltroTipo(tipo);
  };
     

  const reiniciarFiltros = () => {
    setFiltros({ buscar: "", desde: "", hasta: "" });
    setFiltroTipo("Todo");
    setResetSignal((prev) => prev + 1);
  };


  const handleFilterSelect = (tipo) => {
    setFiltroTipo(tipo);
  };

 
  const tipoMap = {
    Todo: null,
    Productos: "Producto",
    Cajas: "Caja",
    Mixtas: "Mixta",
  };

  // Filtrar ventas según los filtros aplicados
  const ventasFiltradas = ventas.filter((v) => {
    // Tipo
    const tipoSeleccionado = tipoMap[filtroTipo];
    if (tipoSeleccionado && v.tipo.toLowerCase() !== tipoSeleccionado.toLowerCase())
      return false;

    // Buscar
    if (filtros.buscar) {
      const texto = filtros.buscar.toLowerCase();
      const coincide =
        v.numero.toString().includes(texto) ||
        v.tipo.toLowerCase().includes(texto) ||
        (v.observaciones || "").toLowerCase().includes(texto);
      if (!coincide) return false;
    }

    // Fechas
    const [d, m, y] = v.fecha.split("/");
    const fechaVenta = new Date(`${y}-${m}-${d}`);
    if (filtros.desde && fechaVenta < new Date(filtros.desde)) return false;
    if (filtros.hasta && fechaVenta > new Date(filtros.hasta)) return false;

    return true;
  });

  // Abrir modal de detalle
  const handleVerDetalle = (venta) => {
    setSelectedVenta(venta);
    setDetailOpen(true);
  };

  // Abrir modal de modificación
  const handleModificar = (venta) => {
    setSelectedVenta(venta);
    setEditOpen(true);
  };

  // Guardar cambios
  const handleGuardarCambios = (updated) => {
    setVentas((prev) => prev.map((v) => (v.numero === updated.numero ? updated : v)));
  };

  // Columnas de la tabla
  const columns = [
    { id: "numero", header: "N° Venta", accessor: "numero" },
    { id: "tipo", header: "Tipo", accessor: "tipo" },
    { id: "fecha", header: "Fecha", accessor: "fecha" },
    {
      id: "total",
      header: "Total",
      render: (row) => `$${row.total}`,
      align: "right",
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
    { id: "observaciones", header: "Observaciones", accessor: "observaciones" },
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
      {/* Barra de filtros */}
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

      {/* Tabla de ventas */}
      <div className="mt-6">
        <DataTable
          columns={columns}
          data={ventasFiltradas}
          zebra={false}
          stickyHeader={false}
          tableClass="w-full text-sm text-left border-collapse"
          theadClass="bg-[#e8f4ef] text-[#154734]"
          rowClass="hover:bg-[#f6faf7] border-t border-[#edf2ef]"
          headerClass="px-4 py-3 font-semibold"
          cellClass="px-4 py-4"
        />
      </div>

      {/* Modal de detalle */}
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

      {/* Modal de modificación */}
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
          onSave={(updatedVenta) => handleGuardarCambios(updatedVenta)}
        />
      )}
    </PageContainer>
  );
}
