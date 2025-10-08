// src/components/Sidebar.jsx (compacta)
import {useState} from "react";
import {NavLink} from "react-router-dom";
import {ChevronRight} from "lucide-react";
import HamburgerButton from "./buttons/HamburgerButton.jsx";

const linkBase  ="block w-full rounded-xl px-4 py-3 text-base font-semibold tracking-[0.2px] transition-colors";
const active    ="bg-emerald-700 text-white";
const inactive  ="text-emerald-900/85 hover:bg-emerald-100";

export default function Sidebar({open,mobileOpen,onCloseMobile,onToggle}){
  const [stockOpen,setStockOpen]=useState(true);

  return (<>
    {mobileOpen && <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={onCloseMobile}/>}

    <aside className={[
      "fixed md:static z-50 bg-emerald-50 border-r border-emerald-100 h-screen transition-all duration-200",
      mobileOpen?"translate-x-0":"-translate-x-full md:translate-x-0",
      open ? "md:w-72 md:pointer-events-auto" : "md:w-0 md:border-0 md:pointer-events-none md:overflow-hidden"
    ].join(" ")}>
      {open && (
        <div className="w-72 h-full flex flex-col">
          {/* Top row: marca + botón */}
          <div className="flex items-center justify-between px-4 pt-5 pb-4">
            <div className="text-3xl leading-7 font-extrabold text-emerald-900 select-none">
              DON<br/>NILDO
            </div>
            <HamburgerButton onClick={onToggle}/>
          </div>

          {/* Nav con gutter para que el pill no se salga */}
          <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-1">
            <NavLink to="/" end        className={({isActive})=>`mx-1 ${linkBase} ${isActive?active:inactive}`}>Inicio</NavLink>
            <NavLink to="/compras"     className={({isActive})=>`mx-1 ${linkBase} ${isActive?active:inactive}`}>Compras</NavLink>
            <NavLink to="/ventas"      className={({isActive})=>`mx-1 ${linkBase} ${isActive?active:inactive}`}>Ventas</NavLink>

            <button
              onClick={()=>setStockOpen(o=>!o)}
              aria-expanded={stockOpen}
              className={`mx-1 ${linkBase} ${inactive} w-[calc(100%-0.5rem)] flex items-center justify-between text-left`}
            >
              <span>Stock</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${stockOpen?"rotate-90":""}`}/>
            </button>
            {stockOpen && (
              <div className="pl-5 space-y-1">
                <NavLink to="/stock" end                 className={({isActive})=>`mx-1 ${linkBase} ${isActive?active:inactive}`}>Lista de stock</NavLink>
                <NavLink to="/stock/nuevo-producto"      className={({isActive})=>`mx-1 ${linkBase} ${isActive?active:inactive}`}>Registrar nuevo producto</NavLink>
                <NavLink to="/stock/pesaje"              className={({isActive})=>`mx-1 ${linkBase} ${isActive?active:inactive}`}>Registrar pesaje</NavLink>
              </div>
            )}

            <NavLink to="/reportes"    className={({isActive})=>`mx-1 ${linkBase} ${isActive?active:inactive}`}>Reportes</NavLink>
            <NavLink to="/seguridad"   className={({isActive})=>`mx-1 ${linkBase} ${isActive?active:inactive}`}>Seguridad</NavLink>
            <NavLink to="/login"       className={({isActive})=>`mx-1 ${linkBase} ${isActive?active:inactive}`}>Salir</NavLink>
          </nav>
        </div>
      )}
    </aside>

  
    
  </>);
}
