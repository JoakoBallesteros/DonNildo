// src/components/pages/PageContainer.jsx
export default function PageContainer({
  title,
  actions,
  children,
  noDivider = false,
  extraPadding = false,
  extraHeight = false,
}) {
  const paddingClasses = extraPadding
    ? "px-12 py-8 md:px-16 md:py-10 lg:px-20 lg:py-12 xl:px-28 xl:py-14 2xl:px-32 2xl:py-16"
    : "px-12 py-8";

  const heightClasses = extraHeight
    ? "min-h-[72vh] md:min-h-[75vh] lg:min-h-[78vh]"
    : "";

  return (
    <section className="dn-page flex justify-center w-full px-6 py-6">
      <div
        className={`w-full max-w-[1750px] bg-white rounded-2xl shadow-sm ${paddingClasses} ${heightClasses}`}
      >
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
