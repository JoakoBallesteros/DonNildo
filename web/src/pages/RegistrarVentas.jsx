import { useState } from "react";
import PageContainer from "../components/pages/PageContainer";
import FormBuilder from "../components/forms/FormBuilder";
import DataTable from "../components/tables/DataTable";

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

  // 🔹 Simulación de productos cargados desde base de datos
  const productosDisponibles = [
    { nombre: "Caja de cartón", tipoVenta: "Caja" },
    { nombre: "Papel Kraft", tipoVenta: "Producto" },
    { nombre: "Combinado EcoPack", tipoVenta: "Mixta" },
  ];

  // 🔹 Maneja cambios de campos
  const handleChange = (name, value) => {
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

  // 🔹 Validación básica
  const validarFormulario = () => {
    const nuevosErrores = {};
    if (!formData.producto) nuevosErrores.producto = "Seleccioná un producto";
    if (!formData.tipo) nuevosErrores.tipo = "Falta tipo de venta";
    if (!formData.cantidad) nuevosErrores.cantidad = "Ingresá cantidad";
    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // 🔹 Añadir producto a la tabla
  const handleAgregarProducto = () => {
    if (!validarFormulario()) return;
    const nuevoItem = {
      ...formData,
      subtotal: calcularSubtotal(),
    };
    setVentas((prev) => [...prev, nuevoItem]);
    setFormData({
      producto: "",
      tipo: "",
      fecha: "",
      cantidad: "",
      subtotal: "",
      descuento: "",
    });
  };

  const calcularSubtotal = () => {
    const subtotal = Number(formData.subtotal) || 0;
    const descuento = Number(formData.descuento) || 0;
    const total = subtotal * (1 - descuento / 100);
    return total.toFixed(2);
  };

  const totalVenta = ventas.reduce(
    (acc, v) => acc + Number(v.subtotal || 0),
    0
  );

  const columns = [
    { id: "producto", header: "Producto", accessor: "producto" },
    { id: "tipo", header: "Tipo", accessor: "tipo" },
    { id: "fecha", header: "Fecha", accessor: "fecha", align: "center" },
    { id: "cantidad", header: "Cantidad", accessor: "cantidad", align: "center" },
    { id: "subtotal", header: "Subtotal", accessor: "subtotal", align: "right" },
    {
      id: "acciones",
      header: "Acciones",
      align: "center",
      render: (_, i) => (
        <button
          onClick={() => setVentas((prev) => prev.filter((_, idx) => idx !== i))}
          className="bg-[#A30000] text-white px-3 py-1 rounded-md text-xs hover:bg-[#7A0000]"
        >
          Eliminar
        </button>
      ),
    },
  ];

  return (
    <PageContainer title="Registrar Venta">
      <div className="bg-[#f7fbf8] border border-[#e2ede8] rounded-2xl p-6 mb-8">
        <h2 className="text-[#154734] text-base font-semibold mb-4">
          Datos de la venta
        </h2>

        {/* Fila superior: Producto / Tipo de venta */}
      <div className="grid grid-cols-[2fr_1fr] gap-4 mb-4">
        <div>
          <FormBuilder
            fields={[
              {
                label: "Producto / Material",
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
                required: true,
              },
            ]}
            values={formData}
            onChange={handleChange}
            errors={errors}
            columns={1}
          />
        </div>
      </div>

        {/* 🔹 Fila inferior (alineada): 4 campos + 2 botones */}
        <div className="grid grid-cols-6 gap-4 items-end">
          <div className="col-span-1">
            <FormBuilder
              fields={[{ label: "Fecha", name: "fecha", type: "date" }]}
              values={formData}
              onChange={handleChange}
              errors={errors}
              columns={1}
            />
          </div>

          <div className="col-span-1">
            <FormBuilder
              fields={[
                { label: "Cant. (u/kg)", name: "cantidad", type: "number", placeholder: "0" },
              ]}
              values={formData}
              onChange={handleChange}
              errors={errors}
              columns={1}
            />
          </div>

          <div className="col-span-1">
            <FormBuilder
              fields={[
                { label: "Subtotal", name: "subtotal", type: "number", placeholder: "$" },
              ]}
              values={formData}
              onChange={handleChange}
              errors={errors}
              columns={1}
            />
          </div>

          <div className="col-span-1">
            <FormBuilder
              fields={[
                { label: "Descuento aplicado", name: "descuento", type: "number", placeholder: "%" },
              ]}
              values={formData}
              onChange={handleChange}
              errors={errors}
              columns={1}
            />
          </div>

          {/* Botones (col 5 y 6) */}
          <div className="col-span-1 flex justify-end">
            <button
              onClick={handleAgregarProducto}
              className="bg-[#154734] text-white px-6 py-2 h-[40px] rounded-md hover:bg-[#103a2b] transition w-full"
            >
              + Añadir
            </button>
          </div>

          <div className="col-span-1 flex">
            <button
              className="border border-[#154734] text-[#154734] px-6 py-2 h-[40px] rounded-md hover:bg-[#e8f4ef] transition w-full"
            >
              + Nuevo producto
            </button>
          </div>
        </div>
      </div>

      {/* 🔹 Tabla de productos */}
      <h3 className="text-[#154734] text-sm font-semibold mb-2">
        Productos registrados
      </h3>
      <DataTable columns={columns} data={ventas} />

      {/* 🔹 Footer */}
      <div className="flex flex-col items-center mt-8">
        <p className="text-[#154734] font-semibold mb-3">
          Total venta: <span className="font-bold">${totalVenta.toFixed(2)}</span>
        </p>
        <div className="flex gap-4">
          <button className="border border-[#154734] text-[#154734] px-8 py-2 rounded-md hover:bg-[#f0f7f3] transition">
            CANCELAR
          </button>
          <button
            onClick={() => console.log("Venta guardada:", ventas)}
            className="bg-[#154734] text-white px-8 py-2 rounded-md hover:bg-[#103a2b] transition"
          >
            GUARDAR
          </button>
        </div>
      </div>
    </PageContainer>
  );
}
