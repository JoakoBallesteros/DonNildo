import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import api from "../lib/apiClient";
import PageContainer from "../components/pages/PageContainer.jsx";
import DataTable from "../components/tables/DataTable.jsx";
import Modal from "../components/modals/Modals.jsx";

function mapProveedorFromApi(p) {
  return {
    id: p.id_proveedor ?? p.id ?? null,
    cuit: p.cuit ?? p.CUIT ?? "",
    nombre: p.nombre ?? p.razon_social ?? p.razonSocial ?? "",
    contacto: p.contacto ?? p.telefono ?? p.email ?? "",
    direccion: p.direccion ?? p.domicilio ?? "",
  };
}

const emptyForm = {
  cuit: "",
  nombre: "",
  contacto: "",
  direccion: "",
};

function formatCuit(raw) {
  const digits = String(raw || "").replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
}

export default function Proveedores() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [search, setSearch] = useState("");

  const [isFormOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    title: "",
    text: "",
    type: "success",
  });

  function openMessage({ title, text, type = "success" }) {
    setMessageModal({ isOpen: true, title, text, type });
  }

  function closeMessage() {
    setMessageModal({ isOpen: false, title: "", text: "", type: "success" });
  }

  useEffect(() => {
    async function fetchProveedores() {
      try {
        setLoading(true);
        setErrorMsg("");

        const resp = await api("/api/proveedores");
        if (!resp?.ok || !Array.isArray(resp.proveedores)) {
          setRows([]);
          return;
        }

        const mapped = resp.proveedores.map(mapProveedorFromApi);
        setRows(mapped);
      } catch (err) {
        setErrorMsg("No se pudieron cargar los proveedores desde el servidor.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProveedores();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        String(r.cuit || "").toLowerCase().includes(q) ||
        String(r.nombre || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      cuit: formatCuit(row.cuit || ""),
      nombre: row.nombre || "",
      contacto: row.contacto || "",
      direccion: row.direccion || "",
    });
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "cuit") {
      setForm((prev) => ({ ...prev, cuit: formatCuit(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const cuitDigits = String(form.cuit || "").replace(/\D/g, "");
    if (cuitDigits.length !== 11) {
      openMessage({
        type: "error",
        title: "CUIT inválido",
        text: "El CUIT debe tener 11 dígitos (formato XX-XXXXXXXX-X).",
      });
      return;
    }

    if (!String(form.nombre || "").trim()) {
      openMessage({
        type: "error",
        title: "Campos incompletos",
        text: "Completá al menos el Nombre del proveedor.",
      });
      return;
    }

    try {
      setSaving(true);

      const payload = {
        cuit: String(form.cuit || "").trim(),
        nombre: String(form.nombre || "").trim(),
        contacto: String(form.contacto || "").trim(),
        direccion: String(form.direccion || "").trim(),
      };

      const isEdit = Boolean(editing && editing.id);
      const url = isEdit ? `/api/proveedores/${editing.id}` : "/api/proveedores";
      const method = isEdit ? "PUT" : "POST";

      const resp = await api(url, { method, body: payload });

      if (!resp?.ok) {
        openMessage({
          type: "error",
          title: "Error al guardar",
          text: resp?.message || "No se pudo guardar el proveedor. Revisá el servidor.",
        });
        return;
      }

      let updatedProveedor;
      if (resp.proveedor) {
        updatedProveedor = mapProveedorFromApi(resp.proveedor);
      } else {
        updatedProveedor = { id: editing?.id ?? resp.id ?? null, ...payload };
      }

      setRows((prev) => {
        if (isEdit) {
          return prev.map((r) => (r.id === updatedProveedor.id ? updatedProveedor : r));
        }
        return [...prev, updatedProveedor];
      });

      closeForm();

      openMessage({
        type: "success",
        title: isEdit ? "¡Proveedor actualizado!" : "¡Proveedor registrado!",
        text: isEdit
          ? `El proveedor "${updatedProveedor.nombre}" fue actualizado correctamente.`
          : `El proveedor "${updatedProveedor.nombre}" fue registrado correctamente.`,
      });
    } catch (err) {
      openMessage({
        type: "error",
        title: "❌ Error de red",
        text: "Ocurrió un error de red al guardar el proveedor.",
      });
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(row) {
    setDeleteTarget(row);
    setConfirmDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTarget?.id) return;

    try {
      setConfirmDeleteOpen(false);

      const resp = await api(`/api/proveedores/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!resp?.ok) {
        openMessage({
          type: "error",
          title: "Error al eliminar",
          text: resp?.message || "No se pudo eliminar el proveedor. Revisá el servidor.",
        });
        return;
      }

      setRows((prev) => prev.filter((r) => r.id !== deleteTarget.id));

      openMessage({
        type: "success",
        title: "¡Proveedor eliminado!",
        text: `El proveedor "${deleteTarget.nombre}" fue eliminado correctamente.`,
      });
    } catch (err) {
      openMessage({
        type: "error",
        title: "❌ Error de red",
        text: "Ocurrió un error de red al eliminar el proveedor.",
      });
    } finally {
      setDeleteTarget(null);
    }
  }

  const columns = [
    {
      id: "cuit",
      header: "CUIT",
      accessor: (r) => r.cuit,
      align: "center",
      sortable: true,
      width: "140px",
    },
    {
      id: "nombre",
      header: "Proveedor",
      accessor: (r) => r.nombre,
      align: "center",
      sortable: true,
    },
    {
      id: "contacto",
      header: "Contacto",
      accessor: (r) => r.contacto,
      align: "center",
    },
    {
      id: "direccion",
      header: "Dirección",
      accessor: (r) => r.direccion,
      align: "center",
    },
    {
      id: "acciones",
      header: "Acciones",
      align: "center",
      width: "190px",
      render: (row) => (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => openEdit(row)}
            className="bg-[#154734] text-white px-4 py-1.5 text-xs rounded-md hover:bg-[#1E5A3E]"
          >
            MODIFICAR
          </button>
          <button
            onClick={() => requestDelete(row)}
            className="bg-[#A30000] text-white px-4 py-1.5 text-xs rounded-md hover:bg-[#7A0000]"
          >
            ELIMINAR
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Proveedores"
      actions={
        <button
          onClick={openNew}
          className="flex items-center justify-center gap-2 bg-[#154734] text-white px-6 py-2 rounded-full hover:bg-[#103a2b] transition"
        >
          <Plus size={16} /> Nuevo proveedor
        </button>
      }
    >
      <div className="mb-4 max-w-xs">
        <label className="block text-sm font-medium text-[#154734] mb-1">
          Buscar
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            className="w-full rounded-md border border-slate-200 bg-white px-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Nombre / CUIT"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading && <p className="mt-2 text-sm text-slate-600">Cargando proveedores…</p>}
      {errorMsg && !loading && <p className="mt-2 text-sm text-red-600">{errorMsg}</p>}

      <div className="mt-6">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <DataTable
            columns={columns}
            data={filtered}
            zebra={false}
            stickyHeader={true}
            wrapperClass="dn-table-wrapper overflow-y-auto shadow-sm"
            tableClass="w-full text-sm text-center border-collapse"
            theadClass="bg-[#e8f4ef] text-[#154734]"
            rowClass="bg-white hover:bg-[#f6faf7] border-t border-[#edf2ef]"
            headerClass="px-4 py-3 font-semibold text-center"
            cellClass="px-4 py-2 text-center"
            enableSort={true}
            enablePagination={false}
          />
        </div>

        {/* Mobile Card List */}
        <div className="md:hidden space-y-3">
          {filtered.length === 0 && (
            <p className="text-center text-gray-500 py-4 text-sm">No se encontraron proveedores.</p>
          )}
          {filtered.map((row) => (
            <div key={row.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="flex flex-col">
                  <h3 className="font-bold text-[#154734] text-base">{row.nombre}</h3>
                  <span className="text-sm text-gray-600">CUIT: {row.cuit}</span>
                </div>
              </div>

              <div className="text-sm text-gray-600 space-y-1 mb-3">
                {row.contacto && (
                  <div className="flex gap-2">
                    <span className="font-semibold w-20">Contacto:</span>
                    <span className="flex-1">{row.contacto}</span>
                  </div>
                )}
                {row.direccion && (
                  <div className="flex gap-2">
                    <span className="font-semibold w-20">Dirección:</span>
                    <span className="flex-1">{row.direccion}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => openEdit(row)}
                  className="flex-1 bg-[#154734] text-white text-xs py-2 rounded hover:bg-[#1E5A3E]"
                >
                  MODIFICAR
                </button>
                <button
                  onClick={() => requestDelete(row)}
                  className="flex-1 bg-[#A30000] text-white text-xs py-2 rounded hover:bg-[#7A0000]"
                >
                  ELIMINAR
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title="ABM Proveedores"
        size="max-w-lg"
        footer={
          <div className="flex justify-end gap-4 mt-4">
            <button
              type="button"
              onClick={closeForm}
              className="px-6 py-2 rounded-full font-semibold text-[#154734] border border-slate-200 bg-white hover:bg-slate-50 transition"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="proveedor-form"
              className="px-6 py-2 rounded-full font-semibold text-white bg-[#154734] hover:bg-[#103a2b] transition disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        }
      >
        <form id="proveedor-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#154734]">CUIT</label>
            <input
              name="cuit"
              value={form.cuit}
              onChange={handleChange}
              className="border border-slate-200 rounded-md px-3 py-2 text-sm"
              placeholder="XX-XXXXXXXX-X"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#154734]">Nombre</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="border border-slate-200 rounded-md px-3 py-2 text-sm"
              placeholder="Nombre / Razón social"
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#154734]">Contacto</label>
            <input
              name="contacto"
              value={form.contacto}
              onChange={handleChange}
              className="border border-slate-200 rounded-md px-3 py-2 text-sm"
              placeholder="Teléfono o email"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#154734]">Dirección</label>
            <input
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              className="border border-slate-200 rounded-md px-3 py-2 text-sm"
              placeholder="Domicilio"
            />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={confirmDeleteOpen}
        onClose={() => {
          if (saving) return;
          setConfirmDeleteOpen(false);
          setDeleteTarget(null);
        }}
        title="Confirmar eliminación"
        size="max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setConfirmDeleteOpen(false);
                setDeleteTarget(null);
              }}
              className="px-4 py-2 rounded-md font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              Volver
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 transition"
            >
              Sí, eliminar
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-700">
          ¿Seguro que querés eliminar el proveedor{" "}
          <strong className="text-slate-900">
            {deleteTarget?.nombre} ({deleteTarget?.cuit})
          </strong>
          ?
          <br />
          Esta acción no se puede deshacer.
        </p>
      </Modal>

      <Modal
        isOpen={messageModal.isOpen}
        onClose={closeMessage}
        title={messageModal.title}
        size="max-w-md"
        footer={
          <div className="flex justify-end">
            <button
              onClick={closeMessage}
              className={`px-4 py-2 rounded-md font-semibold text-white transition ${messageModal.type === "success"
                  ? "bg-[#154734] hover:bg-[#103a2b]"
                  : "bg-red-700 hover:bg-red-800"
                }`}
            >
              Aceptar
            </button>
          </div>
        }
      >
        <p
          className={`text-sm ${messageModal.type === "success" ? "text-emerald-700" : "text-red-700"
            }`}
        >
          {messageModal.text}
        </p>
      </Modal>
    </PageContainer>
  );
}
