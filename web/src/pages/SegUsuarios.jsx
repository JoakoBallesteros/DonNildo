import React, { useEffect, useMemo, useState } from "react";
import PageContainer from "../components/pages/PageContainer";
import DataTable from "../components/tables/DataTable";
import Modal from "../components/modals/Modals";
import UsuarioForm from "../components/forms/UsuarioForm.jsx";

import {
  listarUsuarios, listarRoles,
  crearUsuario, actualizarUsuario, eliminarUsuario
} from "../services/userService";

export default function SegUsuarios() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function cargar() {
    try {
      setLoading(true);
      setErr("");
      const [us, rs] = await Promise.all([listarUsuarios(), listarRoles()]);
      setItems(us);
      setRoles(rs);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { cargar(); }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(u =>
      (u.dni||"").toLowerCase().includes(t) ||
      (u.nombre||"").toLowerCase().includes(t) ||
      (u.mail||"").toLowerCase().includes(t) ||
      (u.rol_nombre||"").toLowerCase().includes(t)
    );
  }, [items, q]);

  const cols = useMemo(() => [
    { id: "dni", header: "DNI", accessor: "dni", width: 130, nowrap: true, sortable: true },
    { id: "nombre", header: "Nombre", accessor: "nombre", sortable: true },
    { id: "mail", header: "E-Mail", accessor: "mail", sortable: true },
    { id: "rol", header: "Rol", accessor: "rol_nombre", width: 140, align: "center", sortable: true },
    {
      id: "estado", header: "Estado", width: 110, align: "center", sortable: true,
      sortAccessor: (r)=> (r.estado === "ACTIVO" ? 1 : 0),
      render: (r)=>(
        <span className={`px-2 py-0.5 rounded text-xs ${r.estado==="ACTIVO"?"bg-emerald-100 text-emerald-900":"bg-slate-200 text-slate-700"}`}>
          {r.estado==="ACTIVO" ? "Activo" : "Inactivo"}
        </span>
      )
    },
    {
      id: "acc", header: "Acciones", width: 190, align: "center",
      render: (row)=>(
        <div className="flex justify-center gap-2">
          <button className="px-2 py-1 text-xs rounded-md bg-[#154734] text-white" onClick={()=>{ setEdit(row); setOpen(true); }}>
            Modificar
          </button>
          <button className="px-2 py-1 text-xs rounded-md bg-[#a30000] text-white"
                  onClick={async ()=>{
                    if (!confirm("¿Eliminar usuario?")) return;
                    await eliminarUsuario(row.id_usuario);
                    setItems(prev => prev.filter(u => u.id_usuario !== row.id_usuario));
                  }}>
            Eliminar
          </button>
        </div>
      )
    },
  ], []);

  const onNew = () => { setEdit(null); setOpen(true); };

  const onSave = async (u) => {
    if (u.id_usuario) await actualizarUsuario(u.id_usuario, u);
    else await crearUsuario(u);
    setOpen(false);
    await cargar();
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
      {err && <p className="text-red-600 mb-3">{err}</p>}

      <div className="bg-white rounded-2xl border border-[#e3e9e5] p-5 md:p-6 mb-5">
        <div className="max-w-md">
          <label className="text-sm font-semibold text-[#154734] mb-1 block">Buscar</label>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Nombre o email"
                 className="w-full border border-[#d8e4df] rounded-md px-3 py-2" />
        </div>
      </div>

      {loading ? <p className="text-sm text-slate-600">Cargando…</p> : (
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
      )}

      {open && (
        <Modal isOpen={open} onClose={()=>setOpen(false)} title={edit ? "Editar usuario" : "Nuevo usuario"} size="max-w-2xl">
          <UsuarioForm initial={edit || {}} roles={roles} onSubmit={onSave} onCancel={()=>setOpen(false)} />
        </Modal>
      )}
    </PageContainer>
  );
}