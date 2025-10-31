// src/pages/StockPesaje.jsx
import React, { useMemo, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import PageContainer from "../components/pages/PageContainer";
import DataTable from "../components/tables/DataTable";
import Modified from "../components/modals/Modified";
import PrintButton from "../components/buttons/PrintButton";

// Mock materiales
const MATERIALES = [
  { id: "mat-001", nombre: "Cartón" },
  { id: "mat-002", nombre: "Papel Kraft" },
  { id: "mat-003", nombre: "Plástico" },
];

function IconButton({ children, className = "", ...rest }) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-md text-sm bg-[#154734] text-white px-3 py-2 hover:bg-[#103a2b] ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export default function StockPesaje() {
  const [matId, setMatId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [precioKg, setPrecioKg] = useState("");
  const [obsFila, setObsFila] = useState("");

  const [items, setItems] = useState([]);

  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  const limpiarForm = () => {
    setMatId("");
    setCantidad("");
    setPrecioKg("");
    setObsFila("");
  };

  const onAdd = () => {
    const material = MATERIALES.find((m) => m.id === matId);
    const cant = Number(cantidad);
    const precio = Number(precioKg || 0);
    if (!material) return alert("Seleccioná el tipo de material");
    if (!cant || cant <= 0) return alert("Ingresá la cantidad (kg)");

    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        tipo: material.nombre,
        cantidad: cant,
        precio,
        subtotal: cant * precio,
        observaciones: obsFila || "—",
      },
    ]);
    limpiarForm();
  };

  const onDelete = (row) =>
    setItems((prev) => prev.filter((r) => r.id !== row.id));

  const onOpenEdit = (row) => {
    setEditRow(row);
    setEditOpen(true);
  };

  const onSaveEdited = (payload) => {
    const updated = payload?.rows?.[0];
    if (!updated || !editRow) return;
    const cant = Number(updated.cantidad || 0);
    const precio = Number(updated.precio || 0);
    const recalc = { ...updated, subtotal: cant * precio };
    setItems((prev) => prev.map((r) => (r.id === editRow.id ? recalc : r)));
  };

  const columns = useMemo(
    () => [
      // Texto (izquierda)
      {
        id: "tipo",
        header: "Tipo",
        accessor: "tipo",
        width: 200,
        align: "left",
      },

      // Números (derecha) + dígitos parejos
      {
        id: "cantidad",
        header: "Cantidad (kg)",
        accessor: (r) => r.cantidad,
        align: "right",
        width: 140,
        cellClass: "tabular-nums whitespace-nowrap",
      },
      {
        id: "precioKg",
        header: "Precio x Kg",
        accessor: (r) =>
          (r.precio ?? 0).toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
          }),
        align: "right",
        width: 140,
        cellClass: "tabular-nums whitespace-nowrap",
      },
      {
        id: "subtotal",
        header: "Subtotal",
        accessor: (r) =>
          (r.subtotal ?? 0).toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
          }),
        align: "right",
        width: 140,
        cellClass: "tabular-nums whitespace-nowrap",
      },

      // Texto (izquierda)
      {
        id: "obs",
        header: "Observaciones",
        accessor: (r) => r.observaciones || "—",
        align: "left",
        width: 260,
      },

      // Botones (centrado) con ancho fijo para que no desplace
      {
        id: "acc",
        header: "Acciones",
        align: "center",
        width: 200,
        render: (row) => (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onOpenEdit(row)}
              className="inline-flex items-center gap-1 rounded-md text-xs bg-[#154734] text-white px-2 py-1 hover:bg-[#103a2b] whitespace-nowrap"
            >
              <Pencil className="w-4 h-4" />
              Modificar
            </button>
            <button
              onClick={() => onDelete(row)}
              className="inline-flex items-center gap-1 rounded-md text-xs bg-[#a30000] text-white px-2 py-1 hover:bg-[#7a0000] whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <PageContainer title="Registro de Pesaje">
      {/* Form de alta compacto */}
      <div className="bg-white rounded-2xl border border-[#e3e9e5] p-5 md:p-6 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_auto] gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-[#154734] mb-1">
              Tipo de Material
            </label>
            <select
              value={matId}
              onChange={(e) => setMatId(e.target.value)}
              className="border border-[#d8e4df] rounded-md px-3 py-2"
            >
              <option value="">Seleccione…</option>
              {MATERIALES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-[#154734] mb-1">
              Cantidad (kg)
            </label>
            <input
              type="number"
              min={0}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              placeholder="Ingresar cantidad…"
              className="border border-[#d8e4df] rounded-md px-3 py-2"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm font-semibold text-[#154734] mb-1">
              Precio x Kg (opcional)
            </label>
            <input
              type="number"
              min={0}
              value={precioKg}
              onChange={(e) => setPrecioKg(e.target.value)}
              placeholder="Ingresar precio…"
              className="border border-[#d8e4df] rounded-md px-3 py-2"
            />
          </div>

          <div className="flex md:justify-end">
            <IconButton onClick={onAdd} className="px-4 py-2">
              <Plus className="w-4 h-4" />
              <span className="font-medium">Añadir</span>
            </IconButton>
          </div>

          <div className="md:col-span-4 flex flex-col">
            <label className="text-sm font-semibold text-[#154734] mb-1">
              Observaciones (opcional)
            </label>
            <input
              value={obsFila}
              onChange={(e) => setObsFila(e.target.value)}
              placeholder="(Opcional)"
              className="border border-[#d8e4df] rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Tabla envuelta en un contenedor con id para imprimir solo esa parte */}
      <div
        id="pesaje-print"
        className="bg-white rounded-2xl border border-[#e3e9e5] p-3 md:p-4"
      >
        <DataTable
          columns={columns}
          data={items}
          zebra={false}
          stickyHeader={false}
          theadClass="bg-[#e8f4ef] text-[#154734]"
          rowClass="hover:bg-[#f6faf7] border-t border-[#edf2ef]"
          headerClass="px-3 py-2.5 font-semibold"
          cellClass="px-3 py-2.5"
          emptyLabel="Sin ítems cargados"
        />
      </div>

      {/* Acciones: imprimir a la derecha */}
      <div className="mt-5 flex items-center">
        <div className="ml-auto">
          <PrintButton targetId="pesaje-print" />
        </div>
      </div>

      {/* Botones centrados */}
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          className="rounded-md border border-[#154734] text-[#154734] px-8 py-2 hover:bg-[#e8f4ef]"
          onClick={() => {
            setItems([]);
            limpiarForm();
          }}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="bg-[#154734] text-white px-8 py-2 rounded-md hover:bg-[#103a2b]"
          onClick={() => console.log("Confirmar pesaje:", items)}
        >
          Confirmar
        </button>
      </div>

      {/* Modal editar fila */}
      {editRow && (
        <Modified
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          title={`Modificar: ${editRow.tipo}`}
          data={{ rows: [editRow] }}
          itemsKey="rows"
          columns={[
            { key: "tipo", label: "Tipo", readOnly: true },
            {
              key: "cantidad",
              label: "Cantidad (kg)",
              type: "number",
              align: "text-center",
            },
            {
              key: "precio",
              label: "Precio x Kg",
              type: "number",
              align: "text-center",
            },
            { key: "observaciones", label: "Observaciones" },
            {
              key: "subtotal",
              label: "Subtotal",
              readOnly: true,
              align: "text-center",
            },
          ]}
          computeTotal={(rows) =>
            rows.reduce(
              (sum, r) => sum + Number(r.cantidad || 0) * Number(r.precio || 0),
              0
            )
          }
          onSave={onSaveEdited}
        />
      )}
    </PageContainer>
  );
}
