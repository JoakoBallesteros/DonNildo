import React, { useMemo, useState } from "react";
import PageContainer from "../components/pages/PageContainer";
import DataTable from "../components/tables/DataTable";

const ROLES = [
  { id: "ADMIN", label: "Administrador" },
  { id: "SUPERVISOR", label: "Supervisor" },
  { id: "OPERADOR", label: "Operador" },
  { id: "CONSULTA", label: "Consulta" },
];

// usuarios de ejemplo (en real, podrías traerlos del store o API)
const USERS = [
  { id: "U-0001", nombre: "John Doe" },
  { id: "U-0002", nombre: "María Pérez" },
];

export default function SegRoles() {
  const [rolSel, setRolSel] = useState("");
  const [usrSel, setUsrSel] = useState("");
  const [rows, setRows] = useState([
    { id: "R-1", rol: "Administrador", usuario: "John Doe" },
  ]);

  const onAssign = () => {
    const rol = ROLES.find(r=>r.id===rolSel)?.label || "";
    const usr = USERS.find(u=>u.id===usrSel)?.nombre || "";
    if (!rol || !usr) return;
    // evitar duplicados
    if (rows.some(r => r.rol===rol && r.usuario===usr)) return;
    setRows(prev => [{ id: crypto.randomUUID?.() || String(Date.now()), rol, usuario: usr }, ...prev]);
  };

  const onRemove = (row) => setRows(prev => prev.filter(r => r.id !== row.id));

  const cols = useMemo(()=>[
    { id: "rol", header: "Rol", accessor: "rol", width: 180, sortable: true },
    { id: "usuario", header: "Usuario", accessor: "usuario", sortable: true },
    {
      id: "acc", header: "Acciones", width: 140, align: "center",
      render: (row)=>(
        <button className="px-2 py-1 text-xs rounded-md bg-[#a30000] text-white" onClick={()=>onRemove(row)}>
          Remover
        </button>
      )
    },
  ],[]);

  return (
    <PageContainer title="Gestión de Roles">
      <div className="bg-white rounded-2xl border border-[#e3e9e5] p-5 md:p-6 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
          <div>
            <label className="text-sm font-semibold text-[#154734] mb-1 block">Seleccione un rol</label>
            <select value={rolSel} onChange={(e)=>setRolSel(e.target.value)} className="w-full border border-[#d8e4df] rounded-md px-3 py-2">
              <option value="">—</option>
              {ROLES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-[#154734] mb-1 block">Seleccione un usuario</label>
            <select value={usrSel} onChange={(e)=>setUsrSel(e.target.value)} className="w-full border border-[#d8e4df] rounded-md px-3 py-2">
              <option value="">—</option>
              {USERS.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </select>
          </div>
          <div className="flex md:justify-end">
            <button onClick={onAssign} className="rounded-md bg-[#154734] text-white px-4 py-2 hover:bg-[#103a2b]">
              Asignar Rol
            </button>
          </div>
        </div>
      </div>

      <DataTable
        columns={cols}
        data={rows}
        enableSort
        tableClass="w-full text-sm border-collapse table-fixed"
        theadClass="bg-[#e8f4ef] text-[#154734]"
        rowClass="hover:bg-[#f6faf7] transition border-t border-[#edf2ef]"
        headerClass="px-4 py-3 font-semibold border-r border-[#e3e9e5] last:border-none select-none"
        cellClass="px-4 py-3 border-r border-[#edf2ef] last:border-none"
      />

      <div className="mt-6 flex justify-center gap-2">
        <a href="/seguridad" className="px-4 py-2 rounded-md border border-[#154734] text-[#154734] hover:bg-[#e8f4ef]">
          Cancelar
        </a>
        <button className="px-5 py-2 rounded-md text-white bg-[#154734] hover:bg-[#103a2b]">
          Guardar
        </button>
      </div>
    </PageContainer>
  );
}
