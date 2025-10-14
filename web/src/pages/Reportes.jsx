import React, { useMemo, useRef, useState } from "react";
import PageContainer from "../components/pages/PageContainer";
import DataTable from "../components/tables/DataTable";
import Modal from "../components/modals/Modals";
import ReportDetail from "../components/modals/DetallesReporte";
import NuevoReporte from "../components/modals/NuevoReporte";

const SEED = [
  {
    id: "R-0001",
    tipo: "Compra",
    usuario: "María",
    fechaGen: "2025-10-01",
    producto: "Cartón",
    desde: "2025-09-25",
    hasta: "2025-10-01",
    cantidadUnidad: 200,
    cantidadDinero: 200 * 7000,
  },
  {
    id: "R-0002",
    tipo: "Venta",
    usuario: "Lucas",
    fechaGen: "2025-10-02",
    producto: "Caja corrugada",
    desde: "2025-10-01",
    hasta: "2025-10-01",
    cantidadUnidad: 50,
    cantidadDinero: 50 * 1200,
  },
  {
    id: "R-0003",
    tipo: "Compra",
    usuario: "Sofía",
    fechaGen: "2025-10-05",
    producto: "Papel Kraft",
    desde: "2025-10-01",
    hasta: "2025-10-05",
    cantidadUnidad: 75,
    cantidadDinero: 75 * 5500,
  },
];

export default function Reportes() {
  const [reportes, setReportes] = useState(SEED);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);
  const [nuevoOpen, setNuevoOpen] = useState(false);

  const tableRef = useRef(null);

  const nextId = () => {
    const nums = reportes.map((r) => Number(r.id.replace(/\D/g, "")) || 0);
    const n = (Math.max(0, ...nums) + 1).toString().padStart(4, "0");
    return `R-${n}`;
  };

  const crearReporte = ({ ambito, producto, desde, hasta }) => {
    // (opcional) prevenir duplicado exacto
    const dup = reportes.some(
      (r) =>
        r.tipo === (ambito === "Compras" ? "Compra" : "Venta") &&
        r.producto.toLowerCase() === producto.toLowerCase() &&
        r.desde === desde &&
        r.hasta === hasta
    );
    if (dup) {
      alert("Ya existe un reporte con esos parámetros.");
      return;
    }

    const nuevo = {
      id: nextId(),
      tipo: ambito === "Compras" ? "Compra" : "Venta",
      usuario: "UsuarioActual",
      fechaGen: new Date().toISOString().slice(0, 10),
      producto,
      desde,
      hasta,
      cantidadUnidad: 0, // mock
      cantidadDinero: 0, // mock
    };
    setReportes((prev) => [nuevo, ...prev]);
    setTimeout(
      () =>
        tableRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      0
    );
  };

  const columns = useMemo(
    () => [
      {
        id: "id",
        header: "Id",
        accessor: "id",
        width: 120,
        nowrap: true,
        sortable: true,
      },
      {
        id: "tipo",
        header: "Tipo",
        accessor: "tipo",
        width: 120,
        sortable: true,
      },
      {
        id: "usuario",
        header: "Usuario",
        accessor: "usuario",
        width: 160,
        sortable: true,
      },
      {
        id: "fecha",
        header: "Fecha generación",
        accessor: "fechaGen",
        width: 150,
        align: "center",
        nowrap: true,
        sortable: true,
      },
      {
        id: "detalle",
        header: "Detalle",
        align: "center",
        width: 130,
        render: (row) => (
          <button
            onClick={() => {
              setDetailRow(row);
              setDetailOpen(true);
            }}
            className="border border-[#d8e4df] rounded-md px-4 py-1.5 text-[#154734] hover:bg-[#e8f4ef] transition"
          >
            Ver Detalle
          </button>
        ),
      },
      {
        id: "producto",
        header: "Producto",
        accessor: "producto",
        sortable: true,
      },
    ],
    []
  );

  return (
    <PageContainer title="Reportes">
      {/* Header con acción */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setNuevoOpen(true)}
          className="px-4 py-2 rounded-xl text-white bg-[#154734] hover:bg-[#103a2b]"
        >
          Nuevo reporte
        </button>
      </div>

      {/* Tabla (mismos estilos y props) */}
      <div ref={tableRef}>
        <DataTable
          columns={columns}
          data={reportes}
          zebra={false}
          stickyHeader={false}
          tableClass="w-full text-sm text-left border-collapse table-fixed"
          theadClass="bg-[#e8f4ef] text-[#154734]"
          rowClass="hover:bg-[#f6faf7] border-t border-[#edf2ef]"
          headerClass="px-4 py-3 font-semibold border-r border-[#e3e9e5] last:border-none select-none"
          cellClass="px-4 py-4 border-r border-[#edf2ef] last:border-none"
          enableSort
        />
      </div>

      {/* Acciones inferiores (mock) */}
      <div className="mt-6 flex items-center gap-2 justify-end">
        <button className="rounded-full bg-[#0f7a4e] text-white px-6 py-3 hover:bg-[#0d6843]">
          Imprimir seleccionados
        </button>
        <button className="rounded-full bg-[#0f7a4e] text-white px-6 py-3 hover:bg-[#0d6843]">
          Exportar seleccionados a PDF
        </button>
      </div>

      {/* Modal detalle */}
      {detailOpen && (
        <Modal
          isOpen={detailOpen}
          onClose={() => setDetailOpen(false)}
          title=""
          size="max-w-lg"
        >
          <ReportDetail
            title={detailRow ? `Detalle_${detailRow.id}` : "Detalle"}
            data={detailRow || {}}
          />
        </Modal>
      )}

      {/* Modal nuevo reporte */}
      {nuevoOpen && (
        <NuevoReporte
          isOpen={nuevoOpen}
          onClose={() => setNuevoOpen(false)}
          onCreate={crearReporte}
        />
      )}
    </PageContainer>
  );
}
