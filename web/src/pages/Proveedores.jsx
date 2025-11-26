import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../lib/apiClient";

/* Layout */
import PageContainer from "../components/pages/PageContainer.jsx";
/* Tabla genérica */
import DataTable from "../components/tables/DataTable.jsx";
/* Modal genérico */
import Modal from "../components/modals/Modals.jsx";

/* =======================
 * Helpers
 * ======================= */

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

// Formatea CUIT como XX-XXXXXXXX-X mientras el usuario escribe
function formatCuit(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 11); // solo números, máx 11

  if (digits.length <= 2) return digits;
  if (digits.length <= 10) {
    // 2 dígitos + guion + resto
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }
  // 11 dígitos: 2 - 8 - 1
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
}

export default function Proveedores() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [search, setSearch] = useState("");

  // modal ABM
  const [isFormOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null); // proveedor en edición o null
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  /* =======================
   * Carga inicial
   * ======================= */
  useEffect(() => {
    async function fetchProveedores() {
      try {
        setLoading(true);
        setErrorMsg("");

        const resp = await api("/api/proveedores");
        if (!resp?.ok || !Array.isArray(resp.proveedores)) {
          console.warn("Respuesta inesperada en GET /api/proveedores:", resp);
          setRows([]);
          return;
        }

        const mapped = resp.proveedores.map(mapProveedorFromApi);
        setRows(mapped);
      } catch (err) {
        console.error("Error cargando proveedores:", err);
        setErrorMsg(
          "No se pudieron cargar los proveedores desde el servidor."
        );
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProveedores();
  }, []);

  /* =======================
   * Filtro buscar
   * ======================= */
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.cuit.toLowerCase().includes(q) ||
        r.nombre.toLowerCase().includes(q)
    );
  }, [rows, search]);

  /* =======================
   * Handlers ABM
   * ======================= */

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

    // validación simple de CUIT: 11 dígitos
    const cuitDigits = form.cuit.replace(/\D/g, "");
    if (cuitDigits.length !== 11) {
      alert("El CUIT debe tener 11 dígitos (formato XX-XXXXXXXX-X).");
      return;
    }

    if (!form.cuit.trim() || !form.nombre.trim()) return;

    try {
      setSaving(true);

      const payload = {
        cuit: form.cuit.trim(),
        nombre: form.nombre.trim(),
        contacto: form.contacto.trim(),
        direccion: form.direccion.trim(),
      };

      const isEdit = Boolean(editing && editing.id);
      const url = isEdit
        ? `/api/proveedores/${editing.id}`
        : "/api/proveedores";
      const method = isEdit ? "PUT" : "POST";

      const resp = await api(url, { method, body: payload });

      if (!resp?.ok) {
        console.error("Error guardando proveedor:", resp);
        alert(
          resp?.message ||
            "No se pudo guardar el proveedor. Revisá el servidor."
        );
        return;
      }

      let updatedProveedor;
      if (resp.proveedor) {
        updatedProveedor = mapProveedorFromApi(resp.proveedor);
      } else {
        // fallback si la API no devuelve el proveedor
        updatedProveedor = {
          id: editing?.id ?? resp.id ?? null,
          ...payload,
        };
      }

      setRows((prev) => {
        if (isEdit) {
          return prev.map((r) =>
            r.id === updatedProveedor.id ? updatedProveedor : r
          );
        }
        return [...prev, updatedProveedor];
      });

      closeForm();
    } catch (err) {
      console.error("Error de red guardando proveedor:", err);
      alert("Ocurrió un error de red al guardar el proveedor.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row) {
    if (
      !window.confirm(
        `¿Seguro que querés eliminar el proveedor ${row.nombre} (${row.cuit})?`
      )
    ) {
      return;
    }

    try {
      const resp = await api(`/api/proveedores/${row.id}`, {
        method: "DELETE",
      });

      if (!resp?.ok) {
        console.error("Error eliminando proveedor:", resp);
        alert(
          resp?.message ||
            "No se pudo eliminar el proveedor. Revisá el servidor."
        );
        return;
      }

      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      console.error("Error de red eliminando proveedor:", err);
      alert("Ocurrió un error de red al eliminar el proveedor.");
    }
  }

  /* =======================
   * Columnas tabla
   * ======================= */

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
            onClick={() => handleDelete(row)}
            className="bg-[#A30000] text-white px-4 py-1.5 text-xs rounded-md hover:bg-[#7A0000]"
          >
            ELIMINAR
          </button>
        </div>
      ),
    },
  ];

  /* =======================
   * Render
   * ======================= */

  return (
    <PageContainer
      title="Proveedores"
      actions={
        <button
          onClick={openNew}
          className="flex items-center justify-center gap-2 bg-[#176c3f] text-white px-6 py-2 rounded-full hover:bg-[#125434] transition"
        >
          <Plus size={16} /> Nuevo proveedor
        </button>
      }
    >
      {/* Buscador */}
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

      {/* Mensajes de estado */}
      {loading && (
        <p className="mt-2 text-sm text-slate-600">Cargando proveedores…</p>
      )}
      {errorMsg && !loading && (
        <p className="mt-2 text-sm text-red-600">{errorMsg}</p>
      )}

      {/* Tabla */}
      <div className="mt-6">
        <DataTable
          columns={columns}
          data={filtered}
          zebra={false}
          stickyHeader={true}
          wrapperClass="max-h-[415px] overflow-y-auto shadow-sm"
          tableClass="w-full text-sm text-center border-collapse"
          theadClass="bg-[#e8f4ef] text-[#154734]"
          rowClass="bg-white hover:bg-[#f6faf7] border-t border-[#edf2ef]"
          headerClass="px-4 py-3 font-semibold text-center"
          cellClass="px-4 py-2 text-center"
          enableSort={true}
          enablePagination={false}
        />
      </div>

      {/* Modal ABM Proveedores */}
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
              className="px-6 py-2 rounded-full font-semibold text-white bg-[#176c3f] hover:bg-[#125434] transition disabled:opacity-60"
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
            <label className="text-sm font-medium text-[#154734]">
              Contacto
            </label>
            <input
              name="contacto"
              value={form.contacto}
              onChange={handleChange}
              className="border border-slate-200 rounded-md px-3 py-2 text-sm"
              placeholder="Teléfono o email"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#154734]">
              Dirección
            </label>
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
    </PageContainer>
  );
}
