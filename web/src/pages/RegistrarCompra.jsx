// src/pages/RegistrarCompra.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, ChevronDown, Calendar } from "lucide-react";
import api from "../lib/apiClient";

/* Layout & UI */
import PageContainer from "../components/pages/PageContainer.jsx";
import PrimaryButton from "../components/buttons/PrimaryButton.jsx";
import IconButton from "../components/buttons/IconButton.jsx";
import DataTable from "../components/tables/DataTable.jsx";

/* Formularios / Modales */
import ProductFormTabs from "../components/forms/ProductFormTabs.jsx";
import Modal from "../components/modals/Modals.jsx";
import Modified from "../components/modals/Modified.jsx";

/* ====== Helpers ====== */
const fmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});
const fmtNum = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const toNumber = (v) => {
  if (v == null) return 0;
  const s = String(v).trim();
  if (!s) return 0;

  // Caso formato latino: 1.234,56 → quitamos puntos y usamos coma como decimal
  if (s.includes(",") && !s.includes(".")) {
    const normalized = s.replace(/\./g, "").replace(",", ".");
    return Number(normalized) || 0;
  }

  // Caso normal: 600 o 600.50 → dejamos el punto como decimal
  const normalized = s.replace(/[^0-9.]/g, "");
  return Number(normalized) || 0;
};

