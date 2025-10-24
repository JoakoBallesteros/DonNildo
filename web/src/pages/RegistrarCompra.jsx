// src/pages/RegistrarCompra.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, ChevronDown, Calendar } from "lucide-react";

// Botones reutilizables
import PrimaryButton from "../components/buttons/PrimaryButton.jsx";
import IconButton from "../components/buttons/IconButton.jsx";
import ActionButton from "../components/buttons/ActionButton.jsx";

// Formulario de producto
import ProductFormTabs from "../components/forms/ProductFormTabs.jsx";

// ▶️ usa TU modal genérico
import Modal from "../components/modals/Modals.jsx";

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

  // Items agregados (próximos a confirmar)
  const [items, setItems]               = useState([]);

  // Modal “Nuevo producto”
  const [newProdOpen, setNewProdOpen]   = useState(false);

  // Focus helpers
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
    // cierra el “dropdown” y va directo a cantidad
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

    // limpiar campos soft
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
    const cant  = list.reduce((a, b) => a + b.cantidad, 0);
    const total = list.reduce((a, b) => a + b.subtotal, 0);
    return { cant, total };
  }, [items]);

  const subProductos = useMemo(() => {
    const list   = items.filter((i) => i.tipo === "Productos");
    const cantKg = list.reduce((a, b) => a + b.cantidad, 0);
    const total  = list.reduce((a, b) => a + b.subtotal, 0);
    return { cantKg, total };
  }, [items]);

  const totalCompra = useMemo(() => items.reduce((a, b) => a + b.subtotal, 0), [items]);

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
    // TODO: integrar con API
    console.log("Guardar compra:", { proveedor, fecha, items });
    onCancelar();
  }

  // Handlers del modal “Nuevo producto”
  function handleCreateProductSubmit(values) {
    // TODO: enviar a API y si querés, auto-seleccionar
    // setProducto({ id: 'nuevo', nombre: values.referencia, tipo: values.tipo, medida: values.unidad, precioRef: toNumber(values.precio) })
    console.log("Crear producto", values);
    setNewProdOpen(false);
  }

  const addDisabled = !producto || toNumber(cantidad) <= 0 || toNumber(precioUnit) <= 0;

  return (
    <div className="p-6 md:p-8">
      <div className="rounded-2xl bg-white border border-emerald-100 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4">
          <h2 className="text-2xl font-bold text-emerald-900">Registrar Compra</h2>

          <IconButton
            title="Crear nuevo producto"
            variant="outline"
            className="rounded-full"
            onClick={() => setNewProdOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">Nuevo producto</span>
          </IconButton>
        </div>

        {/* Datos de la compra */}
        <div className="px-6 pb-4">
          <div className="mt-3 rounded-2xl border border-emerald-100 bg-white">
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
        </div>

        {/* Tabla Próximos a confirmar */}
        <div className="px-6">
          <p className="text-[12px] text-emerald-900 mb-1 ml-2">Próximos a confirmar</p>
          <div className="overflow-x-auto rounded-xl border border-emerald-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald-50/60 text-emerald-900">
                  <th className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium">Producto</th>
                  <th className="px-4 py-3 text-left font-medium">Medida/Estado</th>
                  <th className="px-4 py-3 text-left font-medium">Cant. (u/kg)</th>
                  <th className="px-4 py-3 text-left font-medium">Precio unit.</th>
                  <th className="px-4 py-3 text-left font-medium">Subtotal</th>
                  <th className="px-4 py-3 text-left font-medium">Observ.</th>
                  <th className="px-4 py-3 text-left font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((i) => (
                  <tr key={i.id} className="hover:bg-emerald-50/40">
                    <td className="px-4 py-3">{i.tipo}</td>
                    <td className="px-4 py-3 max-w-[280px] truncate">{i.producto}</td>
                    <td className="px-4 py-3">{i.medida}</td>
                    <td className="px-4 py-3">{fmtNum.format(i.cantidad)}</td>
                    <td className="px-4 py-3">{fmt.format(i.precioUnit)}</td>
                    <td className="px-4 py-3">{fmt.format(i.subtotal)}</td>
                    <td className="px-4 py-3">{i.obs}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ActionButton
                          type="edit"
                          text="MODIFICAR"
                          onClick={() => { /* podés abrir un modal de edición por ítem si lo necesitás */ }}
                        />
                        <ActionButton
                          type="delete"
                          text="ANULAR"
                          onClick={() => eliminarItem(i.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No hay ítems añadidos aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Subtotales */}
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

          {/* Footer botones */}
          <div className="flex justify-center gap-4 my-6">
            <IconButton title="Cancelar" variant="outline" onClick={onCancelar} label="CANCELAR" />
            <PrimaryButton onClick={onGuardar} className="rounded-full" text="GUARDAR" />
          </div>
        </div>
      </div>

      {/* === MODAL: Nuevo producto (usa ProductFormTabs) === */}
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
          onSubmit={handleCreateProductSubmit}
          onCancel={() => setNewProdOpen(false)}
        />
      </Modal>
    </div>
  );
}
