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
    fecha: "",
    cantidad: "",
    subtotal: "",
    descuento: "",
  });

  const [errors, setErrors] = useState({});
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
      useEffect(() => {
        const fetchVentas = async () => {
          try {
            const { data, error } = await supa
              .from("detalle_venta")
              .select(`*, productos(nombre)`)
             

            if (error) throw error;
            setVentas(data || []);
          } catch (err) {
            console.error("Error cargando ventas:", err.message);
          } finally {
            setLoading(false);
          }
        };

        fetchVentas();
      }, []);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [isEditOpen, setEditOpen] = useState(false);

  //Productos Disponibles
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  useEffect(() => {
  const fetchProductos = async () => {
    try {
      const { data, error } = await supa
        .from("productos")
        .select("id_producto, nombre, id_tipo_producto");

      if (error) throw error;

      // 💡 Si querés mostrar un tipo textual, podés mapearlo
      const productosFormateados = data.map((p) => ({
        nombre: p.nombre,
        tipoVenta:
          p.id_tipo_producto === 1
            ? "Caja"
            : p.id_tipo_producto === 2
            ? "Producto"
            : "Mixta",
      }));

      setProductosDisponibles(productosFormateados);
    } catch (err) {
      console.error("Error cargando productos:", err.message);
    }
  };

  fetchProductos();
}, []);

  const handleChange = (name, value) => {
     // 🚫 Evitar negativos
    if (["cantidad", "subtotal", "descuento"].includes(name)) {
      const num = Number(value);
      if (isNaN(num) || num < 0) return; // ignora valores negativos o no numéricos
    }

    if (name === "producto") {
      const prod = productosDisponibles.find((p) => p.nombre === value);
      setFormData((prev) => ({
        ...prev,
        producto: value,
        tipo: prod ? prod.tipoVenta : "—",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validarFormulario = () => {
    const nuevosErrores = {};
      if (!formData.producto) nuevosErrores.producto = "Seleccioná un producto";
      if (!formData.tipo) nuevosErrores.tipo = "Falta tipo de venta";
      if (!formData.cantidad || Number(formData.cantidad) <= 0) nuevosErrores.cantidad = "Ingresá una cantidad válida";
      if (Number(formData.subtotal) < 0) nuevosErrores.subtotal = "El subtotal no puede ser negativo";
      if (Number(formData.descuento) < 0 || Number(formData.descuento) > 100)
        nuevosErrores.descuento = "El descuento debe estar entre 0% y 100%";
      
      setErrors(nuevosErrores);
      return Object.keys(nuevosErrores).length === 0;
  };

  const calcularSubtotal = () => {
    const subtotal = Number(formData.subtotal) || 0;
    const descuento = Number(formData.descuento) || 0;
    return (subtotal * (1 - descuento / 100)).toFixed(2);
  };

  const handleAgregarProducto = () => {
    if (!validarFormulario()) return;
    const nuevoItem = { ...formData, subtotal: calcularSubtotal() };
    setVentas((prev) => [...prev, nuevoItem]);
    setFormData({ producto: "", tipo: "", fecha: "", cantidad: "", subtotal: "", descuento: "" });
  };

  // 👉 Abrir modal con el índice, y pasando { productos: [row] }
  const handleEditar = (venta, index) => {
    setSelectedVenta({ productos: [{ ...venta }], index });
    setEditOpen(true);
  };

  // 👉 Guardar: tomar updated.productos[0] y reemplazar por índice
  const handleGuardarCambios = (updated) => {
    const edited = updated?.productos?.[0];
    if (!edited) {
      setEditOpen(false);
      return;
    }
    setVentas((prev) =>
      prev.map((v, i) => (i === selectedVenta.index ? edited : v))
    );
    setEditOpen(false);
    setSelectedVenta(null);
  };

  const totalVenta = ventas.reduce((acc, v) => acc + Number(v.subtotal || 0), 0);
  const subtotalCajas = ventas.filter((v) => v.tipo === "Caja").reduce((acc, v) => acc + Number(v.subtotal), 0);
  const subtotalProductos = ventas.filter((v) => v.tipo === "Producto").reduce((acc, v) => acc + Number(v.subtotal), 0);
  const cantidadCajas = ventas.filter((v) => v.tipo === "Caja").reduce((acc, v) => acc + Number(v.cantidad), 0);
  const cantidadProductos = ventas.filter((v) => v.tipo === "Producto").reduce((acc, v) => acc + Number(v.cantidad), 0);

  const columns = [
    { id: "tipo", header: "Tipo", accessor: "tipo", align: "center" },
    { id: "producto", header: "Producto", accessor: "producto" },
    { id: "cantidad", header: "Cantidad", accessor: "cantidad", align: "center" },
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
        const i = ventas.indexOf(row); // sin cambiar tu DataTable
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
                  fields={[{
                    label: "Producto",
                    name: "producto",
                    type: "select",
                    options: productosDisponibles.map((p) => ({
                      label: p.nombre,
                      value: p.nombre,
                    })),
                    required: true,
                    placeholder: "Seleccionar...",
                  }]}
                  values={formData}
                  onChange={handleChange}
                  errors={errors}
                  columns={1}
                />
              </div>
              <div>
                <FormBuilder
                  fields={[{
                    label: "Tipo de venta",
                    name: "tipo",
                    type: "text",
                    readOnly: true,
                    placeholder: "—",
                    inputClass: "bg-[#f2f2f2] text-center",
                  }]}
                  values={formData}
                  onChange={handleChange}
                  errors={errors}
                  columns={1}
                />
              </div>
            </div>

            <div className="grid grid-cols-6 gap-5 items-end">
              <FormBuilder fields={[{ label: "Cant. (u/kg)", name: "cantidad", type: "number", placeholder: "0" }]} values={formData} onChange={handleChange} errors={errors} columns={1} />
              <FormBuilder fields={[{ label: "Subtotal", name: "subtotal", type: "number", placeholder: "$" }]} values={formData} onChange={handleChange} errors={errors} columns={1} />
              <FormBuilder fields={[{ label: "Descuento aplicado", name: "descuento", type: "number", placeholder: "%" }]} values={formData} onChange={handleChange} errors={errors} columns={1} />
              <button
                  onClick={handleAgregarProducto}
                  className="bg-[#154734] text-white px-4 py-2 rounded-md hover:bg-[#103a2b] transition w-full ml-8"
                >
                  + Añadir
                </button>

                <button
                  className="flex-wrap border border-[#154734] text-[#154734] px-4 py-2 rounded-md hover:bg-[#e8f4ef] transition w-full ml-7"
                >
                  + Nuevo producto
                </button>
            </div>
            
             
          </div>

          <h3 className="text-[#154734] text-sm font-semibold mb-2">Productos registrados</h3>
          <div className="flex-1 min-h-[150px] rounded-t-xl border-t border-[#e3e9e5]">
            <DataTable columns={columns} data={ventas} />
          </div>

          {ventas.length > 0 && (
            <div className="flex justify-between items-center text-[#154734] text-sm mt-3 mb-1 flex-shrink-0">
              <div>
                Subtotales: Cajas: {cantidadCajas} u — ${subtotalCajas.toLocaleString("es-AR")}
                &nbsp;&nbsp;Materiales: {cantidadProductos} kg — ${subtotalProductos.toLocaleString("es-AR")}
              </div>
              <p className="text-[#154734] font-semibold border border-[#e2ede8] bg-[#e8f4ef] px-3 py-1 rounded-md">
                Total venta:&nbsp;<span className="font-bold">${totalVenta.toLocaleString("es-AR")}</span>
              </p>
            </div>
          )}
        </div>

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

                // 1️⃣ Crear la venta principal con la fecha actual
                const fechaActual = new Date().toISOString().split("T")[0]; // yyyy-mm-dd
                const totalVenta = ventas.reduce((acc, v) => acc + Number(v.subtotal || 0), 0);

                const { data: venta, error: ventaError } = await supa
                  .from("venta")
                  .insert([{ fecha: fechaActual, total: totalVenta }])
                  .select()
                  .single();

                if (ventaError) throw ventaError;

                // 2️⃣ Crear los registros de detalle_venta
                const registros = ventas.map((v) => ({
                  id_venta: venta.id_venta, // FK a la venta recién creada
                  id_producto:
                    productosDisponibles.find((p) => p.nombre === v.producto)?.id_producto || null,
                  cantidad: Number(v.cantidad),
                  precio_unitario: Number(v.subtotal) / Number(v.cantidad || 1), // precio unitario
                  subtotal: Number(v.subtotal),
                }));

                const { error: detalleError } = await supa
                  .from("detalle_venta")
                  .insert(registros);

                if (detalleError) throw detalleError;

                alert("✅ Venta registrada correctamente");
                setVentas([]); // limpiar grilla
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
            title={`Modificando ${selectedVenta.productos?.[0]?.producto || ""}`}
            data={selectedVenta}
            itemsKey="productos"   // ⬅️ mantenemos productos
            columns={[
              { key: "tipo", label: "Tipo" },
              { key: "producto", label: "Producto" },
              { key: "cantidad", label: "Cantidad", type: "number" },
              { key: "precio", label: "Precio Unitario", type: "number" },
              { key: "descuento", label: "Descuento (%)", type: "number" },
              { key: "subtotal", label: "Subtotal", readOnly: true },
            ]}
            computeTotal={(rows) =>
              rows.reduce((sum, r) => sum + Number(r.subtotal || 0), 0)
            }
            onSave={handleGuardarCambios}
          />
        )}
      </div>
    </PageContainer>
  );
}