/* ====== Página ====== */
export default function RegistrarCompra() {
  // Catálogos desde la API
  const [productos, setProductos] = useState([]); // [{id, nombre, tipo, medida, precioRef}]
  const [proveedores, setProveedores] = useState([]); // [{id, nombre, cuit?}]

  // Form principal
  const [producto, setProducto] = useState(null);
  const [busquedaProd, setBusquedaProd] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [precioUnit, setPrecioUnit] = useState("");
  const [proveedor, setProveedor] = useState(""); // guarda el id del proveedor
  const [fecha, setFecha] = useState("");
  const [obs, setObs] = useState("");

  // Items agregados
  const [items, setItems] = useState([]);

  // Modales
  const [newProdOpen, setNewProdOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  // Focus
  const cantRef = useRef(null);

  // ==========================
  // Cargar catálogos desde BD
  // ==========================
  useEffect(() => {
    async function cargarCatalogos() {
      try {
        const [resProd, resProv] = await Promise.all([
          api("/api/compras/productos"),
          api("/api/compras/proveedores"),
        ]);

        // Productos
        if (resProd?.ok && Array.isArray(resProd.productos)) {
          const mappedProd = resProd.productos.map((p) => {
            // Intentamos mapear diferentes nombres de campos a la forma que usa la UI
            const id = p.id ?? p.id_producto;
            const nombre = p.nombre;
            const categoria = p.categoria ?? p.categoria_nombre;
            const tipoDb = p.tipo ?? p.tipo_nombre;

            // Tipo visual: "Cajas" o "Productos"
            const tipo =
              tipoDb ??
              (categoria === "Cajas" ? "Cajas" : "Productos");

            const medida =
              p.medida ??
              p.unidad_stock ??
              p.medida_simbolo ??
              "u";

            const precioRef = p.precioRef ?? p.precio_unitario ?? 0;

            return { id, nombre, tipo, medida, precioRef };
          });

          setProductos(mappedProd);
        }

        // Proveedores
        if (resProv?.ok && Array.isArray(resProv.proveedores)) {
          const mappedProv = resProv.proveedores.map((p) => ({
            id: p.id ?? p.id_proveedor,
            nombre: p.nombre,
            cuit: p.cuit,
          }));
          setProveedores(mappedProv);
        }
      } catch (err) {
        console.error("Error cargando catálogos de compras:", err);
      }
    }

    cargarCatalogos();
  }, []);

  const subtotalCalc = useMemo(() => {
    const q = toNumber(cantidad);
    const p = toNumber(precioUnit);
    return q && p ? q * p : 0;
  }, [cantidad, precioUnit]);

  const productosFiltrados = useMemo(() => {
    const q = busquedaProd.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter((p) => p.nombre.toLowerCase().includes(q));
  }, [busquedaProd, productos]);

  const proveedorNombre = useMemo(
    () =>
      proveedores.find((p) => String(p.id) === String(proveedor))?.nombre ||
      "",
    [proveedor, proveedores]
  );

  function onSelectProducto(p) {
    setProducto(p);
    setBusquedaProd(p.nombre);
    if (!precioUnit) setPrecioUnit(String(p.precioRef ?? p.precio_unitario ?? ""));
    setTimeout(() => cantRef.current?.focus(), 0);
  }

  function addItem() {
  if (!producto) return;
  const cant = toNumber(cantidad);
  const pu = toNumber(precioUnit);
  if (cant <= 0 || pu <= 0) return;

  const nuevo = {
    id: crypto.randomUUID(),
    tipo: producto.tipo,
    producto: producto.nombre,
    medida: producto.medida,
    cantidad: cant,
    precioUnit: pu,
    subtotal: cant * pu,
    // si querés, que el ítem no dependa de este campo:
    obs: obs?.trim() || "—",
    proveedor: proveedor || "",
    fecha: fecha || "",
    prodId: producto.id,
  };
  setItems((prev) => [...prev, nuevo]);

  // limpiar campos de la línea, PERO NO las observaciones de la compra
  setCantidad("");
  setPrecioUnit("");
  // setObs("");          ❌  sacamos esto
  setBusquedaProd("");
  setProducto(null);
}

  function eliminarItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  // Subtotales por tipo
  const subCajas = useMemo(() => {
    const list = items.filter((i) => i.tipo === "Cajas");
    const cant = list.reduce((a, b) => a + (Number(b.cantidad) || 0), 0);
    const total = list.reduce((a, b) => a + (Number(b.subtotal) || 0), 0);
    return { cant, total };
  }, [items]);

  const subProductos = useMemo(() => {
    const list = items.filter((i) => i.tipo === "Productos");
    const cantKg = list.reduce((a, b) => a + (Number(b.cantidad) || 0), 0);
    const total = list.reduce((a, b) => a + (Number(b.subtotal) || 0), 0);
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
    if (items.length === 0) return;
    setConfirmOpen(true);
  }

  // 👉 POST al backend
  async function onConfirmarGuardar() {
    try {
      const payload = {
        id_proveedor: proveedor ? Number(proveedor) : null,
        fecha: fecha || null,
        observaciones: obs || null,
        items: items.map((it) => ({
          id_producto: it.prodId,
          cantidad: it.cantidad,
          precio_unitario: it.precioUnit,
        })),
      };

      const resp = await api("/api/compras", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      console.log("Compra registrada:", resp);

      setConfirmOpen(false);
      onCancelar();
    } catch (error) {
      console.error("Error al registrar la compra:", error);
      alert(
        "No se pudo registrar la compra. Revisá la consola del navegador para más detalles."
      );
    }
  }

  // ===== Edición de un ítem con Modified (adapter precioUnit <-> precio) =====
  const editColumns = [
    { key: "tipo", label: "Tipo" },
    {
      key: "producto",
      label: "Producto / Material",
      width: "220px",
      type: "text",
    },
    {
      key: "cantidad",
      label: "Cantidad",
      width: "120px",
      type: "number",
    },
    { key: "medida", label: "Medida", width: "120px", type: "text" },
    {
      key: "precio",
      label: "Precio unit.",
      width: "140px",
      type: "number",
    }, // usa "precio" para recalcular
    { key: "subtotal", label: "Subtotal", width: "140px", readOnly: true },
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

  const addDisabled =
    !producto || toNumber(cantidad) <= 0 || toNumber(precioUnit) <= 0;

  // Atajos: Esc = cancelar, Ctrl/Cmd+Enter = guardar
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onCancelar();
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "enter" &&
        items.length > 0
      ) {
        onGuardar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length]);

  /* ====== DataTable: Próximos a confirmar ====== */
  const columns = [
    {
      id: "tipo",
      header: "Tipo",
      accessor: (r) => r.tipo,
      align: "center",
      width: "110px",
    },
    {
      id: "producto",
      header: "Producto",
      accessor: (r) => r.producto,
      align: "center",
    },
    {
      id: "medida",
      header: "Medida/Estado",
      accessor: (r) => r.medida,
      align: "center",
      width: "130px",
    },
    {
      id: "cantidad",
      header: "Cant. (u/kg)",
      render: (r) => fmtNum.format(r.cantidad),
      align: "center",
      width: "130px",
    },
    {
      id: "precioUnit",
      header: "Precio unit.",
      render: (r) => fmt.format(r.precioUnit),
      align: "center",
      width: "140px",
    },
    {
      id: "subtotal",
      header: "Subtotal",
      render: (r) => fmt.format(r.subtotal),
      align: "center",
      width: "140px",
    },
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
    <PageContainer title="Registrar Compra">
      {/* Datos de la compra */}
      <div className="rounded-2xl border border-[#d8e4df] bg-white">
        <div className="p-4 md:p-5">
          <p className="text-[13px] font-semibold text-[#154734] mb-3">
            Datos de la compra
          </p>

          {/* === Bloque de campos === */}
          <div className="grid grid-cols-1 gap-4">
            {/* Producto + Tipo */}
            <div className="grid grid-cols-[minmax(0,1.4fr)_220px] gap-3">
              <div className="relative">
                <label className="block text-sm text-[#154734] mb-1">
                  Producto
                </label>
                <div className="relative">
                  <input
                    value={busquedaProd}
                    onChange={(e) => {
                      setBusquedaProd(e.target.value);
                      setProducto(null);
                    }}
                    placeholder="Buscar o escribir"
                    className="h-9 w-full rounded-md border border-[#d8e4df] bg-white pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5A3E]"
                  />
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#154734] pointer-events-none" />
                </div>

                {/* Dropdown simple */}
                {busquedaProd && !producto && (
                  <div className="absolute z-10 mt-1 w-full rounded-md border border-[#d8e4df] bg-white shadow max-h-56 overflow-auto">
                    {productosFiltrados.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        Sin resultados
                      </div>
                    )}
                    {productosFiltrados.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onSelectProducto(p)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-[#e8f4ef]"
                      >
                        {p.nombre}{" "}
                        <span className="text-gray-500">
                          ({p.tipo} · {p.medida})
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-[#154734] mb-1">
                  Tipo
                </label>
                <div className="h-9 w-full rounded-md border border-[#d8e4df] bg-gray-50 text-sm px-3 flex items-center">
                  {producto ? producto.tipo : "—"}
                </div>
              </div>
            </div>

            {/* Cantidad / Precio / Subtotal */}
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3">
              <div>
                <label className="block text-sm text-[#154734] mb-1">
                  Cant. (u/kg)
                </label>
                <input
                  ref={cantRef}
                  inputMode="decimal"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="0"
                  className="h-9 w-full rounded-md border border-[#d8e4df] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5A3E]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#154734] mb-1">
                  Precio unit.
                </label>
                <input
                  inputMode="decimal"
                  value={precioUnit}
                  onChange={(e) => setPrecioUnit(e.target.value)}
                  placeholder="0,00"
                  className="h-9 w-full rounded-md border border-[#d8e4df] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5A3E]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#154734] mb-1">
                  Subtotal
                </label>
                <div className="h-9 w-full rounded-md border border-[#d8e4df] bg-gray-50 text-sm px-3 flex items-center">
                  {subtotalCalc ? fmt.format(subtotalCalc) : "—"}
                </div>
              </div>
            </div>

            {/* Proveedor / Fecha / Observaciones + Botones */}
            <div className="grid grid-cols-[minmax(0,1.4fr)_190px_minmax(0,1.4fr)_auto_auto] gap-3 items-end">
              <div className="relative">
                <label className="block text-sm text-[#154734] mb-1">
                  Proveedor (opcional)
                </label>
                <div className="relative">
                  <select
                    value={proveedor}
                    onChange={(e) => setProveedor(e.target.value)}
                    className="h-9 w-full rounded-md border border-[#d8e4df] bg-white pr-8 pl-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5A3E] appearance-none"
                  >
                    <option value="">Seleccione un proveedor</option>
                    {proveedores.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                  {/* Flecha personalizada (ocultamos la nativa con appearance-none) */}
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#154734]" />
                </div>
              </div>

              <div className="relative">
                <label className="block text-sm text-[#154734] mb-1">Fecha</label>
                <Calendar className="absolute left-3 top-9 h-4 w-4 text-[#154734]/40" />
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="h-9 w-full rounded-md border border-[#d8e4df] bg-white pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5A3E]"
                />
              </div>

              <div>
                <label className="block text-sm text-[#154734] mb-1">
                  Observaciones
                </label>
                <input
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  placeholder="Opcional"
                  className="h-9 w-full rounded-md border border-[#d8e4df] bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E5A3E]"
                />
              </div>

              <div className="flex justify-end">
                <PrimaryButton
                  onClick={addItem}
                  className={`h-9 rounded-full px-5 ${
                    addDisabled ? "opacity-60 pointer-events-none" : ""
                  }`}
                  text={
                    <span className="inline-flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Añadir
                    </span>
                  }
                />
              </div>

              <div className="flex justify-end">
                <IconButton
                  title="Crear nuevo producto"
                  variant="outline"
                  className="h-9 rounded-full px-4 flex items-center gap-2"
                  onClick={() => setNewProdOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-xs md:text-sm">Nuevo producto</span>
                </IconButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla Próximos a confirmar */}
      <div className="mt-4">
        <p className="text-[12px] text-[#154734] mb-1 ml-2">
          Próximos a confirmar
        </p>
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
          Productos: {fmtNum.format(subProductos.cantKg)} kg —{" "}
          {fmt.format(subProductos.total)}
        </div>
        <div className="ml-auto">
          <div className="rounded-xl border border-[#d8e4df] bg-white px-4 py-2 inline-flex items-center gap-3">
            <span className="text-[#154734] font-semibold">
              Total compra:
            </span>
            <span className="text-[#154734] font-bold">
              {fmt.format(totalCompra)}
            </span>
          </div>
        </div>
      </div>

      {/* === Footer acciones === */}
      <div className="flex justify-center gap-6 py-10">
        <button
          type="button"
          onClick={onCancelar}
          className="min-w-[160px] px-8 py-2.5 rounded-md border border-[#154734] text-[#154734] font-semibold hover:bg-[#e8f4ef] transition"
        >
          CANCELAR
        </button>

        <button
          type="button"
          onClick={onGuardar}
          disabled={items.length === 0}
          className={`min-w-[160px] px-8 py-2.5 rounded-md font-semibold text-white transition ${
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
            Va a registrar una compra de{" "}
            <strong>{fmt.format(totalCompra)}</strong>.
          </p>
          <ul className="list-disc pl-5 text-sm text-slate-700">
            <li>Proveedor: {proveedorNombre || "—"}</li>
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
