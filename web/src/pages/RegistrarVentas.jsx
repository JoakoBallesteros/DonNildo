import { useState, useEffect } from "react";
import PageContainer from "../components/pages/PageContainer";
import FormBuilder from "../components/forms/FormBuilder";
import DataTable from "../components/tables/DataTable";
import Modified from "../components/modals/modified";
import { supa } from "../lib/supabaseClient";

export default function RegistrarVentas() {
  const [formData, setFormData] = useState({
    producto: "",
    tipo: "",
    cantidad: "",
    precio: "",
    descuento: "",
    subtotal: "",
  });

  const [errors, setErrors] = useState({});
  const [ventas, setVentas] = useState([]);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [isEditOpen, setEditOpen] = useState(false);

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
        const { data, error } = await supa
          .from("productos")
          .select("id_producto, nombre, precio_unitario, id_tipo_producto");

        if (error) throw error;

        const items = data.map((p) => ({
          id_producto: p.id_producto,
          nombre: p.nombre,
          precio: Number(p.precio_unitario) || 0,
          tipoVenta: p.id_tipo_producto === 1 ? "Caja" : "Producto",
        }));

        setProductosDisponibles(items);
      } catch (err) {
        console.error("Error cargando productos:", err.message);
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
      alert("Completá producto y cantidad");
      return;
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

              <button className="flex-wrap border border-[#154734] text-[#154734] px-4 py-2 rounded-md hover:bg-[#e8f4ef] transition w-full ml-55">
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
          <button className="border border-[#154734] text-[#154734] px-6 py-2 rounded-md hover:bg-[#f0f7f3] transition">
            CANCELAR
          </button>

          <button
            onClick={async () => {
              try {
                if (ventas.length === 0) {
                  alert("⚠️ No hay productos cargados en la venta.");
                  return;
                }

                const tipoTx =
                  ventas.some((v) => v.tipo === "Caja") &&
                  ventas.some((v) => v.tipo === "Producto")
                    ? "Mixta"
                    : ventas.every((v) => v.tipo === "Caja")
                    ? "Caja"
                    : "Producto";

                const [{ data: est }, { data: tx }] = await Promise.all([
                  supa
                    .from("estado")
                    .select("id_estado")
                    .eq("nombre", "COMPLETADO")
                    .single(),
                  supa
                    .from("tipo_transaccion")
                    .select("id_tipo_transaccion")
                    .eq("nombre", tipoTx)
                    .single(),
                ]);

                const fechaActual = new Date()
                  .toISOString()
                  .split("T")[0];
                const total = ventas.reduce(
                  (acc, v) => acc + Number(v.subtotal || 0),
                  0
                );

                const { data: venta, error: ventaError } = await supa
                  .from("venta")
                  .insert([
                    {
                      fecha: fechaActual,
                      id_estado: est?.id_estado || null,
                      id_tipo_transaccion: tx?.id_tipo_transaccion || null,
                      total,
                    },
                  ])
                  .select()
                  .single();

                if (ventaError) throw ventaError;

                const registros = ventas.map((v) => ({
                  id_venta: venta.id_venta,
                  id_producto: v.id_producto,
                  cantidad: Number(v.cantidad),
                  precio_unitario: Number(v.precio),
                  subtotal: Number(v.subtotal),
                }));

                const { error: detError } = await supa
                  .from("detalle_venta")
                  .insert(registros);

                if (detError) throw detError;

                alert("✅ Venta registrada correctamente");
                setVentas([]);
              } catch (err) {
                console.error("Error al guardar venta:", err.message);
                alert("❌ Error al guardar la venta: " + err.message);
              }
            }}
            className="bg-[#154734] text-white px-6 py-2 rounded-lg hover:bg-[#103a2b] transition w-full sm:w-auto"
          >
            GUARDAR
          </button>
        </div>

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
