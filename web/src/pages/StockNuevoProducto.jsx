import PageContainer from "../components/PageContainer";

export default function StockNuevoProducto() {
  return (
    <PageContainer>
      <section className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-emerald-900 mb-4">
          Registrar nuevo producto
        </h2>
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <input
            className="border rounded-lg px-3 py-2 w-full"
            placeholder="Nombre"
          />
          <textarea
            className="border rounded-lg px-3 py-2 w-full"
            placeholder="Notas (opcional)"
          />
          <div className="flex gap-3 justify-end">
            <button className="rounded-lg border px-4 py-2">Cancelar</button>
            <button className="rounded-lg bg-emerald-800 text-white px-4 py-2">
              Guardar
            </button>
          </div>
        </div>
      </section>
    </PageContainer>
  );
}
