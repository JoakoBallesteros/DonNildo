export default function PageContainer({ title, actions, children, noDivider=false }) {
  return (
    <section className="max-w-7xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className={`flex items-center justify-between px-5 md:px-7 py-4 ${noDivider ? '' : 'border-b border-slate-200'}`}>
          <h2 className="text-2xl md:text-3xl font-bold text-emerald-900">{title}</h2>
          <div className="flex gap-2">{actions}</div>
        </div>
        <div className="p-5 md:p-7">{children}</div>
      </div>
    </section>
  )
}