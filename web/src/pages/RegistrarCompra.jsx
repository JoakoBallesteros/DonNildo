// src/pages/RegistrarCompra.jsx
import {  useMemo, useRef, useState } from "react";
import { Plus, ChevronDown, Calendar } from "lucide-react";

/* Layout & UI */
import PageContainer from "../components/pages/PageContainer.jsx";
import PrimaryButton from "../components/buttons/PrimaryButton.jsx";
import IconButton from "../components/buttons/IconButton.jsx";
import ActionButton from "../components/buttons/ActionButton.jsx";
import DataTable from "../components/tables/DataTable.jsx";

/* Formularios / Modales */
import ProductFormTabs from "../components/forms/ProductFormTabs.jsx";
import Modal from "../components/modals/Modals.jsx";
import Modified from "../components/modals/Modified.jsx";

/* ====== Mock básico ====== */
const PRODUCTOS = [
  { id: "p1", nombre: "Cartón corrugado", tipo: "Productos", medida: "kg", precioRef: 250 },
  { id: "p2", nombre: "Papel blanco",      tipo: "Productos", medida: "kg", precioRef: 300 },
  { id: "c1", nombre: "Caja 40x30",        tipo: "Cajas",     medida: "u",  precioRef: 1800 },
];

const PROVEEDORES = [
  { id: "prov1", nombre: "Reciclados Norte S.A." },
  { id: "prov2", nombre: "Plásticos del Sur" },
  { id: "prov3", nombre: "Vidrios Industriales" },
];

/* ====== Helpers ====== */
const fmt    = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 });
const fmtNum = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const toNumber = (v) =>
  Number(String(v ?? "").replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "")) || 0;

