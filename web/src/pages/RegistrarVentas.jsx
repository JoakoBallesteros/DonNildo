import { useState } from "react";
import PageContainer from "../components/pages/PageContainer";
import FormBuilder from "../components/forms/FormBuilder";
import DataTable from "../components/tables/DataTable";
import Modified from "../components/modals/modified";

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
  const [ventas, setVentas] = useState([
    { tipo: "Caja", producto: "Caja de cartón", cantidad: 10, fecha: "2025-10-10", subtotal: 15000, descuento: 0 },
    { tipo: "Producto", producto: "Papel Kraft", cantidad: 20, fecha: "2025-10-11", subtotal: 12000, descuento: 0 },
    { tipo: "Producto", producto: "Stitch", cantidad: 20, fecha: "2025-10-11", subtotal: 12000, descuento: 0 },
  ]);

  const [selectedVenta, setSelectedVenta] = useState(null);
  const [isEditOpen, setEditOpen] = useState(false);

  const productosDisponibles = [
    { nombre: "Caja de cartón", tipoVenta: "Caja" },
    { nombre: "Papel Kraft", tipoVenta: "Producto" },
    { nombre: "Combinado EcoPack", tipoVenta: "Mixta" },
  ];

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

  const validarFormulario = () => {
    const nuevosErrores = {};
    if (!formData.producto) nuevosErrores.producto = "Seleccioná un producto";
    if (!formData.tipo) nuevosErrores.tipo = "Falta tipo de venta";
    if (!formData.cantidad) nuevosErrores.cantidad = "Ingresá cantidad";
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

  const handleEditar = (venta) => {
    setSelectedVenta({ ...venta });
    setEditOpen(true);
  };

  const handleGuardarCambios = (updatedVenta) => {
    setVentas((prev) => prev.map((v) => (v.producto === updatedVenta.producto ? updatedVenta : v)));
    setEditOpen(false);
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
    { id: "fecha", header: "Fecha", accessor: "fecha", align: "center" },
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
      render: (row) => (
        <div className="flex justify-center items-start gap-2">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => handleEditar(row)}
              className="bg-[#154734] text-white px-3 py-1 text-xs rounded-md hover:bg-[#1E5A3E]"
            >
              MODIFICAR
            </button>
            <button
              onClick={() =>
                setVentas((prev) => prev.filter((v) => v.numero !== row.numero))
              }
              className="bg-[#A30000] text-white px-3 py-1 text-xs rounded-md hover:bg-[#7A0000]"
            >
              ANULAR
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="Registrar Venta">
      <div className="flex flex-col min-h-[calc(100dvh-230px)] max-h-[calc(100dvh-230px)] justify-between overflow-hidden">
        {/*  Contenido principal scrolleable */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          
          {/* Bloque superior: formulario, filtros y botones */}
          <div className="bg-[#f7fbf8] border border-[#e2ede8] rounded-2xl p-4 mb-4 flex-shrink-0">
            <h2 className="text-[#154734] text-base font-semibold mb-3">
              Datos de la venta
            </h2>

            {/* Tu formulario y filtros originales */}
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

            {/* Campos inferiores */}
            <div className="grid grid-cols-6 gap-4 items-end">
              <FormBuilder
                fields={[{ label: "Fecha", name: "fecha", type: "date" }]}
                values={formData}
                onChange={handleChange}
                errors={errors}
                columns={1}
              />
              <FormBuilder
                fields={[{ label: "Cant. (u/kg)", name: "cantidad", type: "number", placeholder: "0" }]}
                values={formData}
                onChange={handleChange}
                errors={errors}
                columns={1}
              />
              <FormBuilder
                fields={[{ label: "Subtotal", name: "subtotal", type: "number", placeholder: "$" }]}
                values={formData}
                onChange={handleChange}
                errors={errors}
                columns={1}
              />
              <FormBuilder
                fields={[{ label: "Descuento aplicado", name: "descuento", type: "number", placeholder: "%" }]}
                values={formData}
                onChange={handleChange}
                errors={errors}
                columns={1}
              />
              <button
                onClick={handleAgregarProducto}
                className="bg-[#154734] text-white px-4 py-2 rounded-md hover:bg-[#103a2b] transition w-full"
              >
                + Añadir
              </button>
              <button className="border border-[#154734] text-[#154734] px-4 py-2 rounded-md hover:bg-[#e8f4ef] transition w-full">
                + Nuevo producto
              </button>
            </div>
          </div>

          {/* 🔹 Tabla de productos */}
          <h3 className="text-[#154734] text-sm font-semibold mb-2">
            Productos registrados
          </h3>
          <div className="flex-1 min-h-[150px] rounded-t-xl border-t border-[#e3e9e5]">
            <DataTable columns={columns} data={ventas} />
          </div>

          {/* 🔹 Subtotales */}
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

        {/* 🔹 Botones inferiores fijos */}
        <div className="flex justify-center items-center gap-4 mt-4 pb-2 flex-shrink-0">
          <button className="border border-[#154734] text-[#154734] px-6 py-2 rounded-md hover:bg-[#f0f7f3] transition">
            CANCELAR
          </button>
          <button
            onClick={() => console.log("Venta guardada:", ventas)}
            className="bg-[#154734] text-white px-6 py-2 rounded-md hover:bg-[#103a2b] transition"
          >
            GUARDAR
          </button>
        </div>
      </div>
    </PageContainer>
  );
}
