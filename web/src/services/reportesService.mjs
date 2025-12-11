import api from "../lib/apiClient.js";

export async function listarReportes() {
  const data = await api("/api/reportes");

  return (data?.reportes || []).map(r => ({
    id_reporte: r.id_reporte,
    id: r.codigo,
    tipo: r.tipo,
    producto: r.producto,
    fechaGen: r.fecha_generacion?.slice(0, 10),
    desde: r.fecha_desde,
    hasta: r.fecha_hasta,
    cantidadUnidad: r.cantidad_unidad,
    cantidadDinero: Number(r.monto_total),
    seleccionado: false,
    _raw: r,
  }));
}

export async function crearReporte(payload) {
  try {
    const data = await api("/api/reportes", {
      method: "POST",
      body: JSON.stringify(payload),
    });

        console.log(" POST RAW RESPONSE:", data);

    if (!data?.reporte) {
      console.log("RESPUESTA DEL SERVIDOR:", data); 
      throw new Error("Respuesta inválida del servidor: falta 'reporte'.");
    }

    const r = data.reporte;

    return {
      id_reporte: r.id_reporte,
      id: r.codigo,        
      codigo: r.codigo,    
      tipo: r.tipo,
      producto: r.producto,
      fechaGen: r.fecha_generacion?.slice(0, 10),
      desde: r.fecha_desde,
      hasta: r.fecha_hasta,
      cantidadUnidad: r.cantidad_unidad,
      cantidadDinero: Number(r.monto_total),
      seleccionado: false,
      _raw: r
    };

  } catch (err) {
    let msg = err.message || "Error creando reporte.";
    const match = msg.match(/→\s*\d+\s+(.+)$/);
    if (match) msg = match[1];

    throw new Error(msg);
  }
}
export async function listarProductosPorAmbito(tipo) {
  const data = await api(`/api/reportes/productos?tipo=${tipo}`);
  return data.productos || [];
}

export async function deleteReportes(ids) {
  const data = await api("/api/reportes", {
    method: "DELETE",
    body: JSON.stringify({ ids }),
  });
  return data;
}