import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}