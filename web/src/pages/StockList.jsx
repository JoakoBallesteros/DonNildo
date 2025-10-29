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

// ===== MOCK (ejemplos de Material y Caja) — agregué `notas`
const STOCK = [
  {
    id: "mat-001",
    tipo: "Material",
    referencia: "Cartón",
    unidad: "kg",
    disponible: 200,
    ultimoMov: "2025-10-08",
    precio: 7000,
    notas: "Cartón reciclado. Mantener seco.",
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
    notas: "Caja estándar de envíos. No apilar más de 10.",
  },
];

export default function StockList() {
  const nav = useNavigate();

  const [items, setItems] = useState(STOCK);

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

  const filterFields = [
    {
      label: "Referencia / material",
      type: "text",
      placeholder: "Buscar…",
      name: "buscar",
    },
    ...(filtroTipo === "Cajas"
      ? [
          { label: "Categoría", type: "select", name: "categoria" },
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
        r.referencia.toLowerCase().includes(t) ||
        r.tipo.toLowerCase().includes(t);
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
    const f = new Date(r.ultimoMov);
    if (filtros.desde && f < new Date(filtros.desde)) return false;
    if (filtros.hasta && f > new Date(filtros.hasta)) return false;

    return true;
  });

  const columns = useMemo(
    () => [
      // Texto simples
      { id: "tipo", header: "Tipo", accessor: "tipo", sortable: true },
      {
        id: "referencia",
        header: "Referencia",
        accessor: "referencia",
        sortable: true,
      },

      // Categoría solo aplica a Caja; para Material muestro —, igual lo hacemos ordenable por string
      {
        id: "categoria",
        header: "Categoría",
        accessor: (r) => (r.tipo === "Caja" ? r.categoria || "—" : "—"),
        sortable: true,
        sortAccessor: (r) =>
          r.tipo === "Caja" ? (r.categoria || "").toLowerCase() : "", // string
      },

      // Medida (string), si querés ordenarla también puedes marcar sortable: true
      {
        id: "medida",
        header: "Medida",
        accessor: (r) =>
          r.tipo === "Caja" && r.medidas
            ? `${r.medidas.l}x${r.medidas.a}x${r.medidas.h} cm`
            : "—",
        // sortable: true, // opcional (ordena como string "40x30x20 cm")
      },

      // Numérico
      {
        id: "disp",
        header: "Disponible (u/kg)",
        accessor: (r) => `${r.disponible} ${r.unidad}`,
        align: "right",
        cellClass: "text-right whitespace-nowrap",
        sortable: true,
        sortAccessor: (r) => Number(r.disponible || 0), // número
      },

      // Fecha
      {
        id: "ult",
        header: "Últ. mov.",
        accessor: "ultimoMov",
        cellClass: "whitespace-nowrap",
        sortable: true,
        sortAccessor: (r) => r.ultimoMov, // si viene YYYY-MM-DD, el string ordena bien; si no, usa new Date(r.ultimoMov)
      },

      // Moneda/numérico
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
        sortAccessor: (r) => Number(r.precio || 0), // número
      },

      // Botón de detalle (no ordenable)
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

      // Acciones (no ordenable)
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

  // === Export (mock)
  const onExport = () => {
    console.log("Exportar stock…", { filtroTipo, filtros });
  };

  // === Guardar cambios desde el modal Modified
  const handleSaveEdited = (payload) => {
    let updated = payload?.rows?.[0];
    if (!updated || !editRow) return;

    // Normalizaciones:
    // - Si es caja y llegaron l/a/h sueltos, formo `medidas`
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

      // unidad en caja siempre 'u'
      updated.unidad = "u";
    } else {
      // Material → unidad puede venir del select ('kg' | 'u')
      if (updated.unidad !== "kg" && updated.unidad !== "u") {
        updated.unidad = editRow.unidad; // fallback
      }
    }

    // Nunca permitimos cambiar ultimoMov desde UI (readOnly),
    // pero si llegara, lo ignoramos
    updated.ultimoMov = editRow.ultimoMov;

    setItems((prev) =>
      prev.map((r) => (r.id === editRow.id ? { ...r, ...updated } : r))
    );
  };

  // === Helper: mapear valores del formulario a una fila de tabla
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
        unidad: v.unidad, // "kg" | "u"
        disponible: Number(v.cantidad || 0),
        ultimoMov: new Date().toISOString().slice(0, 10),
        precio: Number(v.precio || 0),
        notas: v.notas || "",
      };
    }
  };

  // === Columnas dinámicas para el modal de edición
  const editColumns = useMemo(() => {
    if (!editRow) return [];

    // Base
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
      // Mostrar medidas y fijar unidad
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
      // Material → unidad editable con pick 'kg'/'u'
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
      {/* === Pills y filtros */}
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
      <DataTable
        columns={columns}
        data={dataFiltrada}
        zebra={false}
        stickyHeader={false}
        tableClass="w-full text-sm border-collapse mt-6"
        theadClass="bg-[#e8f4ef] text-[#154734]"
        rowClass="hover:bg-[#f6faf7] border-t border-[#edf2ef]"
        headerClass="px-4 py-3 font-semibold"
        cellClass="px-4 py-4"
        enableSort
      />

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

      {/* === Modal CREAR nuevo producto */}
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
          onSubmit={(values) => {
            const nuevaFila = mapFormToRow(values);
            setItems((prev) => [nuevaFila, ...prev]);
            setNewOpen(false);
          }}
        />
      </Modal>

      {/* === Modal EDITAR */}
      {editRow && (
        <Modified
          isOpen={isEditOpen}
          onClose={() => setEditOpen(false)}
          title={`Modificar stock de ${editRow.referencia}`}
          data={{
            rows: [
              {
                ...editRow,
                // precarga medidas l/a/h en inputs planos si es Caja
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

      {/* === Modal DETALLE (muestra notas) */}
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
              <span className="col-span-2">
                {detailRow.disponible} {detailRow.unidad}
              </span>

              <span className="font-semibold text-[#154734]">Últ. mov.:</span>
              <span className="col-span-2">{detailRow.ultimoMov}</span>

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
