
import { useEffect, useMemo, useState, useCallback } from "react";
import PageContainer from "../components/pages/PageContainer";
import DataTable from "../components/tables/DataTable";
import { supa } from "../lib/supabaseClient";
import MessageModal from "../components/modals/MessageModal";

export default function SegRoles() {
  const [roles, setRoles] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [rolSel, setRolSel] = useState("");
  const [usrSel, setUsrSel] = useState("");
  const [rows, setRows] = useState([]);
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    title: "",
    text: "",
    type: "",
  });

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


      const inicial = (usuariosData || [])
        .filter((u) => u.id_rol)
        .map((u) => {
          const rol =
            rolesData?.find((r) => r.id_rol === u.id_rol)?.nombre || "";
          return { id: u.id_usuario, rol, usuario: u.nombre };  // ⬅️ id = id_usuario
        });
      setRows(inicial);
    };
    fetchData();
  }, []);


  const onAssign = async () => {
    const rol = roles.find((r) => r.id_rol === parseInt(rolSel));
    const usr = usuarios.find((u) => u.id_usuario === parseInt(usrSel));
    if (!rol || !usr) {
      setMessageModal({
        isOpen: true,
        title: "⚠️ Datos incompletos",
        text: "Debés seleccionar un usuario y un rol.",
        type: "error",
      });
      return;
    }

    try {

      await supa
        .from("usuarios")
        .update({ id_rol: rol.id_rol })
        .eq("id_usuario", usr.id_usuario);


      setRows((prev) => {
        const sinUsuario = prev.filter((r) => r.id !== usr.id_usuario);
        return [
          ...sinUsuario,
          { id: usr.id_usuario, rol: rol.nombre, usuario: usr.nombre },
        ];
      });


      setMessageModal({
        isOpen: true,
        title: " Rol asignado",
        text: `El usuario "${usr.nombre}" ahora tiene el rol "${rol.nombre}".`,
        type: "success",
      });

    } catch (error) {
      console.error("ERROR asignando rol:", error);
      setMessageModal({
        isOpen: true,
        title: " Error",
        text: "Ocurrió un error al asignar el rol. Intenta nuevamente.",
        type: "error",
      });
    }
  };


  const onRemove = useCallback(
    async (row) => {
      const usuario = usuarios.find((u) => u.nombre === row.usuario);
      if (!usuario) return;

const onRemove = useCallback(
  async (row) => {
    const usuario = usuarios.find((u) => u.nombre === row.usuario);
    if (!usuario) return;

    const { error } = await supa
      .from("usuarios")
      .update({ id_rol: ID_ROL_SIN_ROL })
      .eq("id_usuario", usuario.id_usuario);

    if (error) {
      alert("No se pudo remover el rol: " + error.message);
      console.error(error);
      return;
    }

    setRows((prev) =>
      prev.map((r) =>
        r.id === row.id ? { ...r, rol: "SIN_ROL" } : r
      )
    );
  },
  [usuarios]
);

  const cols = useMemo(
    () => [
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
    ],
    [onRemove]
  );

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

      <div>
        <div className="hidden md:block">
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
        </div>

        <div className="md:hidden space-y-3">
          {rows.length === 0 && (
            <p className="text-center text-gray-500 py-6">No hay asignaciones.</p>
          )}
          {rows.map((row) => (
            <div key={row.id} className="bg-white border p-4 rounded-lg shadow-sm border-slate-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="block text-xs text-gray-400 uppercase font-semibold">Rol</span>
                  <span className="font-bold text-[#154734] text-lg">{row.rol}</span>
                </div>
                <div className="text-right">
                  <span className="block text-xs text-gray-400 uppercase font-semibold">Usuario</span>
                  <span className="text-gray-800 font-medium">{row.usuario}</span>
                </div>
              </div>

              <button
                className="w-full py-2 rounded-lg bg-[#a30000] text-white text-sm font-medium hover:bg-[#8a0000] transition-colors"
                onClick={() => onRemove(row)}
              >
                Remover asignación
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        <a
          href="/seguridad"
          className="px-4 py-2 rounded-md border border-[#154734] text-[#154734] hover:bg-[#e8f4ef]"
        >
          Volver
        </a>
      </div>
      <MessageModal
        isOpen={messageModal.isOpen}
        title={messageModal.title}
        text={messageModal.text}
        type={messageModal.type}
        onClose={() =>
          setMessageModal({ isOpen: false, title: "", text: "", type: "" })
        }
      />
    </PageContainer>
  );
}


