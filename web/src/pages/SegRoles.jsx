// src/pages/SegRoles.jsx
import { useEffect, useMemo, useState } from "react";
import PageContainer from "../components/pages/PageContainer";
import DataTable from "../components/tables/DataTable";
import { supa } from "../lib/supabaseClient";

export default function SegRoles() {
  const [roles, setRoles] = useState([]);          // roles de la BD
  const [usuarios, setUsuarios] = useState([]);    // usuarios de la BD
  const [rolSel, setRolSel] = useState("");
  const [usrSel, setUsrSel] = useState("");
  const [rows, setRows] = useState([]);

  // Cargar roles y usuarios al montar
  useEffect(() => {
    const fetchData = async () => {
      const { data: rolesData } = await supa
        .from("roles")
        .select("id_rol, nombre");

      const { data: usuariosData } = await supa
        .from("usuarios")
        .select("id_usuario, nombre, id_rol");

      setRoles(rolesData || []);
      setUsuarios(usuariosData || []);

      // Montar filas iniciales con rol y usuario
      const inicial = (usuariosData || [])
        .filter(u => u.id_rol)            // solo usuarios con rol asignado
        .map(u => {
          const rol = rolesData?.find(r => r.id_rol === u.id_rol)?.nombre || "";
          return { id: `${u.id_usuario}`, rol, usuario: u.nombre };
        });
      setRows(inicial);
    };
    fetchData();
  }, []);

  // Asignar rol a un usuario
  const onAssign = async () => {
    const rol = roles.find(r => r.id_rol === parseInt(rolSel));
    const usr = usuarios.find(u => u.id_usuario === parseInt(usrSel));
    if (!rol || !usr) return;

    // Evitar duplicados
    if (rows.some(r => r.rol === rol.nombre && r.usuario === usr.nombre)) return;

    // Actualizar en Supabase (esto requiere permisos INSERT/UPDATE en usuarios)
    await supa
      .from("usuarios")
      .update({ id_rol: rol.id_rol })
      .eq("id_usuario", usr.id_usuario);

    setRows(prev => [
      ...prev,
      {
        id: `${usr.id_usuario}-${rol.id_rol}`,
        rol: rol.nombre,
        usuario: usr.nombre,
      },
    ]);
  };

  // Remover rol (dejar id_rol en NULL)
  const onRemove = async (row) => {
    const usuario = usuarios.find(u => u.nombre === row.usuario);
    if (!usuario) return;

    await supa
      .from("usuarios")
      .update({ id_rol: null })
      .eq("id_usuario", usuario.id_usuario);

    setRows(prev => prev.filter(r => r.id !== row.id));
  };

  const cols = useMemo(() => [
    { id: "rol", header: "Rol", accessor: "rol", width: 180 },
    { id: "usuario", header: "Usuario", accessor: "usuario" },
    {
      id: "acc",
      header: "Acciones",
      width: 140,
      align: "center",
      render: (row) => (
        <button
          className="px-2 py-1 text-xs rounded-md bg-[#a30000] text-white"
          onClick={() => onRemove(row)}
        >
          Remover
        </button>
      ),
    },
  ], [rows]);

  return (
    <PageContainer title="Gestión de roles">
      <div className="bg-white rounded-2xl border border-[#e3e9e5] p-5 md:p-6 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
          <div>
            <label className="text-sm font-semibold text-[#154734] mb-1 block">
              Seleccione un rol
            </label>
            <select
              value={rolSel}
              onChange={(e) => setRolSel(e.target.value)}
              className="w-full border border-[#d8e4df] rounded-md px-3 py-2"
            >
              <option value="">—</option>
              {roles.map((r) => (
                <option key={r.id_rol} value={r.id_rol}>
                  {r.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-[#154734] mb-1 block">
              Seleccione un usuario
            </label>
            <select
              value={usrSel}
              onChange={(e) => setUsrSel(e.target.value)}
              className="w-full border border-[#d8e4df] rounded-md px-3 py-2"
            >
              <option value="">—</option>
              {usuarios.map((u) => (
                <option key={u.id_usuario} value={u.id_usuario}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex md:justify-end">
            <button
              onClick={onAssign}
              className="rounded-md bg-[#154734] text-white px-4 py-2 hover:bg-[#103a2b]"
            >
              Asignar rol
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
        <a
          href="/seguridad"
          className="px-4 py-2 rounded-md border border-[#154734] text-[#154734] hover:bg-[#e8f4ef]"
        >
          Cancelar
        </a>
        <button
          className="px-5 py-2 rounded-md text-white bg-[#154734] hover:bg-[#103a2b]"
        >
          Guardar
        </button>
      </div>
    </PageContainer>
  );
}
