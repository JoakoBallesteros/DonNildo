import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import api from "../lib/apiClient";
import PageContainer from "../components/pages/PageContainer.jsx";
import DataTable from "../components/tables/DataTable.jsx";
import Modal from "../components/modals/Modals.jsx";

const emptyForm = {
  tipo_persona: "JURIDICA",
  tipo_documento: "CUIT",
  numero_documento: "",
  razon_social: "",
  nombre_fantasia: "",
  condicion_iva: "CONSUMIDOR_FINAL",
  email: "",
  telefono: "",
  direccion: "",
  localidad: "",
  provincia: "",
  codigo_postal: "",
  lista_precios_id: "",
  tiene_cuenta_cte: false,
  estado: true
};

function formatDoc(tipo, raw) {
  const digits = String(raw || "").replace(/\D/g, "");
  if (tipo === "CUIT" || tipo === "CUIL") {
    if (digits.length <= 2) return digits;
    if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10, 11)}`;
  }
  return digits;
}

export default function Clientes() {
  const [rows, setRows] = useState([]);
  const [listas, setListas] = useState([]);
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
    isOpen: false, title: "", text: "", type: "success",
  });

  function openMessage({ title, text, type = "success" }) {
    setMessageModal({ isOpen: true, title, text, type });
  }
  function closeMessage() {
    setMessageModal({ isOpen: false, title: "", text: "", type: "success" });
  }

  useEffect(() => {
    async function fetchClientes() {
      try {
        setLoading(true);
        setErrorMsg("");
        const resp = await api("/api/v1/clientes");
        if (!resp?.ok || !Array.isArray(resp.clientes)) {
          setRows([]);
        } else {
          setRows(resp.clientes);
        }

        const respListas = await api("/api/v1/precios/listas");
        if (respListas?.ok) setListas(respListas.listas);

      } catch (err) {
        setErrorMsg("No se pudieron cargar los clientes desde el servidor.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    }
    fetchClientes();
  }, []);

  const filtered = useMemo(() => {
    let res = rows.filter(r => r.estado === true); // Only active clients
    if (!search.trim()) return res;
    const q = search.trim().toLowerCase();
    return res.filter(
      (r) =>
        String(r.numero_documento || "").toLowerCase().includes(q) ||
        String(r.razon_social || "").toLowerCase().includes(q) ||
        String(r.nombre_fantasia || "").toLowerCase().includes(q)
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
      tipo_persona: row.tipo_persona || "JURIDICA",
      tipo_documento: row.tipo_documento || "CUIT",
      numero_documento: formatDoc(row.tipo_documento, row.numero_documento),
      razon_social: row.razon_social || "",
      nombre_fantasia: row.nombre_fantasia || "",
      condicion_iva: row.condicion_iva || "CONSUMIDOR_FINAL",
      email: row.email || "",
      telefono: row.telefono || "",
      direccion: row.direccion || "",
      localidad: row.localidad || "",
      provincia: row.provincia || "",
      codigo_postal: row.codigo_postal || "",
      lista_precios_id: row.lista_precios_id || "",
      tiene_cuenta_cte: row.tiene_cuenta_cte || false,
      estado: row.estado !== false
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
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    
    if (name === "numero_documento") {
      setForm((prev) => ({ ...prev, numero_documento: formatDoc(prev.tipo_documento, val) }));
    } else if (name === "tipo_documento") {
       setForm((prev) => ({ ...prev, tipo_documento: val, numero_documento: formatDoc(val, prev.numero_documento) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: val }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const docDigits = String(form.numero_documento || "").replace(/\D/g, "");
    if ((form.tipo_documento === "CUIT" || form.tipo_documento === "CUIL") && docDigits.length !== 11) {
      openMessage({
        type: "error", title: "Documento inválido",
        text: `El ${form.tipo_documento} debe tener 11 dígitos.`,
      });
      return;
    }

    if (!String(form.razon_social || "").trim()) {
      openMessage({
        type: "error", title: "Campos incompletos",
        text: "La Razón Social es obligatoria.",
      });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        numero_documento: docDigits,
        lista_precios_id: form.lista_precios_id || null
      };

      const isEdit = Boolean(editing && editing.id_cliente);
      const url = isEdit ? `/api/v1/clientes/${editing.id_cliente}` : "/api/v1/clientes";
      const method = isEdit ? "PUT" : "POST";

      const resp = await api(url, { method, body: payload });

      if (!resp?.ok) {
        openMessage({
          type: "error", title: "Error al guardar",
          text: resp?.message || "No se pudo guardar el cliente. Revisá el servidor.",
        });
        return;
      }

      const updatedCliente = resp.cliente;
      setRows((prev) => {
        if (isEdit) {
          return prev.map((r) => (r.id_cliente === updatedCliente.id_cliente ? updatedCliente : r));
        }
        return [...prev, updatedCliente];
      });

      closeForm();
      openMessage({
        type: "success",
        title: isEdit ? "¡Cliente actualizado!" : "¡Cliente registrado!",
        text: `El cliente "${updatedCliente.razon_social}" se guardó correctamente.`,
      });
    } catch (err) {
      openMessage({
        type: "error", title: "❌ Error de red", text: "Ocurrió un error al guardar el cliente.",
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
    if (!deleteTarget?.id_cliente) return;
    try {
      setConfirmDeleteOpen(false);
      const resp = await api(`/api/v1/clientes/${deleteTarget.id_cliente}`, { method: "DELETE" });

      if (!resp?.ok) {
        openMessage({
          type: "error", title: "Error al eliminar",
          text: resp?.message || "No se pudo eliminar el cliente.",
        });
        return;
      }
      
      setRows((prev) => prev.map((r) => r.id_cliente === deleteTarget.id_cliente ? { ...r, estado: false } : r));
      openMessage({
        type: "success", title: "¡Cliente eliminado!",
        text: `El cliente "${deleteTarget.razon_social}" fue desactivado.`,
      });
    } catch (err) {
      openMessage({
        type: "error", title: "❌ Error", text: "Ocurrió un error al eliminar el cliente.",
      });
    } finally {
      setDeleteTarget(null);
    }
  }

  const columns = [
    {
      id: "documento", header: "Documento",
      accessor: (r) => `${r.tipo_documento} ${r.numero_documento}`,
      align: "center", sortable: true, width: "150px",
    },
    {
      id: "razon_social", header: "Razón Social / Nombre",
      accessor: (r) => r.razon_social + (r.nombre_fantasia ? ` (${r.nombre_fantasia})` : ""),
      align: "left", sortable: true,
    },
    {
      id: "contacto", header: "Contacto",
      accessor: (r) => r.telefono || r.email || "-",
      align: "center",
    },
    {
      id: "cta_cte", header: "Cta. Cte.",
      accessor: (r) => r.tiene_cuenta_cte ? "Sí" : "No",
      align: "center", width: "100px",
    },
    {
      id: "acciones", header: "Acciones", align: "center", width: "190px",
      render: (row) => (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => openEdit(row)}
            className="bg-[#0b1a38] text-white px-3 py-1.5 text-xs rounded hover:bg-[#173070]"
          >
            MODIFICAR
          </button>
          <button
            onClick={() => requestDelete(row)}
            className="bg-[#A30000] text-white px-3 py-1.5 text-xs rounded hover:bg-[#7A0000]"
          >
            ELIMINAR
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title="Clientes"
      actions={
        <button
          onClick={openNew}
          className="flex items-center justify-center gap-2 bg-[#0b1a38] text-white px-6 py-2 rounded-full hover:bg-[#102354] transition"
        >
          <Plus size={16} /> Nuevo cliente
        </button>
      }
    >
      <div className="mb-4 max-w-xs">
        <label className="block text-sm font-medium text-[#0b1a38] mb-1">Buscar</label>
        <div className="relative">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            className="w-full rounded-md border border-slate-200 bg-white px-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3a6fd4]"
            placeholder="Nombre / Documento"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading && <p className="mt-2 text-sm text-slate-600">Cargando clientes…</p>}
      {errorMsg && !loading && <p className="mt-2 text-sm text-red-600">{errorMsg}</p>}

      <div className="mt-6">
        <div className="hidden md:block">
          <DataTable
            columns={columns}
            data={filtered}
            zebra={false}
            stickyHeader={true}
            wrapperClass="hp-table-wrapper overflow-y-auto shadow-sm"
            tableClass="w-full text-sm text-center border-collapse"
            theadClass="bg-[#f0f5ff] text-[#0b1a38]"
            rowClass="bg-white hover:bg-[#f0f5ff] border-t border-[#e2e8f0]"
            headerClass="px-4 py-3 font-semibold text-center"
            cellClass="px-4 py-2 text-center"
            enableSort={true}
            enablePagination={false}
          />
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {filtered.length === 0 && (
             <p className="text-center text-gray-500 py-4 text-sm">No se encontraron clientes.</p>
          )}
          {filtered.map((row) => (
            <div key={row.id_cliente} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <h3 className="font-bold text-[#0b1a38] text-base">{row.razon_social}</h3>
              <p className="text-sm text-gray-600 mb-2">{row.tipo_documento}: {row.numero_documento}</p>
              <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => openEdit(row)}
                  className="flex-1 bg-[#0b1a38] text-white text-xs py-2 rounded hover:bg-[#173070]"
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

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title="ABM Clientes"
        size="max-w-2xl"
        footer={
          <div className="flex justify-end gap-4 mt-4">
            <button
              type="button" onClick={closeForm} disabled={saving}
              className="px-6 py-2 rounded-full font-semibold text-[#0b1a38] border border-slate-200 bg-white hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit" form="cliente-form" disabled={saving}
              className="px-6 py-2 rounded-full font-semibold text-white bg-[#0b1a38] hover:bg-[#102354] transition disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        }
      >
        <form id="cliente-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#0b1a38]">Tipo Persona</label>
            <select name="tipo_persona" value={form.tipo_persona} onChange={handleChange} className="border border-slate-200 rounded-md px-3 py-2 text-sm">
              <option value="JURIDICA">Jurídica</option>
              <option value="FISICA">Física</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#0b1a38]">Tipo Documento</label>
            <select name="tipo_documento" value={form.tipo_documento} onChange={handleChange} className="border border-slate-200 rounded-md px-3 py-2 text-sm">
              <option value="CUIT">CUIT</option>
              <option value="CUIL">CUIL</option>
              <option value="DNI">DNI</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#0b1a38]">Número Documento</label>
            <input name="numero_documento" value={form.numero_documento} onChange={handleChange} required className="border border-slate-200 rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#0b1a38]">Razón Social / Nombre</label>
            <input name="razon_social" value={form.razon_social} onChange={handleChange} required className="border border-slate-200 rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#0b1a38]">Nombre de Fantasía</label>
            <input name="nombre_fantasia" value={form.nombre_fantasia} onChange={handleChange} className="border border-slate-200 rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#0b1a38]">Condición IVA</label>
            <select name="condicion_iva" value={form.condicion_iva} onChange={handleChange} className="border border-slate-200 rounded-md px-3 py-2 text-sm">
              <option value="CONSUMIDOR_FINAL">Consumidor Final</option>
              <option value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</option>
              <option value="MONOTRIBUTO">Monotributo</option>
              <option value="EXENTO">Exento</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#0b1a38]">Teléfono</label>
            <input name="telefono" value={form.telefono} onChange={handleChange} className="border border-slate-200 rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#0b1a38]">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="border border-slate-200 rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium text-[#0b1a38]">Dirección</label>
            <input name="direccion" value={form.direccion} onChange={handleChange} className="border border-slate-200 rounded-md px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1 md:col-span-2">
            <label className="text-sm font-medium text-[#0b1a38]">Lista de Precios Asignada</label>
            <select name="lista_precios_id" value={form.lista_precios_id} onChange={handleChange} className="border border-slate-200 rounded-md px-3 py-2 text-sm">
              <option value="">(Ninguna - Precio Base)</option>
              {listas.map(l => (
                 <option key={l.id_lista} value={l.id_lista}>{l.nombre} ({Number(l.porcentaje_variacion) > 0 ? `+${l.porcentaje_variacion}%` : `${l.porcentaje_variacion}%`})</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 md:col-span-2 mt-2">
            <input type="checkbox" id="tiene_cuenta_cte" name="tiene_cuenta_cte" checked={form.tiene_cuenta_cte} onChange={handleChange} className="w-4 h-4" />
            <label htmlFor="tiene_cuenta_cte" className="text-sm font-medium text-[#0b1a38]">Habilitar Cuenta Corriente</label>
          </div>
        </form>
      </Modal>

      {/* Delete / Messages Modals */}
      <Modal
        isOpen={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}
        title="Confirmar eliminación" size="max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setConfirmDeleteOpen(false)} className="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200">Volver</button>
            <button onClick={confirmDelete} className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-700">Sí, eliminar</button>
          </div>
        }
      >
        <p className="text-sm">¿Seguro que querés eliminar al cliente <strong>{deleteTarget?.razon_social}</strong>?</p>
      </Modal>

      <Modal
        isOpen={messageModal.isOpen} onClose={closeMessage}
        title={messageModal.title} size="max-w-md"
        footer={<button onClick={closeMessage} className="px-4 py-2 rounded-md text-white bg-[#0b1a38] hover:bg-[#102354]">Aceptar</button>}
      >
        <p className={`text-sm ${messageModal.type === "success" ? "text-[#1e408f]" : "text-red-700"}`}>{messageModal.text}</p>
      </Modal>

    </PageContainer>
  );
}
