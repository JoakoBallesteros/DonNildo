export default function PageContainer({ title, actions, children, noDivider = false }) {
  return (
    <section className="flex justify-center w-full px-6 py-6">
      <div className="w-full max-w-[1750px] bg-white rounded-2xl shadow-sm px-12 py-8">
        {/* Encabezado */}
        <div
          className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
            noDivider ? "" : "pb-6"
          }`}
        >
          <h2 className="text-3xl font-bold text-[#154734]">{title}</h2>
          <div className="flex gap-3">{actions}</div>
        </div>

        {/* Contenido */}
        <div className="mt-6 space-y-10">{children}</div>
      </div>
    </section>
  );
}
