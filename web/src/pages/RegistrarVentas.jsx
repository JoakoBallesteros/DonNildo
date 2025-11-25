import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import PageContainer from "../components/pages/PageContainer";
import FormBuilder from "../components/forms/FormBuilder";
import DataTable from "../components/tables/DataTable";
import Modified from "../components/modals/Modified.jsx";
import Modal from "../components/modals/Modals.jsx";
import api from "../lib/apiClient";
import ProductFormTabs from "../components/forms/ProductFormTabs";
import ProductoSelect from "../components/ui/ProductoSelect";

// ======================================================================
// HELPERS & PERSISTENCE KEY (Movidos fuera del componente)
// ======================================================================
// === STORAGE SOLO PARA NUEVA VENTA ===
const NEW_SALE_KEY = "dn_new_sale_items";
const SESSION_KEY = "dn_pending_sale_items";

const calcSubtotal = (cantidad, precio, descuento) => {
  if (!cantidad || !precio) return 0;
  const c = Number(cantidad) || 0;
  const p = Number(precio) || 0;
  const d = Number(descuento) || 0;
  return +(c * p * (1 - d / 100)).toFixed(2);
};

// ======================================================================
// COMPONENTE PRINCIPAL
// ======================================================================

export default function RegistrarVentas() {
  const { id } = useParams();
  const isEditMode = Boolean(id); 
 // Estado inicial: usar storage SOLO si NO es edición
  const [ventas, setVentas] = useState(() => {
    if (isEditMode) return []; // evitar cargar borrador al editar
    const saved = sessionStorage.getItem(NEW_SALE_KEY);
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
  if (isEditMode) {
    sessionStorage.removeItem(NEW_SALE_KEY);
    setVentas([]); // se llenará luego con fetchVenta()
  }
}, [isEditMode]);
useEffect(() => {
  if (!isEditMode) {
    sessionStorage.setItem(NEW_SALE_KEY, JSON.stringify(ventas));
  }
}, [ventas, isEditMode]);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
  producto: "",
  tipo: "",
  cantidad: "",
  precio: "",
  descuento: "",
  subtotal: "",

});

  const [errors, setErrors] = useState({});
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [isEditOpen, setEditOpen] = useState(false);
  // const [isNewProductOpen, setNewProductOpen] = useState(false);  // Mantener para el botón
  const [isCancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  // === Modal crear nuevo producto (reutiliza ProductFormTabs)
  const [isNewOpen, setNewOpen] = useState(false);
  // Estados para Eliminación de Ítem (Borrador)
  const [isItemDeleteConfirmOpen, setItemDeleteConfirmOpen] = useState(false);
  const [itemToDeleteIndex, setItemToDeleteIndex] = useState(null);

  // Estados para Modal de Mensajes
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    title: "",
    text: "",
    type: "",
  });

  // =========================
  // EFECTOS
  // =========================

  //para modificar una venta existente
 useEffect(() => {
  if (!isEditMode) return;

  const fetchVenta = async () => {
    try {
      const res = await api(`/api/ventas/${id}`);

      // res.productos ES EL ARRAY
      const productosBackend = res.productos || [];
      const productos = productosBackend.map((r) => ({
        id_producto: r.id_producto,
        producto: r.producto,
        tipo: r.tipo_producto === "Caja" ? "Caja" : "Material",
        cantidad: r.cantidad,
        precio: r.precio,
        descuento: r.descuento || 0,
        subtotal: r.subtotal,
        medida: r.medida || "u",
      }));

      setVentas(productos);

      // 💡 Al editar, carga también la observación general de la venta
      // (res.venta.observaciones) en el formulario
      setFormData((prev) => ({
        ...prev,
        observaciones: res.venta?.observaciones || "",
      }));
    } catch (err) {
      console.error("Error cargando venta:", err);
      setMessageModal({
        isOpen: true,
        title: "Error",
        text: "No se pudo obtener la venta.",
        type: "error",
      });
    }
  };

  fetchVenta();
}, [isEditMode, id]);
  // 2. Guardar 'ventas' cada vez que cambian (Efecto de escritura en Session Storage)
  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(ventas));
  }, [ventas]);

  // Carga de productos disponibles (llama a la API de Express)
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const data = await api("/v1/productos");
        const rawProductos = data.productos || [];

        // Filtrar solo productos con estado "true" en la tabla
        const activos = rawProductos.filter((p) =>
          p?.estado === true || p?.estado === 1 || p?.estado === "1" || p?.estado === "true"
        );

        const items = activos.map((p) => ({
          id_producto: p.id_producto,
          nombre: p.nombre,
          precio: Number(p.precio_unitario) || 0,
          tipoVenta: p.id_tipo_producto === 1 ? "Caja" : "Material",
        }));

        setProductosDisponibles(items);
      } catch (err) {
        console.error("Error cargando productos desde la API:", err.message);
      }
    };
    fetchProductos();
  }, []);

  // =========================
  // HANDLERS DE FORMULARIO
  // =========================

 const handleChange = (name, value) => {
  if (["cantidad", "precio", "descuento"].includes(name)) {
    const n = Number(value);
    if (isNaN(n) || n < 0) return;
  }

  if (name === "producto") {
    const prod = productosDisponibles.find((p) => p.nombre === value);
    if (!prod) return;

    setFormData((prev) => ({
      ...prev,
      producto: value,
      tipo: prod.tipoVenta === "Caja" ? "Caja" : "Material",
      precio: prod.precio || "",
      subtotal: calcSubtotal(prev.cantidad, prod.precio, prev.descuento),
    }));
    return;
  }

  if (name === "cantidad" || name === "descuento") {
    const next = { ...formData, [name]: value };
    next.subtotal = calcSubtotal(next.cantidad, next.precio, next.descuento);
    setFormData(next);
    return;
  }

  // Si se edita el campo de observación general, solo actualizamos ese valor
  if (name === "observaciones") {
    setFormData((prev) => ({ ...prev, observaciones: value }));
    return;
  }

  setFormData((prev) => ({ ...prev, [name]: value }));
};
 const handleAgregarProducto = () => {
  if (!formData.producto || !formData.cantidad) {
    return setMessageModal({
      isOpen: true,
      title: "Aviso",
      text: "Completá producto y cantidad antes de añadir.",
      type: "error",
    });
  }

  const existingIndex = ventas.findIndex(
    (v) => v.id_producto ===
      productosDisponibles.find((p) => p.nombre === formData.producto)?.id_producto
  );

  const cantidad = Number(formData.cantidad);
  const precio = Number(formData.precio);
  const descuento = Number(formData.descuento || 0);
  const nuevoSubtotal = calcSubtotal(cantidad, precio, descuento);

  if (existingIndex !== -1) {
    setVentas((prev) =>
      prev.map((item, i) => {
        if (i === existingIndex) {
          const newCantidad = item.cantidad + cantidad;
          const newSubtotal = calcSubtotal(newCantidad, precio, item.descuento);
          return {
            ...item,
            cantidad: newCantidad,
            subtotal: newSubtotal,
          };
        }
        return item;
      })
    );
  } else {
    const item = {
      tipo: formData.tipo,
      producto: formData.producto,
      id_producto:
        productosDisponibles.find((p) => p.nombre === formData.producto)?.id_producto || null,
      cantidad: cantidad,
      precio: precio,
      descuento: descuento,
      subtotal: nuevoSubtotal,
      // ← Ya no guardamos observaciones aquí
    };

    setVentas((prev) => [...prev, item]);
  }

    // Reset form
    setFormData({
    producto: "",
    tipo: "",
    cantidad: "",
    precio: "",
    descuento: "",
    subtotal: "",
    observaciones: formData.observaciones, // ← se mantiene
  });
  setErrors({});
};


    const ventasConObservacion = ventas.map((item, idx) => ({
      ...item,
      observaciones: idx === 0 ? formData.observaciones || "" : "",
    }));



  const handleActualizarVenta = async () => {
  try {
    const res = await api(`/api/ventas/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productos: ventas,
        observaciones: formData.observaciones || null,
      }),
    });

    setMessageModal({
      isOpen: true,
      title: "Venta actualizada",
      text: res.message || "Cambios guardados correctamente.",
      type: "success",
    });
  } catch (err) {
    console.error(err);
    setMessageModal({
      isOpen: true,
      title: "Error",
      text: "No se pudo actualizar la venta.",
      type: "error",
    });
  }
};
  // =========================
  // MODALES Y ACCIONES
  // =========================

  // Handlers para ELIMINAR ITEM (Borrador)
  const handleOpenItemDelete = (index) => {
    setItemToDeleteIndex(index);
    setItemDeleteConfirmOpen(true);
  };

  const handleConfirmItemDelete = () => {
    setVentas((prev) => prev.filter((_, idx) => idx !== itemToDeleteIndex));
    setItemDeleteConfirmOpen(false);
    setItemToDeleteIndex(null);
  };

  // Modificar item (Revertido a la lógica original)
  const handleEditar = (venta, index) => {
    setSelectedVenta({ productos: [{ ...venta }], index });
    setEditOpen(true);
  };

  const handleGuardarCambios = (updated) => {
    const edited = updated?.productos?.[0];
    if (!edited) {
      setEditOpen(false);
      return;
    }

    const subtotal = calcSubtotal(
      edited.cantidad,
      edited.precio,
      edited.descuento
    );
    edited.subtotal = subtotal;

    setVentas((prev) =>
      prev.map((v, i) => (i === selectedVenta.index ? edited : v))
    );
    setEditOpen(false);
    setSelectedVenta(null);
  };

  // Handlers para CANCELAR (Confirma pérdida de borrador)
  const handleCancelClick = () => {
    if (ventas.length > 0) {
      setCancelConfirmOpen(true);
    } else {
      navigate("/ventas");
    }
  };

  const handleCancelConfirm = () => {
    sessionStorage.removeItem(SESSION_KEY); // <-- Limpiar storage
    setVentas([]);
    setCancelConfirmOpen(false);
    navigate("/ventas");
  };

  // Logica de GUARDAR VENTA (Transaccional)
 const handleGuardarVenta = async () => {
    try {
      if (ventas.length === 0) {
        return setMessageModal({
          isOpen: true,
          title: "Aviso",
          text: "No hay productos cargados en la venta.",
          type: "error",
        });
      }

      const response = await api("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 💡 CORRECCIÓN AQUÍ: Enviamos también las observaciones
        body: JSON.stringify({ 
            ventas: ventas, 
            observaciones: formData.observaciones 
        }),
      });

      if (response.success) {
        setMessageModal({
          isOpen: true,
          title: "✅ ¡Venta Registrada!",
          text: `La Venta N° ${response.id_venta} ha sido registrada correctamente y el stock actualizado.`,
          type: "success",
        });
        sessionStorage.removeItem(SESSION_KEY); 
        setVentas([])
        setFormData(prev => ({ ...prev, observaciones: "" }))
      }
    } catch (err) {
      console.error("Error al guardar venta:", err.message);

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

  // =========================
  // TOTALES Y COLUMNAS
  // =========================
  const totalVenta = ventas.reduce(
    (acc, v) => acc + Number(v.subtotal || 0),
    0
  );
  const subtotalCajas = ventas
    .filter((v) => v.tipo === "Caja")
    .reduce((a, v) => a + Number(v.subtotal), 0);
  const subtotalProductos = ventas
    .filter((v) => v.tipo === "Material")
    .reduce((a, v) => a + Number(v.subtotal), 0);
  const cantidadCajas = ventas
    .filter((v) => v.tipo === "Caja")
    .reduce((a, v) => a + Number(v.cantidad), 0);
  const cantidadProductos = ventas
    .filter((v) => v.tipo === "Material")
    .reduce((a, v) => a + Number(v.cantidad), 0);

  const columns = [
    { id: "tipo", header: "Tipo", accessor: "tipo", align: "center" },
    { id: "producto", header: "Producto", accessor: "producto", align: "center" },
    {
      id: "cantidad",
      header: "Cantidad",
      accessor: "cantidad",
      align: "center",
    },
    {
      id: "subtotal",
      header: "Subtotal",
      align: "center",
      render: (row) => `$${Number(row.subtotal).toLocaleString("es-AR")}`,
    },
    {
      id: "observaciones",
      header: "Observ.Gral", // nuevo título
      accessor: "observaciones",
      align: "center",
      width: "200px",
      render: (row) => row.observaciones, // se renderiza la observación solo en la primera fila
    },
    {
      id: "acciones",
      header: "Acciones",
      align: "center",
      render: (row) => {
          const i = ventas.findIndex(v => v.id_producto === row.id_producto);
        return (
          <div className="flex justify-center items-start gap-2">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => handleEditar(row, i)}
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

  const handleNewProductSubmit = (values) => {
    // armamos un objeto compatible con productosDisponibles
    const nuevoProducto = {
      id_producto: Date.now(), // id temporal (solo frontend)
      nombre: values.referencia,
      precio: Number(values.precio || 0),
      tipoVenta: values.tipo === "Caja" ? "Caja" : "Material",
    };

    setProductosDisponibles((prev) => [...prev, nuevoProducto]);

    // feedback suave, sin navegar
    setMessageModal({
      isOpen: true,
      title: "Producto agregado",
      text: "El producto ya está disponible para seleccionarlo en esta venta.",
      type: "info", 
    });

    setNewOpen(false);
  };
  // =========================
  // RENDER PRINCIPAL
  // =========================
  return (
    <PageContainer title="Registrar Venta" extraHeight>
      <div className="flex flex-col h-full">
        <div className="flex-1 flex flex-col max-h-[62vh]">
          <div className="bg-[#f7fbf8] border border-[#e2ede8] rounded-2xl p-4 mb-4 flex-shrink-0">
            <h2 className="text-[#154734] text-base font-semibold mb-3">
              Datos de la venta
            </h2>

            <div className="grid grid-cols-[0.5fr_0.2fr] gap-4 mb-4 max-w-[700px]">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Producto</label>
                <ProductoSelect
                  productos={productosDisponibles}
                  value={
                    productosDisponibles.find((p) => p.nombre === formData.producto) || null
                  }
                  onChange={(p) => handleChange("producto", p?.nombre || "")}
                />
              </div>

              <div>
                <FormBuilder
                  fields={[
                    {
                      label: "Tipo de venta",
                      name: "tipo",
                      type: "text",
                      readOnly: true,
                      placeholder: "—",
                      inputClass: "bg-[#f2f2f2] text-center",
                    },
                  ]}
                  values={formData}
                  onChange={handleChange}
                  errors={errors}
                  columns={1}
                />
              </div>
            </div>

            {/* REVERTIDO: Bloque de botones con layout original */}
            <div className="grid grid-cols-6 gap-5 items-end">
              <FormBuilder
                fields={[
                  {
                    label: "Cant. (u/kg)",
                    name: "cantidad",
                    type: "number",
                    placeholder: "0",
                  },
                ]}
                values={formData}
                onChange={handleChange}
                errors={errors}
                columns={1}
              />

              <FormBuilder
                fields={[
                  {
                    label: "Subtotal",
                    name: "subtotal",
                    type: "number",
                    placeholder: "$",
                    readOnly: true,
                    inputClass: "bg-[#f2f2f2]",
                  },
                ]}
                values={formData}
                onChange={handleChange}
                errors={errors}
                columns={1}
              />

              <FormBuilder
                fields={[
                  {
                    label: "Descuento aplicado",
                    name: "descuento",
                    type: "number",
                    placeholder: "%",
                  },
                ]}
                values={formData}
                onChange={handleChange}
                errors={errors}
                columns={1}
              />
              <FormBuilder
                fields={[
                  {
                    label: "Observaciones generales",
                    name: "observaciones",
                    type: "text",
                    placeholder: "Opcional",
                  },
                ]}
                values={formData}
                onChange={handleChange}
                errors={errors}
                columns={1}
              />

              <button
                onClick={handleAgregarProducto}
                className="bg-[#154734] text-white px-4 py-2 rounded-md hover:bg-[#103a2b] transition w-full mb-0.2 ml-1.5"
              >
                + Añadir
              </button>

              <button
                type="button"
                onClick={() => setNewOpen(true)}
                className=" rounded-md border border-[#154734] text-[#154734] px-4 py-2 hover:bg-[#e8f4ef] transition w-full "
              >
                + Nuevo producto
              </button>
            </div>
          </div>

          <h3 className="text-[#154734] text-sm font-semibold mb-2">
            Productos registrados
          </h3>

         <div className="flex-1 min-h-[150px] rounded-t-xl border-t border-[#e3e9e5] overflow-y-auto">
           <DataTable columns={columns} data={ventasConObservacion} stickyHeader={true} cellClass="px-4 py-2" wrapperClass="h-full overflow-y-auto"  enablePagination={true}/>
          </div>

          {ventas.length > 0 && (
            <div className="flex justify-between items-center text-[#154734] text-sm mt-3 mb-1 flex-shrink-0">
              <div>
                Subtotales: Cajas: {cantidadCajas} u — $
                {subtotalCajas.toLocaleString("es-AR")}
                &nbsp;&nbsp;Materiales: {cantidadProductos} kg — $
                {subtotalProductos.toLocaleString("es-AR")}
              </div>
              <p className="text-[#154734] font-semibold border border-[#e2ede8] bg-[#e8f4ef] px-3 py-1 rounded-md">
                Total venta:&nbsp;
                <span className="font-bold">
                  ${totalVenta.toLocaleString("es-AR")}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* BOTONES FINALES */}
        <div className="flex flex-wrap justify-center gap-3 mt-4 pb-2">
          <button
            onClick={handleCancelClick}
            className="border border-[#154734] text-[#154734] px-6 py-2 rounded-md hover:bg-[#f0f7f3] transition"
          >
            CANCELAR
          </button>

          <button
              onClick={isEditMode ? handleActualizarVenta : handleGuardarVenta}
            className="bg-[#154734] text-white px-6 py-2 rounded-lg hover:bg-[#103a2b] transition w-full sm:w-auto"
          >
            {isEditMode ? "ACTUALIZAR VENTA" : "GUARDAR"}
          </button>
        </div>

        {/* ======================= MODALES DE LA PÁGINA ======================= */}

        {/* 1. MODAL DE ELIMINACIÓN DE ÍTEM (BORRADOR) */}
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

        {/* 2. MODAL DE CONFIRMACIÓN DE CANCELAR (Pérdida de datos) */}
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
            ¿Estás seguro de que quieres cancelar el registro de esta venta? Se
            perderán todos los productos cargados.
          </p>
        </Modal>

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
              observaciones: "",
            }}
            labels={{ caja: "Caja", material: "Material" }}
            onCancel={() => setNewOpen(false)}
            onSubmit={handleNewProductSubmit}
          />
        </Modal>

        {/* 3. MODAL DE MENSAJES (Éxito/Error/Aviso) */}
        <Modal
          isOpen={messageModal.isOpen}
          onClose={() => {
            setMessageModal({ isOpen: false, title: "", text: "", type: "" });
            if (messageModal.type === "success") {
              navigate("/ventas");
            }
          }}
          title={messageModal.title}
          size="max-w-md"
          footer={
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setMessageModal({
                    isOpen: false,
                    title: "",
                    text: "",
                    type: "",
                  });
                  if (messageModal.type === "success") navigate("/ventas");
                }}
                className={`px-4 py-2 rounded-md font-semibold text-white transition ${
                  messageModal.type === "success"
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

        {/* 4. MODAL DE MODIFICACIÓN (REVERTIDO A LA LÓGICA ORIGINAL) */}
        {selectedVenta && (
          <Modified
            isOpen={isEditOpen}
            onClose={() => setEditOpen(false)}
            title={`Modificando ${
              selectedVenta.productos?.[0]?.producto || ""
            }`}
            data={selectedVenta}
            itemsKey="productos"
            columns={[
              { key: "tipo", label: "Tipo", readOnly: true },
              { key: "producto", label: "Producto", readOnly: true },
              { key: "cantidad", label: "Cantidad", type: "number" },
              { key: "precio", label: "Precio Unitario", readOnly: true },
              { key: "descuento", label: "Descuento (%)", type: "number" },
              { key: "subtotal", label: "Subtotal", readOnly: true },
            
            ]}
            computeTotal={(rows) =>
              rows.reduce(
                (sum, r) =>
                  sum + calcSubtotal(r.cantidad, r.precio, r.descuento),
                0
              )
            }
            onSave={handleGuardarCambios}
          />
        )}
      </div>
    </PageContainer>
  );
}