/* ====== Página ====== */
export default function RegistrarCompra() {
  // Form principal
  const [producto, setProducto]         = useState(null);
  const [busquedaProd, setBusquedaProd] = useState("");
  const [cantidad, setCantidad]         = useState("");
  const [precioUnit, setPrecioUnit]     = useState("");
  const [proveedor, setProveedor]       = useState("");
  const [fecha, setFecha]               = useState("");
  const [obs, setObs]                   = useState("");

  // Items agregados
  const [items, setItems]               = useState([]);

  // Modales
  const [newProdOpen, setNewProdOpen]   = useState(false);
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [editOpen, setEditOpen]         = useState(false);
  const [editRow, setEditRow]           = useState(null);

  // Focus
  const cantRef = useRef(null);

  const subtotalCalc = useMemo(() => {
    const q = toNumber(cantidad);
    const p = toNumber(precioUnit);
    return q && p ? q * p : 0;
  }, [cantidad, precioUnit]);

  const productosFiltrados = useMemo(() => {
    const q = busquedaProd.trim().toLowerCase();
    if (!q) return PRODUCTOS;
    return PRODUCTOS.filter((p) => p.nombre.toLowerCase().includes(q));
  }, [busquedaProd]);

  function onSelectProducto(p) {
    setProducto(p);
    setBusquedaProd(p.nombre);
    if (!precioUnit) setPrecioUnit(String(p.precioRef));
    setTimeout(() => cantRef.current?.focus(), 0);
  }

  function addItem() {
    if (!producto) return;
    const cant = toNumber(cantidad);
    const pu   = toNumber(precioUnit);
    if (cant <= 0 || pu <= 0) return;

    const nuevo = {
      id: crypto.randomUUID(),
      tipo: producto.tipo,
      producto: producto.nombre,
      medida: producto.medida,
      cantidad: cant,
      precioUnit: pu,
      subtotal: cant * pu,
      obs: obs?.trim() || "—",
      proveedor: proveedor || "",
      fecha: fecha || "",
      prodId: producto.id,
    };
    setItems((prev) => [...prev, nuevo]);

    // limpiar campos
    setCantidad("");
    setPrecioUnit("");
    setObs("");
    setBusquedaProd("");
    setProducto(null);
  }

  function eliminarItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  // Subtotales por tipo
  const subCajas = useMemo(() => {
    const list  = items.filter((i) => i.tipo === "Cajas");
    const cant  = list.reduce((a, b) => a + (Number(b.cantidad) || 0), 0);
    const total = list.reduce((a, b) => a + (Number(b.subtotal) || 0), 0);
    return { cant, total };
  }, [items]);

  const subProductos = useMemo(() => {
    const list   = items.filter((i) => i.tipo === "Productos");
    const cantKg = list.reduce((a, b) => a + (Number(b.cantidad) || 0), 0);
    const total  = list.reduce((a, b) => a + (Number(b.subtotal) || 0), 0);
    return { cantKg, total };
  }, [items]);

  const totalCompra = useMemo(
    () => items.reduce((a, b) => a + (Number(b.subtotal) || 0), 0),
    [items]
  );

  // Guardar / Cancelar
  function onCancelar() {
    setItems([]);
    setProducto(null);
    setBusquedaProd("");
    setCantidad("");
    setPrecioUnit("");
    setProveedor("");
    setFecha("");
    setObs("");
  }

  function onGuardar() {
    setConfirmOpen(true);
  }

  function onConfirmarGuardar() {
    // TODO: integrar con API real
    console.log("Guardar compra:", { proveedor, fecha, items, total: totalCompra });
    setConfirmOpen(false);
    onCancelar();
  }

  // ===== Edición de un ítem con Modified (adapter precioUnit <-> precio) =====
  const editColumns = [
    { key: "tipo",       label: "Tipo" },
    { key: "producto",   label: "Producto / Material", width: "220px", type: "text" },
    { key: "cantidad",   label: "Cantidad",            width: "120px", type: "number" },
    { key: "medida",     label: "Medida",              width: "120px", type: "text" },
    { key: "precio",     label: "Precio unit.",        width: "140px", type: "number" }, // usa "precio" para recalcular
    { key: "subtotal",   label: "Subtotal",            width: "140px", readOnly: true },
  ];

  const computeTotal = (list) =>
    list.reduce((sum, r) => sum + Number(r.subtotal || 0), 0).toFixed(2);

  function abrirEditar(row) {
    const rowForEdit = { ...row, precio: row.precioUnit }; // mapeo al nombre que Modified utiliza
    setEditRow(rowForEdit);
    setEditOpen(true);
  }

  function onSaveEdit(updatedObj) {
    // puede venir como { items:[fila] } o como objeto directo
    const edited = (updatedObj?.items && updatedObj.items[0]) || updatedObj;
    const normalized = {
      ...edited,
      precioUnit: Number(edited.precio || 0),
      subtotal: Number(edited.cantidad || 0) * Number(edited.precio || 0),
    };
    setItems((prev) =>
      prev.map((it) => (it.id === normalized.id ? { ...it, ...normalized } : it))
    );
    setEditOpen(false);
    setEditRow(null);
  }

  const addDisabled = !producto || toNumber(cantidad) <= 0 || toNumber(precioUnit) <= 0;

  // Atajos: Esc = cancelar, Ctrl/Cmd+Enter = guardar
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancelar();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "enter" && items.length > 0) {
        onGuardar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length]);

  /* ====== DataTable: Próximos a confirmar ====== */
  const columns = [
    { id: "tipo", header: "Tipo", accessor: (r) => r.tipo, align: "center", width: "110px" },
    { id: "producto", header: "Producto", accessor: (r) => r.producto, align: "center" },
    { id: "medida", header: "Medida/Estado", accessor: (r) => r.medida, align: "center", width: "130px" },
    { id: "cantidad", header: "Cant. (u/kg)", render: (r) => fmtNum.format(r.cantidad), align: "center", width: "130px" },
    { id: "precioUnit", header: "Precio unit.", render: (r) => fmt.format(r.precioUnit), align: "center", width: "140px" },
    { id: "subtotal", header: "Subtotal", render: (r) => fmt.format(r.subtotal), align: "center", width: "140px" },
    { id: "obs", header: "Observ.", accessor: (r) => r.obs, align: "center" },
    {
      id: "acciones",
      header: "Acciones",
      align: "center",
      width: "170px",
      render: (row) => (
        <div className="flex justify-center items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => abrirEditar(row)}
              className="bg-[#154734] text-white px-3 py-1 text-xs rounded-md hover:bg-[#1E5A3E]"
            >
              MODIFICAR
            </button>
            <button
              onClick={() => eliminarItem(row.id)}
              className="bg-[#A30000] text-white px-5 py-1 text-xs rounded-md hover:bg-[#7A0000]"
            >
              ANULAR
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Registrar Compra"
      actions={
        <IconButton
          title="Crear nuevo producto"
          variant="outline"
          className="rounded-full"
          onClick={() => setNewProdOpen(true)}
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">Nuevo producto</span>
        </IconButton>
      }
    >
      {/* Datos de la compra */}
      <div className="rounded-2xl border border-emerald-100 bg-white">
        <div className="p-4 md:p-5">
          <p className="text-[13px] font-semibold text-emerald-900 mb-3">Datos de la compra</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Producto + Tipo */}
            <div className="grid grid-cols-[1fr,150px] gap-3">
              <div className="relative">
                <label className="block text-sm text-emerald-900 mb-1">Producto</label>
                <div className="relative">
                  <input
                    value={busquedaProd}
                    onChange={(e) => {
                      setBusquedaProd(e.target.value);
                      setProducto(null);
                    }}
                    placeholder="Buscar o escribir"
                    className="h-9 w-full rounded-md border border-emerald-200 bg-white pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 pointer-events-none" />
                </div>

                {/* Dropdown simple */}
                {busquedaProd && !producto && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border bg-white shadow max-h-56 overflow-auto">
                    {productosFiltrados.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">Sin resultados</div>
                    )}
                    {productosFiltrados.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onSelectProducto(p)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-emerald-50"
                      >
                        {p.nombre}{" "}
                        <span className="text-gray-500">({p.tipo} · {p.medida})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-emerald-900 mb-1">Tipo</label>
                <div className="h-9 w-full rounded-md border border-emerald-200 bg-gray-50 text-sm px-3 flex items-center">
                  {producto ? producto.tipo : "—"}
                </div>
              </div>
            </div>

            {/* Cantidad / Precio / Subtotal */}
            <div className="grid grid-cols-[1fr,1fr,1fr] gap-3">
              <div>
                <label className="block text-sm text-emerald-900 mb-1">Cant. (u/kg)</label>
                <input
                  ref={cantRef}
                  inputMode="decimal"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="0"
                  className="h-9 w-full rounded-md border border-emerald-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-sm text-emerald-900 mb-1">Precio unit.</label>
                <input
                  inputMode="decimal"
                  value={precioUnit}
                  onChange={(e) => setPrecioUnit(e.target.value)}
                  placeholder="0,00"
                  className="h-9 w-full rounded-md border border-emerald-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="block text-sm text-emerald-900 mb-1">Subtotal</label>
                <div className="h-9 w-full rounded-md border border-emerald-200 bg-gray-50 text-sm px-3 flex items-center">
                  {subtotalCalc ? fmt.format(subtotalCalc) : "—"}
                </div>
              </div>
            </div>

            {/* Proveedor / Fecha / Observaciones */}
            <div className="grid grid-cols-[1fr,190px,1fr] gap-3 col-span-1 md:col-span-2">
              <div className="relative">
                <label className="block text-sm text-emerald-900 mb-1">Proveedor (opcional)</label>
                <div className="relative">
                  <select
                    value={proveedor}
                    onChange={(e) => setProveedor(e.target.value)}
                    className="h-9 w-full rounded-md border border-emerald-200 bg-white pr-8 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  >
                    <option value="">Seleccione un proveedor</option>
                    {PROVEEDORES.map((p) => (
                      <option key={p.id} value={p.nombre}>{p.nombre}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm text-emerald-900 mb-1">Fecha</label>
                <Calendar className="absolute left-3 top-9 h-4 w-4 text-emerald-400" />
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="h-9 w-full rounded-md border border-emerald-200 bg-white pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-sm text-emerald-900 mb-1">Observaciones</label>
                <input
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  placeholder="Opcional"
                  className="h-9 w-full rounded-md border border-emerald-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            {/* Botón Añadir */}
            <div className="col-span-1 md:col-span-2 flex justify-end">
              <PrimaryButton
                onClick={addItem}
                className={`rounded-full ${addDisabled ? "opacity-60 pointer-events-none" : ""}`}
                text={
                  <span className="inline-flex items-center gap-2">
                    <Plus className="h-4 w-4" /> Añadir
                  </span>
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Próximos a confirmar */}
      <div>
        <p className="text-[12px] text-emerald-900 mb-1 ml-2">Próximos a confirmar</p>
        <DataTable
          columns={columns}
          data={items}
          rowKey={(row) => row.id}
          zebra={false}
          stickyHeader={false}
          tableClass="w-full text-sm text-center border-collapse"
          theadClass="bg-[#e8f4ef] text-[#154734]"
          rowClass="hover:bg-[#f6faf7] border-t border-[#edf2ef]"
          headerClass="px-4 py-3 font-semibold text-center"
          cellClass="px-4 py-3 text-center"
        />
      </div>

      {/* Subtotales y total */}
      <div className="flex flex-wrap gap-6 text-[13px] text-gray-700 mt-3">
        <div>
          <span className="font-medium">Subtotales:</span>{" "}
          Cajas: {fmtNum.format(subCajas.cant)} u — {fmt.format(subCajas.total)}
        </div>
        <div>
          <span className="font-medium">Subtotales:</span>{" "}
          Productos: {fmtNum.format(subProductos.cantKg)} kg — {fmt.format(subProductos.total)}
        </div>
        <div className="ml-auto">
          <div className="rounded-xl border border-emerald-100 bg-white px-4 py-2 inline-flex items-center gap-3">
            <span className="text-emerald-900 font-semibold">Total compra:</span>
            <span className="text-emerald-900 font-bold">{fmt.format(totalCompra)}</span>
          </div>
        </div>
      </div>

      {/* === Footer acciones (igual a RegistrarVenta) === */}
      <div className="flex justify-center gap-4 py-10">
        <button
          onClick={onCancelar}
          className="px-6 py-2 rounded-md border border-[#154734] text-[#154734] hover:bg-[#e8f4ef] transition"
        >
          CANCELAR
        </button>

        <button
          onClick={onGuardar}
          disabled={items.length === 0}
          className={`px-6 py-2 rounded-md text-white transition ${
            items.length === 0
              ? "bg-[#154734]/50 cursor-not-allowed"
              : "bg-[#154734] hover:bg-[#103a2b]"
          }`}
        >
          GUARDAR
        </button>
      </div>

      {/* === MODAL: Nuevo producto === */}
      <Modal
        isOpen={newProdOpen}
        title="Registrar nuevo producto"
        onClose={() => setNewProdOpen(false)}
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
          onSubmit={(values) => {
            console.log("Crear producto", values);
            setNewProdOpen(false);
          }}
          onCancel={() => setNewProdOpen(false)}
        />
      </Modal>

      {/* === MODAL: Confirmar registro === */}
      <Modal
        isOpen={confirmOpen}
        title="Confirmar registro de la compra"
        onClose={() => setConfirmOpen(false)}
        size="max-w-xl"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setConfirmOpen(false)}
              className="rounded-md border border-[#154734] text-[#154734] px-4 py-2 hover:bg-[#e8f4ef]"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmarGuardar}
              className="bg-[#154734] text-white px-6 py-2 rounded-md hover:bg-[#103a2b]"
            >
              Confirmar
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-[#154734]">
            Va a registrar una compra de <strong>{fmt.format(totalCompra)}</strong>.
          </p>
          <ul className="list-disc pl-5 text-sm text-slate-700">
            <li>Proveedor: {proveedor || "—"}</li>
            <li>Fecha: {fecha || "—"}</li>
            <li>Ítems: {items.length}</li>
          </ul>
        </div>
      </Modal>

      {/* === MODAL: Editar Ítem (Modified con adapter) === */}
      {editOpen && editRow && (
        <Modified
          isOpen={editOpen}
          onClose={() => {
            setEditOpen(false);
            setEditRow(null);
          }}
          title={`Modificar ítem — ${editRow.producto ?? ""}`}
          // Editamos una sola fila: se la pasamos como items[0]
          data={{ ...editRow, items: [{ ...editRow }] }}
          itemsKey="items"
          columns={editColumns}
          computeTotal={computeTotal}
          onSave={onSaveEdit}
          size="max-w-4xl"
        />
      )}
    </PageContainer>
  );
}
