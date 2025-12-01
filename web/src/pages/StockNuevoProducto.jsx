// src/pages/StockNuevoProducto.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import PageContainer from "../components/pages/PageContainer";
import ProductFormTabs from "../components/forms/ProductFormTabs";
import MessageModal from "../components/modals/MessageModal";
import { apiFetch } from "../lib/apiClient";

export default function StockNuevoProducto() {
  const navigate = useNavigate();
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    title: "",
    text: "",
    type: "",
  });

  const handleCloseMessage = () => {
    // si fue OK, volvemos al listado de stock
    if (messageModal.type === "success") {
      navigate("/stock");
    }
    setMessageModal({ isOpen: false, title: "", text: "", type: "" });
  };

  const handleSubmit = async (values) => {
    try {
      // pega al mismo endpoint que usa StockList
      const row = await apiFetch("/api/stock/productos", {
        method: "POST",
        body: JSON.stringify(values),
      });

      // row viene desde la view v_stock_list
      const nombre = row.referencia || row.nombre || values.referencia;

      setMessageModal({
        isOpen: true,
        title: "✅ Producto creado",
        text: `El producto "${nombre}" fue creado correctamente.`,
        type: "success",
      });

      // 📝 La auditoría CREAR_PRODUCTO  se hace en el backend.
    } catch (e) {
      console.error("Error al crear producto:", e);
      setMessageModal({
        isOpen: true,
        title: "❌ Error al crear",
        text: e.message || "Ocurrió un error al crear el producto.",
        type: "error",
      });
    }
  };

  return (
    <PageContainer title="Registrar nuevo producto">
      <div className="min-h-[70vh] px-3 py-4 sm:px-4 lg:px-6">
        <section className="w-full max-w-3xl mx-auto bg-white rounded-2xl border border-[#e3e9e5] shadow-sm p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold tracking-wide text-[#7a8b82] uppercase">
              Formulario
            </p>

          </div>

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
            onSubmit={handleSubmit}
            onCancel={handleCloseMessage}
          />
        </section>
      </div>

      {/* Modal de mensajes (éxito / error) */}
      <MessageModal
        isOpen={messageModal.isOpen}
        title={messageModal.title}
        text={messageModal.text}
        type={messageModal.type}
        onClose={handleCloseMessage}
      />
    
    </PageContainer>
  );
}
