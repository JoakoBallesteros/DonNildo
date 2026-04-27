import { useEffect, useState } from "react";
import { Plus, DollarSign, Activity } from "lucide-react";

import api from "../lib/apiClient";
import PageContainer from "../components/pages/PageContainer.jsx";
import DataTable from "../components/tables/DataTable.jsx";
import Modal from "../components/modals/Modals.jsx";

const emptyForm = {
  nombre: "",
  descripcion: "",
  porcentaje_variacion: 0,
  moneda: "ARS",
  estado: true
};

export default function ListasPrecios() {
  const [listas, setListas] = useState([]);
  const [dolares, setDolares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDolar, setLoadingDolar] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [isFormOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [messageModal, setMessageModal] = useState({
    isOpen: false, title: "", text: "", type: "success",
  });

  function openMessage({ title, text, type = "success" }) {
    setMessageModal({ isOpen: true, title, text, type });
  }

  const fetchDolar = async () => {
    try {
      setLoadingDolar(true);
      const resp = await api("/api/v1/precios/dolar");
      if (resp.ok) setDolares(resp.dolares || []);
    } catch (e) {
      console.error("Error al obtener dólar:", e);
    } finally {
      setLoadingDolar(false);
    }
  };

  const fetchListas = async () => {
    try {
      setLoading(true);
      const resp = await api("/api/v1/precios/listas");
      if (resp.ok) setListas(resp.listas || []);
    } catch (e) {
      setErrorMsg("No se pudieron cargar las listas de precios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDolar();
    fetchListas();
  }, []);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(row) {
    setEditing(row);
    setForm({
      nombre: row.nombre || "",
      descripcion: row.descripcion || "",
      porcentaje_variacion: row.porcentaje_variacion || 0,
      moneda: row.moneda || "ARS",
      estado: row.estado !== false
    });
    setFormOpen(true);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nombre.trim()) return openMessage({ type: "error", title: "Error", text: "El nombre es obligatorio." });

    try {
      setSaving(true);
      const isEdit = Boolean(editing && editing.id_lista);
      const url = isEdit ? `/api/v1/precios/listas/${editing.id_lista}` : "/api/v1/precios/listas";
      const method = isEdit ? "PUT" : "POST";

      const resp = await api(url, { method, body: form });

      if (!resp?.ok) throw new Error(resp?.message || "Error al guardar");

      const updatedLista = resp.lista;
      setListas((prev) => {
        if (isEdit) return prev.map((r) => (r.id_lista === updatedLista.id_lista ? updatedLista : r));
        return [...prev, updatedLista];
      });

      setFormOpen(false);
      openMessage({
        type: "success",
        title: "¡Éxito!",
        text: `La lista "${updatedLista.nombre}" se guardó correctamente.`,
      });
    } catch (err) {
      openMessage({ type: "error", title: "Error", text: err.message });
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { id: "id_lista", header: "ID", accessor: "id_lista", align: "center", width: "60px" },
    { id: "nombre", header: "Nombre de Lista", accessor: "nombre", align: "left", sortable: true },
    { 
      id: "porcentaje", header: "Recargo/Desc.", align: "center", 
      render: (r) => {
        const p = Number(r.porcentaje_variacion);
        if (p > 0) return <span className="text-red-600 font-semibold">+{p}%</span>;
        if (p < 0) return <span className="text-green-600 font-semibold">{p}%</span>;
        return <span className="text-slate-500">Base (0%)</span>;
      }
    },
    { id: "moneda", header: "Moneda", accessor: "moneda", align: "center" },
    { 
      id: "estado", header: "Estado", align: "center",
      render: (r) => r.estado ? <span className="text-[#1e408f] font-semibold bg-[#f0f5ff] px-2 py-1 rounded">Activa</span> : <span className="text-red-600 font-semibold bg-red-50 px-2 py-1 rounded">Inactiva</span> 
    },
    {
      id: "acciones", header: "Acciones", align: "center", width: "120px",
      render: (row) => (
        <button onClick={() => openEdit(row)} className="bg-[#0b1a38] text-white px-3 py-1.5 text-xs rounded hover:bg-[#173070]">
          MODIFICAR
        </button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Precios y Cotizaciones"
      actions={
        <button onClick={openNew} className="flex items-center gap-2 bg-[#0b1a38] text-white px-6 py-2 rounded-full hover:bg-[#102354] transition">
          <Plus size={16} /> Nueva Lista
        </button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel de Cotizaciones Dólar */}
        <div className="col-span-1 lg:col-span-3 bg-gradient-to-r from-[#0b1a38] to-[#1e408f] rounded-2xl p-6 shadow-md text-white">
          <div className="flex justify-between items-center mb-4 border-b border-blue-800 pb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <DollarSign size={20} className="text-[#06b6d4]" />
              Cotización del Dólar
            </h2>
            <button onClick={fetchDolar} disabled={loadingDolar} className="text-sm text-blue-200 hover:text-white flex items-center gap-1 transition">
              <Activity size={14} /> Actualizar
            </button>
          </div>
          
          {loadingDolar ? (
            <p className="text-blue-200">Cargando cotizaciones...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dolares.map((d, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
                  <p className="text-blue-200 text-sm font-semibold uppercase tracking-wider">{d.nombre}</p>
                  <p className="text-2xl font-bold mt-1 text-[#06b6d4]">
                    ${d.compra} <span className="text-sm text-blue-100">/ ${d.venta}</span>
                  </p>
                  <p className="text-xs text-blue-300 mt-2">Última act: {new Date(d.fechaActualizacion).toLocaleString("es-AR")}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel de Listas de Precios */}
        <div className="col-span-1 lg:col-span-3 mt-4">
          <h2 className="text-[#0b1a38] text-lg font-bold mb-4">Listas de Precios</h2>
          {loading ? (
            <p className="text-sm text-slate-600">Cargando listas...</p>
          ) : errorMsg ? (
            <p className="text-sm text-red-600">{errorMsg}</p>
          ) : (
            <div className="hidden md:block">
              <DataTable
                columns={columns} data={listas} zebra={false} stickyHeader={true}
                wrapperClass="hp-table-wrapper overflow-y-auto shadow-sm"
                tableClass="w-full text-sm text-center border-collapse"
                theadClass="bg-[#f0f5ff] text-[#0b1a38]"
                rowClass="bg-white hover:bg-[#f0f5ff] border-t border-[#e2e8f0]"
                headerClass="px-4 py-3 font-semibold text-center"
                cellClass="px-4 py-2 text-center" enableSort={true} enablePagination={false}
              />
            </div>
          )}

          {/* Mobile view */}
          <div className="md:hidden space-y-3">
             {listas.map((row) => (
               <div key={row.id_lista} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-[#0b1a38] text-base">{row.nombre}</h3>
                    {row.estado ? <span className="text-xs text-[#1e408f] font-semibold bg-[#f0f5ff] px-2 py-0.5 rounded">Activa</span> : <span className="text-xs text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded">Inactiva</span>}
                 </div>
                 <p className="text-sm text-gray-600 mb-2">
                   Variación: <strong className={Number(row.porcentaje_variacion) > 0 ? "text-red-600" : Number(row.porcentaje_variacion) < 0 ? "text-green-600" : "text-slate-500"}>
                     {Number(row.porcentaje_variacion) > 0 ? '+' : ''}{Number(row.porcentaje_variacion)}%
                   </strong> ({row.moneda})
                 </p>
                 <button onClick={() => openEdit(row)} className="w-full bg-[#0b1a38] text-white text-xs py-2 rounded hover:bg-[#173070]">MODIFICAR</button>
               </div>
             ))}
          </div>
        </div>

      </div>

      {/* Modal Form */}
      <Modal isOpen={isFormOpen} onClose={() => setFormOpen(false)} title="ABM Lista de Precios" size="max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setFormOpen(false)} disabled={saving} className="px-4 py-2 rounded-md font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200">Cancelar</button>
            <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 rounded-md font-semibold text-white bg-[#0b1a38] hover:bg-[#102354]">{saving ? "Guardando..." : "Guardar"}</button>
          </div>
        }>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#0b1a38]">Nombre de la Lista</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} required className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-[#0b1a38]" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#0b1a38]">Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-[#0b1a38]" />
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-[#0b1a38]">Porcentaje Variación (%)</label>
              <input type="number" step="0.01" name="porcentaje_variacion" value={form.porcentaje_variacion} onChange={handleChange} required className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-[#0b1a38]" />
              <span className="text-xs text-slate-500">Ej: 15.5 para recargo, -10 para descuento.</span>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-sm font-medium text-[#0b1a38]">Moneda</label>
              <select name="moneda" value={form.moneda} onChange={handleChange} className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-[#0b1a38]">
                <option value="ARS">Pesos (ARS)</option>
                <option value="USD">Dólares (USD)</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="estado" name="estado" checked={form.estado} onChange={handleChange} className="w-4 h-4" />
            <label htmlFor="estado" className="text-sm font-medium text-[#0b1a38]">Lista Activa</label>
          </div>
        </form>
      </Modal>

      <Modal isOpen={messageModal.isOpen} onClose={() => setMessageModal({ isOpen: false })} title={messageModal.title} size="max-w-xs" footer={<button onClick={() => setMessageModal({ isOpen: false })} className="px-4 py-2 bg-[#0b1a38] text-white rounded">Aceptar</button>}>
        <p className="text-sm">{messageModal.text}</p>
      </Modal>
    </PageContainer>
  );
}
