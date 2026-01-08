import React, { useEffect, useMemo, useState, useCallback } from "react";
import PageContainer from "../components/pages/PageContainer";
import DataTable from "../components/tables/DataTable";
import Modal from "../components/modals/Modals";
import UsuarioForm from "../components/forms/UsuarioForm.jsx";
import MessageModal from "../components/modals/MessageModal";

import {
  listarUsuarios,
  listarRoles,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
} from "../services/userService";

export default function SegUsuarios() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [roles, setRoles] = useState([]);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [messageModal, setMessageModal] = useState({ isOpen: false, title: "", text: "", type: "" });

  const cargar = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter(
      (u) =>
        (u.dni || "").toLowerCase().includes(t) ||
        (u.nombre || "").toLowerCase().includes(t) ||
        (u.mail || "").toLowerCase().includes(t) ||
        (u.rol_nombre || "").toLowerCase().includes(t)
    );
  }, [items, q]);

 
  const handleEliminar = useCallback(
    async (row) => {
      if (!confirm(`¿Estás seguro de eliminar al usuario ${row.nombre}?`)) {
        return;
      }

      try {
        console.log(" Eliminando usuario:", row.id_usuario);

        await eliminarUsuario(row.id_usuario);

        console.log(" Usuario eliminado exitosamente");

  
        await cargar();
      } catch (error) {
        console.error(" Error al eliminar:", error);
        setErr(`Error al eliminar usuario: ${error.message}`);
        setMessageModal({
          isOpen: true,
          title: " Error",
          text: `No se pudo eliminar el usuario: ${error.message}`,
          type: "error",
        });
      }
    },
    [cargar]
  );

  const cols = useMemo(
    () => [
      {
        id: "dni",
        header: "DNI",
        accessor: "dni",
        width: 130,
        nowrap: true,
        sortable: true,
      },
      { id: "nombre", header: "Nombre", accessor: "nombre", sortable: true },
      { id: "mail", header: "E-Mail", accessor: "mail", sortable: true },
      {
        id: "rol",
        header: "Rol",
        accessor: "rol_nombre",
        width: 140,
        align: "center",
        sortable: true,
      },
      {
        id: "estado",
        header: "Estado",
        width: 110,
        align: "center",
        sortable: true,
        sortAccessor: (r) => (r.estado === "ACTIVO" ? 1 : 0),
        render: (r) => (
          <span
            className={`px-2 py-0.5 rounded text-xs ${
              r.estado === "ACTIVO"
                ? "bg-emerald-100 text-emerald-900"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {r.estado === "ACTIVO" ? "Activo" : "Inactivo"}
          </span>
        ),
      },
      {
        id: "acc",
        header: "Acciones",
        width: 190,
        align: "center",
        render: (row) => (
          <div className="flex justify-center gap-2">
            <button
              className="px-2 py-1 text-xs rounded-md bg-[#154734] text-white hover:bg-[#1a5d42]"
              onClick={() => {
                setEdit(row);
                setOpen(true);
              }}
            >
              Modificar
            </button>
            <button
              className="px-2 py-1 text-xs rounded-md bg-[#a30000] text-white hover:bg-[#8a0000]"
              onClick={() => handleEliminar(row)}
            >
              Eliminar
            </button>
          </div>
        ),
      },
    ],
    [handleEliminar]
  );

  const onNew = () => {
    setEdit(null);
    setOpen(true);
  };

  const onSave = async (u) => {
    try {
      if (u.id_usuario) await actualizarUsuario(u.id_usuario, u);
      else await crearUsuario(u);
      setOpen(false);
      await cargar();
    } catch (error) {
      setErr(`Error al guardar: ${error.message}`);
    }
  };

  return (
    <PageContainer
      title="Usuarios"
      actions={
        <div className="flex gap-3">
          <button
            onClick={onNew}
            className="rounded-md border border-[#154734] text-[#154734] px-4 py-2 hover:bg-[#e8f4ef]"
          >
            Nuevo usuario
          </button>
          <a
            href="/seguridad/roles"
            className="rounded-md border border-[#154734] text-[#154734] px-4 py-2 hover:bg-[#e8f4ef]"
          >
            Gestionar Roles
          </a>
        </div>
      }
    >
      {err && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-5">
          {err}
          <button
            onClick={() => setErr("")}
            className="float-right font-bold text-red-900"
          >
            ×
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#e3e9e5] p-5 md:p-6 mb-5">
        <div className="max-w-md">
          <label className="text-sm font-semibold text-[#154734] mb-1 block">
            Buscar
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre o email"
            className="w-full border border-[#d8e4df] rounded-md px-3 py-2"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Cargando…</p>
      ) : (
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
        <Modal
          isOpen={open}
          onClose={() => setOpen(false)}
          title={edit ? "Editar usuario" : "Nuevo usuario"}
          size="max-w-2xl"
        >
          <UsuarioForm
            initial={edit || {}}
            roles={roles}
            onSubmit={onSave}
            onCancel={() => setOpen(false)}
          />
        </Modal>
      )}
      <MessageModal
        isOpen={messageModal.isOpen}
        title={messageModal.title}
        text={messageModal.text}
        type={messageModal.type}
        onClose={() => setMessageModal(prev => ({ ...prev, isOpen: false }))}
      />
    </PageContainer>
  );
}

