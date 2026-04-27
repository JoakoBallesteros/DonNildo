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
import ClienteSelect from "../components/ui/ClienteSelect";

const NEW_SALE_KEY = "dn_new_sale_items";
const SESSION_KEY = "dn_pending_sale_items";

const calcSubtotal = (cantidad, precio, descuento) => {
  if (!cantidad || !precio) return 0;
  const c = Number(cantidad) || 0;
  const p = Number(precio) || 0;
  const d = Number(descuento) || 0;
  return +(c * p * (1 - d / 100)).toFixed(2);
};

export default function RegistrarVentas() {
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [ventas, setVentas] = useState(() => {
    if (isEditMode) return [];
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
      setVentas([]);
    }
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode) {
      sessionStorage.setItem(NEW_SALE_KEY, JSON.stringify(ventas));
    }
  }, [ventas, isEditMode]);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    id_cliente: null,
    cliente_nombre: "",
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
  const [isCancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [isNewOpen, setNewOpen] = useState(false);
  const [isItemDeleteConfirmOpen, setItemDeleteConfirmOpen] = useState(false);
  const [itemToDeleteIndex, setItemToDeleteIndex] = useState(null);

  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    title: "",
    text: "",
    type: "",
  });


  useEffect(() => {
    if (!isEditMode) return;

    const fetchVenta = async () => {
      try {
        const res = await api(`/api/ventas/${id}`);

        const productosBackend = res.productos || [];
        const productos = productosBackend.map((r) => ({
          id_producto: r.id_producto,
          producto: r.producto,
          tipo: r.tipo_producto,
          cantidad: r.cantidad,
          precio: r.precio,
          descuento: r.descuento || 0,
          subtotal: r.subtotal,
          medida: r.medida || "u",
        }));

        setVentas(productos);
        setFormData((prev) => ({
          ...prev,
          observaciones: res.venta?.observaciones || "",
          id_cliente: res.venta?.id_cliente || null,
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


  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(ventas));
  }, [ventas]);


  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [clientesDisponibles, setClientesDisponibles] = useState([]);
  const [listasPrecios, setListasPrecios] = useState([]);
  const [dolarOficial, setDolarOficial] = useState(1);
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const data = await api("/v1/productos");
        const rawProductos = data.productos || [];

        const activos = rawProductos.filter(
          (p) =>
            p?.estado === true ||
            p?.estado === 1 ||
            p?.estado === "1" ||
            p?.estado === "true"
        );

        const items = activos.map((p) => ({
          id_producto: p.id_producto,
          nombre: p.nombre,
          precio: Number(p.precio_unitario) || 0,
          moneda: p.moneda || "ARS",
          tipoVenta: p.tipo_nombre || p.tipo_producto_nombre || "Desconocido",
        }));

        setProductosDisponibles(items);
      } catch (err) {
        console.error("Error cargando productos desde la API:", err.message);
      }
    };
    
    const fetchClientes = async () => {
      try {
        const data = await api("/api/v1/clientes/search");
        setClientesDisponibles(data.clientes || []);
      } catch (err) {
        console.error("Error cargando clientes:", err.message);
      }
    };
    
    const fetchPrecios = async () => {
      try {
        const respListas = await api("/api/v1/precios/listas");
        if (respListas?.ok) setListasPrecios(respListas.listas || []);
        
        const respDolar = await api("/api/v1/precios/dolar");
        if (respDolar?.ok && respDolar.dolares?.length > 0) {
           const oficial = respDolar.dolares.find(d => d.nombre === "Oficial") || respDolar.dolares[0];
           setDolarOficial(oficial.venta || 1);
        }
      } catch (err) {
        console.error("Error cargando precios:", err.message);
      }
    };
    
    fetchProductos();
    fetchClientes();
    fetchPrecios();
  }, []);

  const calcPrecioFinal = (prodOriginal, clienteId) => {
    if (!prodOriginal) return 0;
    
    let precio = prodOriginal.precio;
    
    // 1. Si el producto está en USD, pasarlo a ARS según cotización del día
    if (prodOriginal.moneda === 'USD') {
      precio = precio * dolarOficial;
    }
    
    // 2. Aplicar recargo/descuento de la lista de precios del cliente
    if (clienteId) {
      const cli = clientesDisponibles.find(c => c.id_cliente === clienteId);
      if (cli && cli.lista_precios_id) {
        const lista = listasPrecios.find(l => l.id_lista === cli.lista_precios_id);
        if (lista) {
          const variacion = 1 + (Number(lista.porcentaje_variacion) / 100);
          precio = precio * variacion;
        }
      }
    }
    
    return precio;
  };

  useEffect(() => {
    if (!productosDisponibles.length) return;
    
    setVentas(prev => {
      let changed = false;
      const next = prev.map(v => {
        const prodOriginal = productosDisponibles.find(p => p.id_producto === v.id_producto);
        if (!prodOriginal) return v;
        
        const nuevoPrecio = calcPrecioFinal(prodOriginal, formData.id_cliente);
        if (Math.abs(v.precio - nuevoPrecio) < 0.01) return v;
        
        changed = true;
        return {
          ...v,
          precio: nuevoPrecio,
          precio_unitario: nuevoPrecio,
          subtotal: calcSubtotal(v.cantidad, nuevoPrecio, v.descuento)
        };
      });
      return changed ? next : prev;
    });
    
    setFormData(prev => {
      if (!prev.producto) return prev;
      const prodOriginal = productosDisponibles.find(p => p.nombre === prev.producto);
      if (!prodOriginal) return prev;
      
      const nuevoPrecio = calcPrecioFinal(prodOriginal, prev.id_cliente);
      if (Math.abs(prev.precio - nuevoPrecio) < 0.01) return prev;
      
      return {
        ...prev,
        precio: nuevoPrecio,
        subtotal: calcSubtotal(prev.cantidad, nuevoPrecio, prev.descuento)
      };
    });
  }, [formData.id_cliente, productosDisponibles, listasPrecios, dolarOficial, clientesDisponibles]);


  const handleChange = (name, value) => {
    if (["cantidad", "precio", "descuento"].includes(name)) {
      const n = Number(value);
      if (isNaN(n) || n < 0) return;
    }

    if (name === "producto") {
      const prod = productosDisponibles.find((p) => p.nombre === value);
      if (!prod) return;

      const calcPrecio = calcPrecioFinal(prod, formData.id_cliente);

      setFormData((prev) => ({
        ...prev,
        producto: value,
        tipo: prod.tipoVenta,
        precio: calcPrecio || "",
        subtotal: calcSubtotal(prev.cantidad, calcPrecio, prev.descuento),
      }));
      return;
    }

    if (name === "cantidad" || name === "descuento") {
      const next = { ...formData, [name]: value };
      next.subtotal = calcSubtotal(next.cantidad, next.precio, next.descuento);
      setFormData(next);
      return;
    }

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
      (v) =>
        v.id_producto ===
        productosDisponibles.find((p) => p.nombre === formData.producto)
          ?.id_producto
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
            const newSubtotal = calcSubtotal(
              newCantidad,
              precio,
              item.descuento
            );
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
          productosDisponibles.find((p) => p.nombre === formData.producto)
            ?.id_producto || null,
        cantidad: cantidad,
        precio: precio,
        descuento: descuento,
        subtotal: nuevoSubtotal,
      };

      setVentas((prev) => [...prev, item]);
    }

    setFormData({
      producto: "",
      tipo: "",
      cantidad: "",
      precio: "",
      descuento: "",
      subtotal: "",
      observaciones: formData.observaciones,
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
          id_cliente: formData.id_cliente,
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

  const handleOpenItemDelete = (index) => {
    setItemToDeleteIndex(index);
    setItemDeleteConfirmOpen(true);
  };

  const handleConfirmItemDelete = () => {
    setVentas((prev) => prev.filter((_, idx) => idx !== itemToDeleteIndex));
    setItemDeleteConfirmOpen(false);
    setItemToDeleteIndex(null);
  };

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

  const handleCancelClick = () => {
    if (ventas.length > 0) {
      setCancelConfirmOpen(true);
    } else {
      navigate("/ventas");
    }
  };

  const handleCancelConfirm = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setVentas([]);
    setCancelConfirmOpen(false);
    navigate("/ventas");
  };

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
        body: JSON.stringify({
          ventas: ventas,
          observaciones: formData.observaciones,
          id_cliente: formData.id_cliente,
        }),
      });

      if (response.success) {
        setMessageModal({
          isOpen: true,
          title: " ¡Venta Registrada!",
          text: `La Venta N° ${response.id_venta} ha sido registrada correctamente y el stock actualizado.`,
          type: "success",
        });
        sessionStorage.removeItem(SESSION_KEY);
        setVentas([]);
        setFormData((prev) => ({ ...prev, observaciones: "" }));
      }
    } catch (err) {
      console.error("Error al guardar venta:", err.message);

      let friendlyMsg =
        "Error al comunicarse con el servidor. Intente más tarde.";
      let title = " Error al Guardar";

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
        title = " Stock Insuficiente";
      } else if (
        err.message.includes("NETWORK_FAILURE") ||
        err.message.includes("404")
      ) {
        friendlyMsg =
          "No se pudo conectar al sistema. Asegúrese de que el backend esté activo.";
        title = " Error de Conexión";
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
    {
      id: "producto",
      header: "Producto",
      accessor: "producto",
      align: "center",
    },
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
      header: "Observ.Gral",
      accessor: "observaciones",
      align: "center",
      width: "200px",
      render: (row) => row.observaciones,
    },
    {
      id: "acciones",
      header: "Acciones",
      align: "center",
      render: (row) => {
        const i = ventas.findIndex(
          (v) => v.id_producto === row.id_producto
        );
        return (
          <div className="min-w-[140px] flex flex-wrap justify-center items-center gap-2">
            <button
              onClick={() => handleEditar(row, i)}
              className="bg-[#0b1a38] text-white px-3 py-1 text-xs rounded-md hover:bg-[#173070]"
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
        );
      },
    },
  ];

  const handleNewProductSubmit = async (values) => {
    try {
      const row = await api("/api/stock/productos", {
        method: "POST",
        body: values,
      });

      const nuevoProducto = {
        id_producto: row.id_producto,
        nombre: row.referencia,
        precio: Number(row.precio) || 0,
        tipoVenta: row.tipo,
      };

      setProductosDisponibles((prev) => [...prev, nuevoProducto]);
      setNewOpen(false);

      setMessageModal({
        isOpen: true,
        title: " Producto creado",
        text: `El producto "${nuevoProducto.nombre}" fue creado correctamente.`,
        type: "success",
      });
    } catch (e) {
      console.error("Error al crear producto:", e);
      setMessageModal({
        isOpen: true,
        title: " Error al crear producto",
        text: e.message || "Error al crear producto",
        type: "error",
      });
    }
  };

  // =========================
  // RENDER PRINCIPAL
  // =========================
  return (
    <PageContainer title={isEditMode ? "Modificar Venta" : "Registrar Venta"} extraHeight>
      <div className="flex flex-col h-full">

        <div className="flex-1 flex flex-col">
          <div className="bg-[#f7fbf8] border border-[#e2ede8] rounded-2xl p-4 mb-4 flex-shrink-0">
            <h2 className="text-[#0b1a38] text-base font-semibold mb-3">
              Datos de la venta
            </h2>

            <div className="mb-4 max-w-[400px]">
              <label className="block text-sm text-slate-700 mb-1">
                Cliente (Opcional)
              </label>
              <div className="flex gap-2">
                <ClienteSelect
                  clientes={clientesDisponibles}
                  value={clientesDisponibles.find(c => c.id_cliente === formData.id_cliente) || null}
                  onChange={(c) => setFormData(prev => ({ ...prev, id_cliente: c?.id_cliente || null, cliente_nombre: c?.razon_social || "" }))}
                />
                {formData.id_cliente && (
                   <button 
                     onClick={() => setFormData(prev => ({...prev, id_cliente: null, cliente_nombre: ""}))}
                     className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 border border-red-200 bg-red-50 rounded"
                   >
                     Quitar
                   </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[0.5fr_0.2fr] gap-4 mb-4 max-w-[700px]">
              <div>
                <label className="block text-sm text-slate-700 mb-1">
                  Producto
                </label>
                <ProductoSelect
                  productos={productosDisponibles}
                  value={
                    productosDisponibles.find(
                      (p) => p.nombre === formData.producto
                    ) || null
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

            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 md:gap-5 items-end">
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
                    label: "Descuento",
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
              <div className="md:col-span-1">
                <FormBuilder
                  fields={[
                    {
                      label: "Observaciones",
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
              </div>

              <div className="flex flex-col md:flex-row gap-2 md:col-span-2">
                <button
                  onClick={handleAgregarProducto}
                  className="bg-[#0b1a38] text-white px-4 py-2 rounded-md hover:bg-[#102354] transition w-full"
                >
                  + Añadir
                </button>

                <button
                  type="button"
                  onClick={() => setNewOpen(true)}
                  className="rounded-md border border-[#0b1a38] text-[#0b1a38] px-4 py-2 hover:bg-[#f0f5ff] transition w-full"
                >
                  + Nuevo
                </button>
              </div>
            </div>
          </div>

          <h3 className="text-[#0b1a38] text-sm font-semibold mb-2">
            Productos registrados
          </h3>

          <div className="flex-1 min-h-[150px] rounded-t-xl border-t border-[#dce8fd]">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <DataTable
                columns={columns}
                data={ventasConObservacion}
                stickyHeader={true}
                cellClass="px-4 py-2"
                wrapperClass="hp-table-wrapper overflow-y-auto"
                enablePagination={true}
              />
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-3 mt-2">
              {ventasConObservacion.length === 0 && (
                <p className="text-center text-gray-500 py-4 text-sm">No hay productos agregados.</p>
              )}
              {ventasConObservacion.map((row) => {
                const i = ventas.findIndex((v) => v.id_producto === row.id_producto);
                return (
                  <div key={i} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-[#0b1a38]">{row.producto}</p>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{row.tipo}</span>
                      </div>
                      <p className="font-bold text-[#0b1a38] text-lg">
                        ${Number(row.subtotal).toLocaleString("es-AR")}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-2">
                      <div>Cant: <span className="font-semibold">{row.cantidad}</span></div>
                      {/* <div>Desc: {row.descuento}%</div> */}
                    </div>
                    {row.observaciones && (
                      <p className="text-xs text-gray-500 italic mb-2 border-t pt-1">{row.observaciones}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleEditar(row, i)}
                        className="flex-1 bg-[#0b1a38] text-white text-xs py-2 rounded hover:bg-[#173070]"
                      >
                        MODIFICAR
                      </button>
                      <button
                        onClick={() => handleOpenItemDelete(i)}
                        className="flex-1 bg-[#A30000] text-white text-xs py-2 rounded hover:bg-[#7A0000]"
                      >
                        ELIMINAR
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {ventas.length > 0 && (
            <div className="flex flex-col md:flex-row justify-between items-center text-[#0b1a38] text-sm mt-3 mb-1 flex-shrink-0 gap-2">
              <div className="text-center md:text-left">
                Subtotales: Cajas: {cantidadCajas} u — ${subtotalCajas.toLocaleString("es-AR")}
                <br className="md:hidden" />
                &nbsp;&nbsp;Materiales: {cantidadProductos} kg — ${subtotalProductos.toLocaleString("es-AR")}
              </div>
              <p className="text-[#0b1a38] font-semibold border border-[#e2ede8] bg-[#f0f5ff] px-3 py-1 rounded-md w-full md:w-auto text-center">
                Total venta:&nbsp;
                <span className="font-bold">
                  ${totalVenta.toLocaleString("es-AR")}
                </span>
              </p>
            </div>
          )}
        </div>


        <div className="flex flex-wrap justify-center gap-3 mt-4 pb-2">
          <button
            onClick={handleCancelClick}
            className="border border-[#0b1a38] text-[#0b1a38] px-6 py-2 rounded-md hover:bg-[#f0f7f3] transition w-full sm:w-auto"
          >
            CANCELAR
          </button>

          <button
            onClick={isEditMode ? handleActualizarVenta : handleGuardarVenta}
            className="bg-[#0b1a38] text-white px-6 py-2 rounded-lg hover:bg-[#102354] transition w-full sm:w-auto"
          >
            {isEditMode ? "ACTUALIZAR VENTA" : "GUARDAR"}
          </button>
        </div>



        <Modal
          isOpen={isItemDeleteConfirmOpen}
          onClose={() => setItemDeleteConfirmOpen(false)}
          title="Confirmar Eliminación"
          size="max-w-xs"
          footer={
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setItemDeleteConfirmOpen(false)}
                className="rounded-md border border-[#0b1a38] text-[#0b1a38] px-4 py-2 hover:bg-[#f0f5ff]"
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
            labels={{ caja: "Caja", material: "Material" }}
            onCancel={() => setNewOpen(false)}
            onSubmit={handleNewProductSubmit}
          />
        </Modal>

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
                className={`px-4 py-2 rounded-md font-semibold text-white transition ${messageModal.type === "success"
                    ? "bg-[#1e408f] hover:bg-[#102354]"
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

        {selectedVenta && (
          <Modified
            isOpen={isEditOpen}
            onClose={() => setEditOpen(false)}
            title={`Modificando ${selectedVenta.productos?.[0]?.producto || ""
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
