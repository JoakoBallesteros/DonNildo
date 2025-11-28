// src/pages/RegistrarCompra.jsx
import { useEffect, useMemo, useRef, useState,  } from "react";
import MessageModal from "../components/modals/MessageModal";
import { Plus, ChevronDown, Calendar } from "lucide-react";
import api from "../lib/apiClient";
import { useNavigate, useParams } from "react-router-dom";
/* Layout & UI */
import PageContainer from "../components/pages/PageContainer.jsx";
import PrimaryButton from "../components/buttons/PrimaryButton.jsx";
import IconButton from "../components/buttons/IconButton.jsx";
import DataTable from "../components/tables/DataTable.jsx";
/* Formularios / Modales */
import ProductFormTabs from "../components/forms/ProductFormTabs.jsx";
import Modal from "../components/modals/Modals.jsx";
import Modified from "../components/modals/Modified.jsx";
import ProductoSelect from "../components/ui/ProductoSelect";
import FormBuilder from "../components/forms/FormBuilder.jsx";
import SecondaryButton from "../components/buttons/SecondaryButton.jsx";


//Persistencia
const NEW_BUY_KEY = "dn_new_buy_items";
const SESSION_KEY = "dn_pending_buy_items";
/* ====== Helpers ====== */
const fmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
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
   const { id } = useParams();
  const isEditMode = Boolean(id); 



