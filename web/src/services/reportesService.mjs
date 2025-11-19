import api from "../lib/apiClient.js";

function mapReporte(r) {
  return {
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
    _raw: r
  };
}

export async function listarReportes() {
  const data = await api("/api/reportes");
  return (data?.reportes || []).map(mapReporte);
}

export async function crearReporte(payload) {
  try {
    const data = await api("/api/reportes", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    // El backend retorna: { success: true, reporte: {...} }
    if (!data?.reporte) {
      throw new Error("Respuesta inválida del servidor: falta 'reporte'.");
    }

    return data.reporte;

  } catch (err) {

    // Extraer mensaje limpio si proviene de api.js
    let msg = err.message || "Error creando reporte.";

    // Limpieza del formato que agrega api.js:
    // ej: "[POST] http://localhost:4000/api/reportes → 400 SIN_DATOS_REPORTE"
    const match = msg.match(/→\s*\d+\s+(.+)$/);
    if (match) msg = match[1];

    throw new Error(msg);
  }
}

export async function listarProductosPorAmbito(tipo) {
  const data = await api(`/api/reportes/productos?tipo=${tipo}`);
  return data.productos || [];
}

export async function deleteReportes(ids = []) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('No se proporcionaron ids para eliminar.');
  }

  const data = await api('/api/reportes', {
    method: 'DELETE',
    body: JSON.stringify({ ids }),
  });

  // Esperamos { success: true, deleted: n }
  return data;
}
