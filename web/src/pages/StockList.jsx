// src/pages/StockList.jsx
// src/pages/StockList.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import PageContainer from "../components/pages/PageContainer";
import FilterBar from "../components/forms/FilterBars";
import DataTable from "../components/tables/DataTable";
import Modified from "../components/modals/modified";

// 💡 nuevos imports para crear desde modal
import Modal from "../components/modals/Modals";
import ProductFormTabs from "../components/forms/ProductFormTabs";

// ===== MOCK (ejemplos de Material y Caja)
const STOCK = [
  {
    id: "mat-001",
    tipo: "Material",
    referencia: "Cartón",
    unidad: "kg",
    disponible: 200,
    ultimoMov: "2025-10-08",
    precio: 7000,
  },
  {
    id: "caj-001",
    tipo: "Caja",
    referencia: "Caja corrugada",
    categoria: "Mediana",
    unidad: "u",
    disponible: 50,
    ultimoMov: "2025-10-05",
    precio: 1200,
    medidas: { l: 40, a: 30, h: 20 },
  },
];

export default function StockList() {
  const nav = useNavigate();

  const [items, setItems] = useState(STOCK);

  // === Filtros (mismo patrón que Ventas)
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

  // Mapeo de pills -> tipo
  const tipoMap = {
    Todo: null,
    Cajas: "Caja",
    Materiales: "Material",
  };

  // Handler del FilterBar
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

  // Campos dinámicos del FilterBar según el pill activo
  const filterFields = [
    { label: "Referencia / material", type: "text", placeholder: "Buscar…", name: "buscar" },
    ...(filtroTipo === "Cajas"
      ? [
          {
            label: "Categoría",
            type: "select",
            name: "categoria",
            options: [
              { value: "", label: "Todas" },
              { value: "Chica", label: "Chica" },
              { value: "Mediana", label: "Mediana" },
              { value: "Grande", label: "Grande" },
            ],
          },
          { label: "Largo (cm)", type: "number", name: "medidaL", placeholder: "Ej: 40" },
          { label: "Ancho (cm)", type: "number", name: "medidaA", placeholder: "Ej: 30" },
          { label: "Alto (cm)", type: "number", name: "medidaH", placeholder: "Ej: 20" },
        ]
      : [
          {
            label: "Unidad",
            type: "select",
            name: "medida",
            options: [
              { value: "", label: "Todas" },
              { value: "kg", label: "kg" },
              { value: "u", label: "u" },
            ],
          },
        ]),
    { label: "Desde", type: "date", name: "desde" },
    { label: "Hasta", type: "date", name: "hasta" },
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
        r.referencia.toLowerCase().includes(t) ||
        r.tipo.toLowerCase().includes(t);
      if (!hit) return false;
    }

    // 3) filtros específicos
    if (filtroTipo === "Cajas") {
      // Categoría (Chica/Mediana/Grande)
      if (filtros.categoria && r.categoria !== filtros.categoria) return false;

      // Medidas exactas si se ingresan (match estricto)
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
      // Materiales o Todo → filtro por unidad (kg/u)
      if (filtros.medida && filtros.medida !== r.unidad) return false;
    }

    // 4) fechas (ultimoMov: YYYY-MM-DD)
    const f = new Date(r.ultimoMov);
    if (filtros.desde && f < new Date(filtros.desde)) return false;
    if (filtros.hasta && f > new Date(filtros.hasta)) return false;

    return true;
  });

  // === Columnas (mismo look que Ventas)
  const columns = useMemo(
    () => [
      { id: "tipo", header: "Tipo", accessor: "tipo" },
      { id: "referencia", header: "Referencia", accessor: "referencia" },
      {
        id: "categoria",
        header: "Categoría",
        accessor: (r) => (r.tipo === "Caja" ? r.categoria || "—" : "—"),
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
        accessor: (r) => `${r.disponible} ${r.unidad}`,
        align: "right",
      },
      { id: "ult", header: "Últ. mov.", accessor: "ultimoMov" },
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
      },
      {
        id: "acciones",
        header: "Acciones",
        align: "center",
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

  // === Export (mock)
  const onExport = () => {
    console.log("Exportar stock…", { filtroTipo, filtros });
  };

  // === Guardar cambios desde el modal Modified
  const handleSaveEdited = (payload) => {
    const updated = payload?.rows?.[0];
    if (!updated || !editRow) return;
    setItems((prev) =>
      prev.map((r) => (r.id === editRow.id ? { ...r, ...updated } : r))
    );
  };

  // === Helper: mapear valores del formulario a una fila de tabla
  const mapFormToRow = (v) => {
    if (v.tipo === "Caja") {
      const medida = `${v.medidas.l}x${v.medidas.a}x${v.medidas.h} cm`;
      return {
        id: crypto.randomUUID?.() || String(Date.now()),
        tipo: "Caja",
        referencia: v.referencia,
        categoria: v.categoria,
        medidas: v.medidas,
        unidad: "u",
        disponible: 0,
        ultimoMov: new Date().toISOString().slice(0, 10),
        precio: v.precio,
        medida, // si en algún lado querés string
      };
    } else {
      return {
        id: crypto.randomUUID?.() || String(Date.now()),
        tipo: "Material",
        referencia: v.referencia,
        categoria: "—",
        unidad: v.unidad, // "kg" | "u"
        disponible: v.cantidad || 0,
        ultimoMov: new Date().toISOString().slice(0, 10),
        precio: v.precio,
      };
    }
  };

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
      {/* === Pills y filtros (mismo comp. que Ventas) */}
      <FilterBar
        filters={["Todo", "Cajas", "Materiales"]}
        fields={filterFields}
        onApply={aplicarFiltros}
        onReset={reiniciarFiltros}
        onFilterSelect={handleFilterSelect}
        resetSignal={resetSignal}
        selectedFilter={filtroTipo}
      />

      {/* === Tabla */}
      <div className="mt-6">
        <DataTable
          columns={columns}
          data={dataFiltrada}
          zebra={false}
          stickyHeader={false}
          tableClass="w-full text-sm text-left border-collapse"
          theadClass="bg-[#e8f4ef] text-[#154734]"
          rowClass="hover:bg-[#f6faf7] border-t border-[#edf2ef]"
          headerClass="px-4 py-3 font-semibold"
          cellClass="px-4 py-4"
        />
      </div>

      {/* === Export */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onExport}
          className="inline-flex items-center gap-2 rounded-md bg-[#0f7a4e] text-white px-4 py-2 hover:bg-[#0d6843]"
        >
          <Download className="h-4 w-4" />
          Exportar (Excel/PDF)
        </button>
      </div>

      {/* === Modal CREAR nuevo producto (reutiliza ProductFormTabs) */}
      <Modal
        isOpen={isNewOpen}
        title="Registrar nuevo producto"
        onClose={() => setNewOpen(false)}
        size="max-w-2xl"
      >
        <ProductFormTabs
          mode="create"
          initialValues={{
            tipo: "Caja", // abre en Caja por defecto (podés cambiarlo)
            referencia: "",
            categoria: "",
            medidas: { l: "", a: "", h: "" },
            unidad: "u",
            cantidad: "",
            precio: "",
            notas: "",
          }}
          labels={{ caja: "Caja", material: "Producto" }} // podés dejar "Material" si preferís
          onCancel={() => setNewOpen(false)}
          onSubmit={(values) => {
            const nuevaFila = mapFormToRow(values);
            setItems((prev) => [nuevaFila, ...prev]);
            setNewOpen(false);
          }}
        />
      </Modal>

      {/* === Modal EDITAR con Modified (una sola fila empaquetada en "rows") */}
      {editRow && (
        <Modified
          isOpen={isEditOpen}
          onClose={() => setEditOpen(false)}
          title={`Modificar stock de ${editRow.referencia}`}
          data={{ rows: [editRow] }}
          itemsKey="rows"
          columns={[
            { key: "referencia", label: "Referencia", readOnly: true },
            { key: "tipo", label: "Tipo", readOnly: true },
            { key: "categoria", label: "Categoría" }, // visible sólo si es Caja
            { key: "disponible", label: "Disponible", type: "number", align: "text-center" },
            { key: "unidad", label: "Unidad", align: "text-center" },
            { key: "precio", label: "Precio unitario", type: "number", align: "text-center" },
            { key: "ultimoMov", label: "Últ. mov.", align: "text-center" },
          ]}
          onSave={handleSaveEdited}
        />
      )}
    </PageContainer>
  );
}
