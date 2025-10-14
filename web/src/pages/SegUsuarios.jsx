import React, { useMemo, useState } from "react";
import PageContainer from "../components/pages/PageContainer";
import DataTable from "../components/tables/DataTable";
import Modal from "../components/modals/Modals";

// Catálogo de roles (fijo, sin creación por ahora)
const ROLES = [
  { id: "ADMIN", label: "Administrador" },
  { id: "SUPERVISOR", label: "Supervisor" },
  { id: "OPERADOR", label: "Operador" },
  { id: "CONSULTA", label: "Consulta" },
];

// ---- Modal ABM Usuario (simple, inline para dejar todo en 1 archivo) ----
function UserForm({ initial = {}, onSubmit, onCancel }) {
  const [dni, setDni] = useState(initial.dni ?? "");
  const [nombre, setNombre] = useState(initial.nombre ?? "");
  const [email, setEmail] = useState(initial.email ?? "");
  const [rol, setRol] = useState(initial.rol ?? "Operador");
  const [activo, setActivo] = useState(initial.activo ?? true);
  const [errors, setErrors] = useState({});

  const validar = () => {
    const e = {};
    if (!dni.trim()) e.dni = "DNI requerido";
    if (!nombre.trim()) e.nombre = "Nombre requerido";
    if (!email.trim()) e.email = "Email requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const guardar = () => {
    if (!validar()) return;
    onSubmit?.({ id: initial.id, dni: dni.trim(), nombre: nombre.trim(), email: email.trim(), rol, activo });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-[#154734] mb-1 block">DNI</label>
          <input
            className={`w-full rounded-md border px-3 py-2 ${errors.dni ? "border-red-300" : "border-[#d8e4df]"}`}
            value={dni}
            onChange={(e)=>{ setDni(e.target.value); if(errors.dni) setErrors(x=>({...x,dni:undefined})); }}
            placeholder="00.000.000"
          />
          {errors.dni && <p className="text-xs text-red-600 mt-1">{errors.dni}</p>}
        </div>
        <div>
          <label className="text-sm font-semibold text-[#154734] mb-1 block">Nombre</label>
          <input
            className={`w-full rounded-md border px-3 py-2 ${errors.nombre ? "border-red-300" : "border-[#d8e4df]"}`}
            value={nombre}
            onChange={(e)=>{ setNombre(e.target.value); if(errors.nombre) setErrors(x=>({...x,nombre:undefined})); }}
            placeholder="Nombre y apellido"
          />
          {errors.nombre && <p className="text-xs text-red-600 mt-1">{errors.nombre}</p>}
        </div>
        <div>
          <label className="text-sm font-semibold text-[#154734] mb-1 block">E-Mail</label>
          <input
            type="email"
            className={`w-full rounded-md border px-3 py-2 ${errors.email ? "border-red-300" : "border-[#d8e4df]"}`}
            value={email}
            onChange={(e)=>{ setEmail(e.target.value); if(errors.email) setErrors(x=>({...x,email:undefined})); }}
            placeholder="usuario@dominio.com"
          />
          {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
        </div>
        <div>
          <label className="text-sm font-semibold text-[#154734] mb-1 block">Rol</label>
          <select
            className="w-full rounded-md border px-3 py-2 border-[#d8e4df]"
            value={rol}
            onChange={(e)=>setRol(e.target.value)}
          >
            {ROLES.map(r => <option key={r.id} value={r.label}>{r.label}</option>)}
          </select>
          <div className="mt-3 flex items-center gap-2">
            <input id="activo" type="checkbox" checked={activo} onChange={(e)=>setActivo(e.target.checked)} />
            <label htmlFor="activo">Activo</label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-md border border-[#d8e4df] text-[#154734] bg-white">
          Cancelar
        </button>
        <button onClick={guardar} className="px-5 py-2 rounded-md text-white bg-[#154734] hover:bg-[#103a2b]">
          Guardar
        </button>
      </div>
    </div>
  );
}

// ---- Mock usuarios
const MOCK = [
  { id: "U-0001", dni: "20.123.456", nombre: "John Doe", email: "john@empresa.com", rol: "Operador", activo: true },
];

export default function SegUsuarios() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState(MOCK);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(u =>
      u.dni.toLowerCase().includes(t) ||
      u.nombre.toLowerCase().includes(t) ||
      u.email.toLowerCase().includes(t) ||
      u.rol.toLowerCase().includes(t)
    );
  }, [items, q]);

  const cols = useMemo(() => [
    { id: "dni",     header: "DNI",     accessor: "dni",     width: 130, nowrap: true, sortable: true },
    { id: "nombre",  header: "Nombre",  accessor: "nombre",  sortable: true },
    { id: "email",   header: "E-Mail",  accessor: "email",   sortable: true },
    { id: "rol",     header: "Rol",     accessor: "rol",     width: 140, align: "center", sortable: true },
    {
      id: "estado",  header: "Estado",  width: 110, align: "center", sortable: true,
      sortAccessor: (r)=> (r.activo ? 1 : 0),
      render: (r)=> <span className={`px-2 py-0.5 rounded text-xs ${r.activo?"bg-emerald-100 text-emerald-900":"bg-slate-200 text-slate-700"}`}>{r.activo?"Activo":"Inactivo"}</span>
    },
    {
      id: "acc", header: "Acciones", width: 190, align: "center",
      render: (row)=>(
        <div className="flex justify-center gap-2">
          <button className="px-2 py-1 text-xs rounded-md bg-[#154734] text-white" onClick={()=>{ setEdit(row); setOpen(true); }}>
            Modificar
          </button>
          <button className="px-2 py-1 text-xs rounded-md bg-[#a30000] text-white" onClick={()=>setItems(prev=>prev.filter(u=>u.id!==row.id))}>
            Eliminar
          </button>
        </div>
      )
    },
  ], []);

  const onNew = () => { setEdit(null); setOpen(true); };
  const onSave = (u) => {
    if (u.id) {
      setItems(prev => prev.map(x => x.id===u.id ? u : x));
    } else {
      const next = (Math.max(0, ...items.map(x => Number(x.id.replace(/\D/g,""))||0)) + 1).toString().padStart(4,"0");
      setItems(prev => [{ ...u, id: `U-${next}` }, ...prev]);
    }
    setOpen(false);
  };

  return (
    <PageContainer
      title="Usuarios"
      actions={
        <div className="flex gap-3">
          <button onClick={onNew} className="rounded-md border border-[#154734] text-[#154734] px-4 py-2 hover:bg-[#e8f4ef]">
            Nuevo usuario
          </button>
          <a href="/seguridad/roles" className="rounded-md border border-[#154734] text-[#154734] px-4 py-2 hover:bg-[#e8f4ef]">
            Gestionar Roles
          </a>
        </div>
      }
    >
      <div className="bg-white rounded-2xl border border-[#e3e9e5] p-5 md:p-6 mb-5">
        <div className="max-w-md">
          <label className="text-sm font-semibold text-[#154734] mb-1 block">Buscar</label>
          <input
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder="Nombre o email"
            className="w-full border border-[#d8e4df] rounded-md px-3 py-2"
          />
        </div>
      </div>

      <DataTable
        columns={cols}
        data={filtered}
        enableSort
        tableClass="w-full text-sm border-collapse table-fixed"
        theadClass="bg-[#e8f4ef] text-[#154734]"
        rowClass="hover:bg-[#f6faf7] transition border-t border-[#edf2ef]"
        headerClass="px-4 py-3 font-semibold border-r border-[#e3e9e5] last:border-none select-none"
        cellClass="px-4 py-3 border-r border-[#edf2ef] last:border-none"
      />

      {open && (
        <Modal isOpen={open} onClose={()=>setOpen(false)} title={edit ? "Editar usuario" : "Nuevo usuario"} size="max-w-2xl">
          <UserForm initial={edit || {}} onSubmit={onSave} onCancel={()=>setOpen(false)} />
        </Modal>
      )}
    </PageContainer>
  );
}