// 🔥 PUNTO 4 — CARGA DE DATOS EN MODO EDICIÓN
useEffect(() => {
  if (!isEditMode) return;

  async function cargarCompra() {
    try {
      const res = await api(`/api/compras/${id}`);

      if (!res.ok) {
        console.error("No se pudo cargar la compra");
        return;
      }

      const c = res.compra;

      // ============================
      // CABECERA
      // ============================
      setProveedor(c.id_proveedor ?? "");
      setFecha(
        c.fecha ? new Date(c.fecha).toISOString().slice(0, 10) : ""
      );
      setObs(c.observaciones ?? "");

      // ============================
      // ÍTEMS
      // ============================
      const adaptados = (res.items || []).map(it => ({
        id: crypto.randomUUID(),     // ID local interno
        prodId: it.id_producto,      // ID real para guardar
        producto: it.producto,       // nombre
        tipo: it.tipo,               // Caja / Material
        medida: it.medida || "u",
        cantidad: Number(it.cantidad),
        precioUnit: Number(it.precio_unitario),
        subtotal: Number(it.subtotal)
      }));

      setItems(adaptados);

    } catch (e) {
      console.error("Error cargando compra:", e);
    }
  }

  cargarCompra();
}, [id, isEditMode]);


  // Catálogos desde la API
  const [productos, setProductos] = useState([]); // [{id, nombre, tipo, medida, precioRef}]
  const [proveedores, setProveedores] = useState([]); // [{id, nombre, cuit?}]
  
  // Form principal
  const [producto, setProducto] = useState(null);

  const [cantidad, setCantidad] = useState("");
  const [precioUnit, setPrecioUnit] = useState("");
  const [proveedor, setProveedor] = useState(""); // guarda el id del proveedor
  const [fecha, setFecha] = useState("");
  const [obs, setObs] = useState("");

  // Items agregados
  const [items, setItems] = useState(() => {
    if (isEditMode) return [];

    const saved = sessionStorage.getItem(NEW_BUY_KEY);
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modales
  const [newProdOpen, setNewProdOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [isCancelConfirmOpen, setCancelConfirmOpen] = useState(false);
    // Estados para Eliminación de Ítem (Borrador)
    const [isItemDeleteConfirmOpen, setItemDeleteConfirmOpen] = useState(false);
   const [itemToDeleteIndex, setItemToDeleteIndex] = useState(null);
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    title: "",
    text: "",
    type: "",
  });

  // Focus
  const cantRef = useRef(null);
  useEffect(() => {
  if (!isEditMode) {
    sessionStorage.setItem(NEW_BUY_KEY, JSON.stringify(items));
  }
}, [items, isEditMode]);

useEffect(() => {
  if (isEditMode) {
    sessionStorage.removeItem(NEW_BUY_KEY);
    setItems([]);
  }
}, [isEditMode]);

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

 const navigate = useNavigate();

  const subtotalCalc = useMemo(() => {
    const q = toNumber(cantidad);
    const p = toNumber(precioUnit);
    return q && p ? q * p : 0;
  }, [cantidad, precioUnit]);

  function onSelectProducto(p) {
    setProducto(p);
    if (!precioUnit) setPrecioUnit(String(p.precioRef ?? p.precio_unitario ?? ""));
    setTimeout(() => cantRef.current?.focus(), 0);
  }

  function addItem() {
    if (!producto) return;

    const cant = toNumber(cantidad);
    const pu = toNumber(precioUnit);

    if (cant <= 0 || pu <= 0) return;

    const existingIndex = items.findIndex(
      (it) => it.prodId === producto.id
    );

    // Si el producto YA EXISTE → actualizar cantidad y subtotal
    if (existingIndex !== -1) {
      setItems((prev) =>
        prev.map((it, idx) => {
          if (idx === existingIndex) {
            const newCantidad = it.cantidad + cant;
            return {
              ...it,
              cantidad: newCantidad,
              subtotal: newCantidad * pu,
            };
          }
          return it;
        })
      );
    } else {
      // Si NO existe → agregar nuevo ítem
      const nuevo = {
        id: crypto.randomUUID(),
        tipo: producto.tipo,
        producto: producto.nombre,
        medida: producto.medida,
        cantidad: cant,
        precioUnit: pu,
        subtotal: cant * pu,
        proveedor: proveedor || "",
        fecha: fecha || "",
        prodId: producto.id,
      };

      setItems((prev) => [...prev, nuevo]);
    }

    // limpiar inputs (pero NO la observación general)
    setCantidad("");
    setPrecioUnit("");
    setProducto(null);
  }

  const totalCompra = useMemo(
    () => items.reduce((a, b) => a + (Number(b.subtotal) || 0), 0),
    [items]
  );

  //guardar

  // 👉 POST al backend
  const handleGuardarCompra = async () => {
 try {
       if (items.length === 0) {
         return setMessageModal({
           isOpen: true,
           title: "Aviso",
           text: "No hay productos cargados en la venta.",
           type: "error",
         });
       }
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
       const response = await api("/api/compras", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify(payload),
       });
 
       if (response.ok) {
         setMessageModal({
           isOpen: true,
           title: "✅ ¡Compra Registrada!",
           text: `La compra N° ${response.id_compra} ha sido registrada correctamente y el stock actualizado.`,
           type: "success",
         });
         sessionStorage.removeItem(NEW_BUY_KEY);
          sessionStorage.removeItem(SESSION_KEY);
         
          setItems([]);
          setObs("");
          setProveedor("");
          setFecha("");
         
       }
     } catch (err) {
       console.error("Error al guardar compra:", err.message);
 
       let friendlyMsg =
         "Error al comunicarse con el servidor. Intente más tarde.";
       let title = "❌ Error al Guardar";
 
       if (err.message.includes("STOCK_INSUFICIENTE")) {
         const match = err.message.match(/STOCK_INSUFICIENTE: (.*)/);
         if (match && match[1]) {
           friendlyMsg =
             "No se puede completar la operación. " +
             match[1].trim().replace(/\.$/, "");
         } else {
           friendlyMsg =
             "Stock insuficiente para uno o más productos. Por favor, verifique el inventario.";
         }
         title = "⚠️ Stock Insuficiente";
       } else if (
         err.message.includes("NETWORK_FAILURE") ||
         err.message.includes("404")
       ) {
         friendlyMsg =
           "No se pudo conectar al sistema. Asegúrese de que el backend esté activo.";
         title = "❌ Error de Conexión";
       } else if (err.message.includes("500")) {
         friendlyMsg =
           "Ocurrió un error inesperado en el servidor. Revise el log de Express.";
       }
 
       setMessageModal({
         isOpen: true,
         title: title,
         text: friendlyMsg,
         type: "error",
       });
     }
   };

   // Handlers para CANCELAR (Confirma pérdida de borrador)
      const handleCancelClick = () => {
        if (items.length > 0) {
          setCancelConfirmOpen(true);
        } else {
          navigate("/compras");
        }
      };

      const handleCancelConfirm = () => {
        sessionStorage.removeItem(NEW_BUY_KEY);
        sessionStorage.removeItem(SESSION_KEY); // <-- Limpiar storage
      
        setCancelConfirmOpen(false);
        navigate("/compras");
      };

        const itemsConObs = items.map((item, idx) => ({
      ...item,
      obs: idx === 0 ? obs || "" : "",
    }));
      const handleActualizarCompra = async () => {
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

    const response = await api(`/api/compras/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setMessageModal({
      isOpen: true,
      title: "Compra actualizada",
      text: `La compra N° ${response.id_compra} fue modificada correctamente.`,
      type: "success",
    });

  } catch (error) {
    console.error(error);
    setMessageModal({
      isOpen: true,
      title: "Error",
      text: "No se pudo actualizar la compra.",
      type: "error",
    });
  }
};




const handleNewProductSubmit = async (values) => {
  try {
    const row = await api("/api/stock/productos", {
      method: "POST",
      body: values,
    });

    const nuevoProducto = {
      id: row.id_producto,
      nombre: row.referencia,
      tipo: row.tipo,
      medida: row.medida || "u",
      precioRef: Number(row.precio) || 0,
    };

    setProductos((prev) => [...prev, nuevoProducto]);
    setNewProdOpen(false);

    setMessageModal({
      isOpen: true,
      title: "Producto creado",
      text: `El producto "${nuevoProducto.nombre}" fue agregado correctamente.`,
      type: "success",
    });
  } catch (e) {
    console.error(e);
    setMessageModal({
      isOpen: true,
      title: "Error",
      text: "No se pudo crear el producto.",
      type: "error",
    });
  }
};



  // ===== Edición de un ítem con Modified (adapter precioUnit <-> precio) =====
  const editColumns = [
    { key: "tipo", label: "Tipo", readOnly: true},
    {
      key: "producto",
      label: "Producto / Material",
      width: "220px",
      type: "text",
      readOnly: true
    },
    {
      key: "cantidad",
      label: "Cantidad",
      width: "120px",
      type: "number",
    },
    {
      key: "precio",
      label: "Precio unit.",
      width: "140px",
      type: "number",
      readOnly: true
    }, // usa "precio" para recalcular
    { key: "subtotal", label: "Subtotal", width: "140px", readOnly: true },
  ];


   const handleOpenItemDelete = (index) => {
    setItemToDeleteIndex(index);
    setItemDeleteConfirmOpen(true);
  };

   const handleConfirmItemDelete = () => {
    setItems((prev) => prev.filter((_, idx) => idx !== itemToDeleteIndex));
    setItemDeleteConfirmOpen(false);
    setItemToDeleteIndex(null);
  };

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


  const subtotalCajas = items
    .filter((v) => v.tipo === "Caja")
    .reduce((a, v) => a + Number(v.subtotal), 0);
  const subtotalProductos = items
    .filter((v) => v.tipo === "Material")
    .reduce((a, v) => a + Number(v.subtotal), 0);
  const cantidadCajas = items
    .filter((v) => v.tipo === "Caja")
    .reduce((a, v) => a + Number(v.cantidad), 0);
  const cantidadProductos = items
    .filter((v) => v.tipo === "Material")
    .reduce((a, v) => a + Number(v.cantidad), 0);

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
      id: "cantidad",
      header: "Cant. (u/kg)",
      render: (r) => Number(r.cantidad).toLocaleString("es-AR"),
      align: "center",
      width: "130px",
    },
    {
      id: "precioUnit",
      header: "Precio unit.",
      render: (r) => Number(r.precioUnit).toLocaleString("es-AR"),
      align: "center",
      width: "140px",
    },
    {
      id: "subtotal",
      header: "Subtotal",
      render: (r) => Number(r.subtotal).toLocaleString("es-AR"),
      align: "center",
      width: "140px",
    },
    { id: "obs", header: "Observ. Gral",   render: (row) => row.obs || "—", align: "center",},
    {
      id: "acciones",
      header: "Acciones",
      align: "center",
      width: "170px",
      render: (row) => {
          const i = items.findIndex(v => v.id_producto === row.id_producto);
        return (
          <div className="flex justify-center items-start gap-2">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => abrirEditar(row)}
                className="bg-[#154734] text-white px-3 py-1 text-xs rounded-md hover:bg-[#1E5A3E]"
              >
                MODIFICAR
              </button>
              <button
                onClick={() => handleOpenItemDelete(i)}
                className="bg-[#A30000] text-white px-3 py-1 text-xs rounded-md hover:bg-[#7A0000]"
              >
                ELIMINAR
              </button>
            </div>
          </div>
        );
      },
    },
  ];

  return (
    <PageContainer title="Registrar Compra">
      <div className="flex flex-col h-full">

        {/* === CARD DE DATOS === */}
        <div className="bg-[#f7fbf8] border border-[#e2ede8] rounded-2xl p-4 mb-4 flex-shrink-0">
          <h2 className="text-[#154734] text-base font-semibold mb-3">
            Datos de la compra
          </h2>

          {/* === FILA 1: Producto + Tipo === */}
          <div className="grid grid-cols-[0.5fr_0.2fr] gap-4 mb-4 max-w-[700px]">
            {/* Producto */}
            <div>
              <label className="block text-sm text-slate-700 mb-1">Producto</label>
              <ProductoSelect
                productos={productos.map((p) => ({
                  ...p,
                  id_producto: p.id
                }))}
                value={producto}
                onChange={(p) => {
                  onSelectProducto(p);
                  setTimeout(() => document.activeElement.blur(), 0);
                }}
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-sm text-slate-700 mb-1">Tipo</label>
              <div className="h-10 w-full rounded-xl border border-[#d8e4df] bg-gray-100 px-3 text-sm flex items-center">
                {producto ? producto.tipo : "—"}
              </div>
            </div>
          </div>

          {/* === FILA 2: Cantidad – Precio – Subtotal === */}
          <div className="grid grid-cols-3 gap-4 mb-3 max-w-[700px]">

            {/* Cantidad */}
            <FormBuilder
              columns={1}
              fields={[
                {
                  name: "cantidad",
                  label: "Cant. (u/kg)",
                  placeholder: "0"
                }
              ]}
              values={{ cantidad }}
              onChange={(name, v) => setCantidad(v)}
            />

            {/* Precio */}
            <FormBuilder
              columns={1}
              fields={[
                {
                  name: "precioUnit",
                  label: "Precio unit.",
                  placeholder: "0,00"
                }
              ]}
              values={{ precioUnit }}
              onChange={(name, v) => setPrecioUnit(v)}
            />

            {/* Subtotal */}
            <FormBuilder
              columns={1}
              fields={[
                {
                  name: "subtotal",
                  label: "Subtotal",
                  readOnly: true,
                  inputClass: "bg-[#f2f2f2]"
                }
              ]}
              values={{
                subtotal: subtotalCalc ? fmt.format(subtotalCalc) : "—"
              }}
              onChange={() => {}}
            />

          </div>

          {/* === FILA 3: Proveedor – Fecha – Observaciones – Botones === */}
          <div className="grid grid-cols-5 gap-5 items-end w-full">

            {/* Proveedor */}
            <FormBuilder
              columns={1}
              fields={[
                {
                  name: "proveedor",
                  type: "select",
                  label: "Proveedor (opcional)",
                  options: proveedores.map((p) => ({
                    value: p.id,
                    label: p.nombre
                  }))
                }
              ]}
              values={{ proveedor }}
              onChange={(name, v) => setProveedor(v)}
            />

            {/* Fecha */}
            <FormBuilder
              columns={1}
              fields={[
                {
                  name: "fecha",
                  type: "date",
                  label: "Fecha"
                }
              ]}
              values={{ fecha }}
              onChange={(name, v) => setFecha(v)}
            />

            {/* Observaciones */}
            <FormBuilder
              columns={1}
              fields={[
                {
                  name: "obs",
                  label: "Observaciones generales",
                  placeholder: "Opcional"
                }
              ]}
              values={{ obs }}
              onChange={(name, v) => setObs(v)}
            />
            
              {/* Botón Añadir */}
           <PrimaryButton
              onClick={addItem}
              className={`${addDisabled ? "opacity-60 pointer-events-none" : ""}`}
              text={
                <span className="inline-flex items-center gap-2 justify-center">
                  <Plus className="h-4 w-4" /> Añadir
                </span>
              }
            />

          <SecondaryButton
            onClick={() => setNewProdOpen(true)}
            text={
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" /> Nuevo producto
              </span>
            }
          />
          </div>
        </div>

        {/* === TABLA === */}
        <h3 className="text-[#154734] text-sm font-semibold mb-2">
          Próximos a confirmar
        </h3>

        <div className="flex-1 min-h-[150px] rounded-t-xl border-t border-[#e3e9e5]">
          <DataTable
            columns={columns}
            data={itemsConObs}
            rowKey={(row) => row.id}
            stickyHeader={true}
            wrapperClass="h-[250px]"
            cellClass="px-3 py-2"
          />
        </div>

        {/* === SUBTOTALES === */}
       {items.length > 0 && (
            <div className="flex justify-between items-center text-[#154734] text-sm mt-3 mb-1 flex-shrink-0">
              <div>
                Subtotales: Cajas: {cantidadCajas} u — $
                {subtotalCajas.toLocaleString("es-AR")}
                &nbsp;&nbsp;Materiales: {cantidadProductos} kg — $
                {subtotalProductos.toLocaleString("es-AR")}
              </div>
              <p className="text-[#154734] font-semibold border border-[#e2ede8] bg-[#e8f4ef] px-3 py-1 rounded-md">
                Total compra:&nbsp;
                <span className="font-bold">
                  ${totalCompra.toLocaleString("es-AR")}
                </span>
              </p>
            </div>
          )}

        {/* === BOTONES FINALES === */}
        <div className="flex justify-center gap-6 py-10">
          <button
            type="button"
            onClick={handleCancelClick}
            className="min-w-[160px] px-8 py-2.5 rounded-md border border-[#154734] text-[#154734] font-semibold hover:bg-[#e8f4ef] transition"
          >
            CANCELAR
          </button>

          <button
            type="button"
            onClick={isEditMode ? handleActualizarCompra : handleGuardarCompra}
            disabled={items.length === 0}
            className={`min-w-[160px] px-8 py-2.5 rounded-md font-semibold text-white transition ${
              items.length === 0
                ? "bg-[#154734]/50 cursor-not-allowed"
                : "bg-[#154734] hover:bg-[#103a2b]"
            }`}
          >
            {isEditMode ? "ACTUALIZAR COMPRA" : "GUARDAR"}
          </button>
        </div>

      {/* === MODALES (iguales a los tuyos, sin tocar nada) === */}
      {/** Mantengo todo igual aquí */}
      {newProdOpen && (
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
              notas: ""
            }}
            onSubmit={handleNewProductSubmit}
            onCancel={() => setNewProdOpen(false)}
          />
        </Modal>
      )}

      <Modal
        isOpen={isCancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        title="Confirmar Cancelación"
        size="max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setCancelConfirmOpen(false)}
              className="px-4 py-2 rounded-md font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              Volver
            </button>
            <button
              onClick={handleCancelConfirm}
              className="px-4 py-2 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 transition"
            >
              Sí, Cancelar
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-700">
          ¿Estás seguro de que quieres cancelar la compra? Se perderán todos los productos cargados.
        </p>
      </Modal>
          <Modal
            isOpen={isItemDeleteConfirmOpen}
            onClose={() => setItemDeleteConfirmOpen(false)}
            title="Confirmar Eliminación"
            size="max-w-xs"
            footer={
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setItemDeleteConfirmOpen(false)}
                  className="rounded-md border border-[#154734] text-[#154734] px-4 py-2 hover:bg-[#e8f4ef]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmItemDelete}
                  className="bg-[#A30000] text-white px-6 py-2 rounded-md hover:bg-[#7A0000]"
                >
                  Eliminar
                </button>
              </div>
            }
          >
            <p className="text-sm text-slate-700">
              ¿Estás seguro de eliminar este producto del borrador de la venta?
            </p>
          </Modal>
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

      <MessageModal
        isOpen={messageModal.isOpen}
        title={messageModal.title}
        text={messageModal.text}
        type={messageModal.type}
        onClose={() => {
          setMessageModal((prev) => ({ ...prev, isOpen: false }));
          if (messageModal.type === "success") navigate("/compras");
        }}
      />
    </div>
  </PageContainer>
);


}
