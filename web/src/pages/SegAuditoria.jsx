import React, { useMemo, useState } from "react";
import PageContainer from "../components/pages/PageContainer";
import DataTable from "../components/tables/DataTable";

const MOCK = [
  { id: "A-1001", tipo: "Login/Logout", fecha: "2025-10-10 09:12", usuario: "john@empresa.com", modulo: "Seguridad", ip: "10.0.0.5", detalle: "LOGIN_OK (2FA)" },
  { id: "A-1002", tipo: "Ventas",       fecha: "2025-10-10 10:02", usuario: "john@empresa.com", modulo: "Ventas",    ip: "10.0.0.5", detalle: "Nueva venta V-0045" },
];

const TABS = ["Todo","Login/Logout","Compras","Ventas","Stock","Seguridad"];

export default function SegAuditoria() {
  const [q, setQ] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [tab, setTab] = useState("Todo");

  const cols = useMemo(()=>[
    { id: "id",     header: "ID evento", accessor: "id", width: 120, nowrap: true, sortable: true },
    { id: "tipo",   header: "Tipo", accessor: "tipo", width: 140, sortable: true },
    { id: "fecha",  header: "Fecha/Hora", accessor: "fecha", width: 170, align: "center", nowrap: true, sortable: true },
    { id: "usuario",header: "Usuario", accessor: "usuario", sortable: true },
    { id: "modulo", header: "Módulo", accessor: "modulo", width: 140, sortable: true },
    { id: "ip",     header: "Origen/IP", accessor: "ip", width: 130, align: "center", sortable: true },
    { id: "det",    header: "Detalles", accessor: "detalle" },
  ],[]);

  const filtered = useMemo(()=>{
    let out = [...MOCK];
    const t = q.trim().toLowerCase();
    if (tab !== "Todo") out = out.filter(x => x.tipo === tab);
    if (t) out = out.filter(x =>
      x.usuario.toLowerCase().includes(t) ||
      x.tipo.toLowerCase().includes(t) ||
      x.id.toLowerCase().includes(t) ||
      x.detalle.toLowerCase().includes(t)
    );
    if (desde) out = out.filter(x => new Date(x.fecha) >= new Date(desde));
    if (hasta) out = out.filter(x => new Date(x.fecha) <= new Date(hasta));
    return out;
  }, [q, desde, hasta, tab]);

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
              placeholder="Usuario / tipo / id"
              className="w-full border border-[#d8e4df] rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#154734] mb-1 block">Desde</label>
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
              onClick={()=>setTab(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                tab===t ? "bg-[#154734] text-white" : "bg-[#e8f4ef] text-[#154734] hover:bg-[#dbeee6]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

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
    </PageContainer>
  );
}
