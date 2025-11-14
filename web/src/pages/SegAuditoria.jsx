// web/src/pages/SegAuditoria.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import PageContainer from "../components/pages/PageContainer";
import DataTable from "../components/tables/DataTable";
import api from '../lib/api'; // <-- Importar helper

const TABS = ["Todo","Login/Logout","Compras","Ventas","Stock","Seguridad"];

export default function SegAuditoria() {
  const [q, setQ] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [tab, setTab] = useState("Todo");

  const [rawEvents, setRawEvents] = useState([]); // Estado para eventos sin filtrar
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatFechaHora = (value) => {
    if (!value) return "";

    return new Date(value).toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 💡 FUNCIÓN DE CARGA DE DATOS REALES (Depende de q y tab para recargar)
  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        let queryString = `?q=${q}&tab=${tab === 'Todo' ? '' : tab}`; 
        
        const data = await api(`/api/auditoria${queryString}`);
        setRawEvents(
          data.eventos.map(e => ({
            ...e,
            fechaOriginal: e.fecha,           // ⬅️ crudo de la API
            fecha: formatFechaHora(e.fecha),  // ⬅️ lo que se muestra en la tabla
            usuario: e.usuario || 'N/A'
          }))
        );
    } catch (e) {
        setError(e.message);
    } finally {
        setLoading(false);
    }
  }, [q, tab]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]); 

  // Handlers para filtros y tabs (para recargar al cambiar)
  const handleSetTab = (t) => {
      setTab(t);
      // loadEvents se dispara automáticamente por el cambio de dependencia 'tab'
  };

  const handleSearch = () => {
      // loadEvents se dispara automáticamente por el cambio de dependencia 'q'
  };
   
  // Definición de columnas (sin cambios)
  const cols = useMemo(()=>[
    { id: "id",     header: "ID evento", accessor: "id", width: 120, nowrap: true, sortable: true },
    { id: "tipo",   header: "Tipo", accessor: "tipo", width: 140, sortable: true },
    { id: "fecha",  header: "Fecha/Hora", accessor: "fecha", width: 170, align: "center", nowrap: true, sortable: true },
    { id: "usuario",header: "Usuario", accessor: "usuario", sortable: true },
    { id: "modulo", header: "Módulo", accessor: "modulo", width: 140, sortable: true },
    { id: "ip",     header: "Origen/IP", accessor: "ip", width: 130, align: "center", sortable: true },
    { id: "det",    header: "Detalles", accessor: "detalle" },
  ],[]);

  // 💡 Filtrado por FECHAS (se mantiene en el frontend para simplificar)
  const filtered = useMemo(()=>{
    let out = rawEvents; 
    
    if (desde) out = out.filter(
      x => new Date(x.fechaOriginal) >= new Date(desde)
    );
    if (hasta) out = out.filter(
      x => new Date(x.fechaOriginal) <= new Date(hasta)
    );

    return out;
  }, [desde, hasta, rawEvents]);

  
  return (
    <PageContainer title="Auditoría del Sistema">
      {/* filtros superiores */}
      <div className="bg-white rounded-2xl border border-[#e3e9e5] p-5 md:p-6 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold text-[#154734] mb-1 block">Buscar</label>
            <input
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              // 💡 Disparar la carga al presionar ENTER
              onKeyDown={(e) => { if (e.key === 'Enter') loadEvents(); }} 
              placeholder="Usuario / tipo / id"
              className="w-full border border-[#d8e4df] rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#154734] mb-1 block">Desde</label>
            {/* Mantener filtros en el frontend para refrescar solo el useMemo */}
            <input type="date" value={desde} onChange={(e)=>setDesde(e.target.value)} className="w-full border border-[#d8e4df] rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#154734] mb-1 block">Hasta</label>
            <input type="date" value={hasta} onChange={(e)=>setHasta(e.target.value)} className="w-full border border-[#d8e4df] rounded-md px-3 py-2" />
          </div>
        </div>

        {/* chips módulo */}
        <div className="mt-5 flex gap-2 flex-wrap">
          {TABS.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => handleSetTab(t)} 
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                tab===t ? "bg-[#154734] text-white" : "bg-[#e8f4ef] text-[#154734] hover:bg-[#dbeee6]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Cargando eventos de auditoría...</p>
      ) : error ? (
        <div className="bg-red-100 p-3 rounded text-red-800">Error: {error}</div>
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
    </PageContainer>
  );
}