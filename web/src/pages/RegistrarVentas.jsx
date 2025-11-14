import { useState, useEffect, useCallback } from "react";
import PageContainer from "../components/pages/PageContainer";
import FormBuilder from "../components/forms/FormBuilder";
import DataTable from "../components/tables/DataTable";
import Modified from "../components/modals/Modified.jsx";
import { supa } from "../lib/supabaseClient";
import ProductFormTabs from "../components/forms/ProductFormTabs.jsx";
import Modal from "../components/modals/Modals.jsx";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function RegistrarVentas() {
  const [formData, setFormData] = useState({
    producto: "",
    tipo: "",
    cantidad: "",
    precio: "",
    descuento: "",
    subtotal: "",
  });
  const navigate = useNavigate(); // 💡 Para redireccionar

  const [errors, setErrors] = useState({});
  const [ventas, setVentas] = useState([]);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isNewProductOpen, setNewProductOpen] = useState(false);
  const [isCancelConfirmOpen, setCancelConfirmOpen] = useState(false); // 💡 Para modal de cancelar

  // 💡 Para modales de éxito/error
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    title: "",
    text: "",
    type: "",
  });

  // =============== HELPERS ===============
  const calcSubtotal = (cantidad, precio, descuento) => {
    if (!cantidad || !precio) return 0;
    const c = Number(cantidad) || 0;
    const p = Number(precio) || 0;
    const d = Number(descuento) || 0;
    return +(c * p * (1 - d / 100)).toFixed(2);
  };

  const validarFormulario = () => {
    const nuevos = {};
    if (!formData.producto) nuevos.producto = "Seleccioná un producto";
    if (!formData.tipo) nuevos.tipo = "Falta tipo de venta";
    if (!formData.cantidad || Number(formData.cantidad) <= 0)
      nuevos.cantidad = "Ingresá una cantidad válida";
    if (!formData.precio || Number(formData.precio) <= 0)
      nuevos.precio = "Falta precio unitario";
    if (Number(formData.descuento) < 0 || Number(formData.descuento) > 100)
      nuevos.descuento = "0% a 100%";
    setErrors(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  // =============== PRODUCTOS ===============
  const [productosDisponibles, setProductosDisponibles] = useState([]);

 useEffect(() => {
  const fetchProductos = async () => {
    try {
      // 💡 1. LLAMADA AL BACKEND: Usa tu helper 'api' que va a Express (vía proxy: /v1)
      const data = await api("/v1/productos");
      const rawProductos = data.productos || [];

      // 💡 2. Mapeo en el Frontend (mantenemos el mapeo simple aquí, ya que el back da los datos)
      const items = rawProductos.map((p) => ({
        id_producto: p.id_producto,
        nombre: p.nombre,
        precio: Number(p.precio_unitario) || 0,
        // Asumiendo que el id_tipo_producto=1 es 'Caja' y el resto 'Producto'
        tipoVenta: p.id_tipo_producto === 1 ? "Caja" : "Producto", 
      }));

      setProductosDisponibles(items);
    } catch (err) {
      console.error("Error cargando productos desde la API:", err.message);
    }
  };
  fetchProductos();
}, []);

  // =============== FORM HANDLERS ===============
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
        tipo: prod.tipoVenta,
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

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAgregarProducto = () => {
    if (!formData.producto || !formData.cantidad) {
      // 💡 REEMPLAZO 1: Usar modal en lugar de alert()
      return setMessageModal({
        isOpen: true,
        title: "Aviso",
        text: "Completá producto y cantidad antes de añadir.",
        type: "error",
      });
    }

    const item = {
      tipo: formData.tipo,
      producto: formData.producto,
      id_producto:
        productosDisponibles.find((p) => p.nombre === formData.producto)
          ?.id_producto || null,
      cantidad: Number(formData.cantidad),
      precio: Number(formData.precio),
      descuento: Number(formData.descuento || 0),
      subtotal: calcSubtotal(
        formData.cantidad,
        formData.precio,
        formData.descuento
      ),
    };

    setVentas((prev) => [...prev, item]);
    setFormData({
      producto: "",
      tipo: "",
      cantidad: "",
      precio: "",
      descuento: "",
      subtotal: "",
    });
    setErrors({});
  };

  // =============== EDITAR ITEM (MODAL) ===============
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

  // =============== TOTALES ===============
  const totalVenta = ventas.reduce(
    (acc, v) => acc + Number(v.subtotal || 0),
    0
  );
  const subtotalCajas = ventas
    .filter((v) => v.tipo === "Caja")
    .reduce((a, v) => a + Number(v.subtotal), 0);
  const subtotalProductos = ventas
    .filter((v) => v.tipo === "Producto")
    .reduce((a, v) => a + Number(v.subtotal), 0);
  const cantidadCajas = ventas
    .filter((v) => v.tipo === "Caja")
    .reduce((a, v) => a + Number(v.cantidad), 0);
  const cantidadProductos = ventas
    .filter((v) => v.tipo === "Producto")
    .reduce((a, v) => a + Number(v.cantidad), 0);
  
  // 💡 Lógica de Guardar Venta (POST)
  // 💡 Lógica de Guardar Venta (POST)
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
            body: JSON.stringify({ ventas }),
        });

        if (response.success) {
            setMessageModal({
                isOpen: true,
                title: "✅ ¡Venta Registrada!",
                text: `La Venta N° ${response.id_venta} ha sido registrada correctamente y el stock actualizado.`,
                type: "success",
            });
            setVentas([]);
        }
    } catch (err) {
        console.error("Error al guardar venta:", err.message);

        let friendlyMsg = "Error al comunicarse con el servidor. Intente más tarde.";
        let title = "❌ Error al Guardar";

        // Lógica para extraer el mensaje de STOCK_INSUFICIENTE de la respuesta de Express 500
        if (err.message.includes("STOCK_INSUFICIENTE")) {
            // Utilizamos una expresión regular para buscar el texto después de 'STOCK_INSUFICIENTE:'
            const match = err.message.match(/STOCK_INSUFICIENTE: (.*)/);
            
            if (match && match[1]) {
                friendlyMsg = "No se puede completar la operación. " + match[1].trim().replace(/\.$/, '');
            } else {
                friendlyMsg = "Stock insuficiente para uno o más productos. Por favor, verifique el inventario.";
            }
            title = "⚠️ Stock Insuficiente";

        } else if (err.message.includes("NETWORK_FAILURE") || err.message.includes("404")) {
            friendlyMsg = "No se pudo conectar al sistema. Asegúrese de que el backend esté activo.";
            title = "❌ Error de Conexión";
            
        } else if (err.message.includes("500")) {
             friendlyMsg = "Ocurrió un error inesperado en el servidor. Revise el log de Express.";
        }

        setMessageModal({
            isOpen: true,
            title: title,
            text: friendlyMsg,
            type: "error",
        });
    }
};

  const columns = [
    { id: "tipo", header: "Tipo", accessor: "tipo", align: "center" },
    { id: "producto", header: "Producto", accessor: "producto" },
    {
      id: "cantidad",
      header: "Cantidad",
      accessor: "cantidad",
      align: "center",
    },
    {
      id: "subtotal",
      header: "Subtotal",
      align: "right",
      render: (row) => `$${Number(row.subtotal).toLocaleString("es-AR")}`,
    },
    {
      id: "acciones",
      header: "Acciones",
      align: "center",
      render: (row) => {
        const i = ventas.indexOf(row);
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
                onClick={() =>
                  setVentas((prev) => prev.filter((_, idx) => idx !== i))
                }
                className="bg-[#A30000] text-white px-3 py-1 text-xs rounded-md hover:bg-[#7A0000]"
              >
                ANULAR
              </button>
            </div>
          </div>
        );
      },
    },
  ];

  // =============== RENDER ===============
  return (
    <PageContainer title="Registrar Venta">
      <div className="flex flex-col min-h-[calc(100dvh-230px)] max-h-[calc(100dvh-230px)] justify-between overflow-hidden">
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="bg-[#f7fbf8] border border-[#e2ede8] rounded-2xl p-4 mb-4 flex-shrink-0">
            <h2 className="text-[#154734] text-base font-semibold mb-3">
              Datos de la venta
            </h2>

            <div className="grid grid-cols-[0.5fr_0.2fr] gap-4 mb-4 max-w-[700px]">
              <div>
                <FormBuilder
                  fields={[
                    {
                      label: "Producto",
                      name: "producto",
                      type: "select",
                      options: productosDisponibles.map((p) => ({
                        label: p.nombre,
                        value: p.nombre,
                      })),
                      required: true,
                      placeholder: "Seleccionar...",
                    },
                  ]}
                  values={formData}
                  onChange={handleChange}
                  errors={errors}
                  columns={1}
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

              <button
                onClick={handleAgregarProducto}
                className="bg-[#154734] text-white px-4 py-2 rounded-md hover:bg-[#103a2b] transition w-full ml-56"
              >
                + Añadir
              </button>

              <button
                type="button"
                onClick={() => setNewProductOpen(true)}
                className="flex-wrap border border-[#154734] text-[#154734] px-4 py-2 rounded-md hover:bg-[#e8f4ef] transition w-full ml-55"
              >
                + Nuevo producto
              </button>
            </div>
          </div>

          <h3 className="text-[#154734] text-sm font-semibold mb-2">
            Productos registrados
          </h3>

          <div className="flex-1 min-h-[150px] rounded-t-xl border-t border-[#e3e9e5]">
            <DataTable columns={columns} data={ventas} />
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
            onClick={() => { // 💡 Lógica de cancelación con confirmación
              if (ventas.length > 0) {
                setCancelConfirmOpen(true);
              } else {
                navigate("/ventas");
              }
            }}
            className="border border-[#154734] text-[#154734] px-6 py-2 rounded-md hover:bg-[#f0f7f3] transition"
          >
            CANCELAR
          </button>

          <button
            onClick={handleGuardarVenta} // 💡 Usar la nueva función
            className="bg-[#154734] text-white px-6 py-2 rounded-lg hover:bg-[#103a2b] transition w-full sm:w-auto"
          >
            GUARDAR
          </button>
        </div>

        {/* 💡 MODAL DE MENSAJES (Éxito/Error/Aviso) */}
        <Modal
          isOpen={messageModal.isOpen}
          onClose={() => {
            setMessageModal({ isOpen: false, title: "", text: "", type: "" });
            // Si fue éxito, redirigimos al cerrar el modal de éxito
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

        {/* 💡 MODAL DE CONFIRMACIÓN DE CANCELAR */}
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
                onClick={() => {
                  setVentas([]);
                  setCancelConfirmOpen(false);
                  navigate("/ventas");
                }}
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
