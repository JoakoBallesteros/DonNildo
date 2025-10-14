import PageContainer from "../components/pages/PageContainer";
import ProductFormTabs from "../components/forms/ProductFormTabs";

export default function StockNuevoProducto() {
  return (
    <PageContainer title="Registrar nuevo producto">
      <div className="min-h-[70vh] grid place-items-center">
        <div className="w-full max-w-2xl">
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
            onSubmit={(v)=>console.log("Crear producto", v)}
            onCancel={() => window.history.back()}
          />
        </div>
      </div>
    </PageContainer>
  );
}