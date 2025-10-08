export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
      
      <div className="text-sm text-slate-500">v0.1 • {import.meta.env.MODE}</div>
    </header>
  )
}