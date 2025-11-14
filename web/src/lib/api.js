import supa from "./supabaseClient";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

function toJsonSafe(text) {
  try { return JSON.parse(text); } catch { return null; }
}

export async function api(path, opts = {}) {
  // 1) Sesión actual (refresca solos los tokens)
  const { data: { session } = {} } = await supa.auth.getSession();
  const token = session?.access_token;

  const method = (opts.method || "GET").toUpperCase();
  const isFormData = opts.body instanceof FormData;

  // 2) Headers (si es FormData NO seteamos Content-Type)
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  };

  // 3) Request
  const url = `${API_BASE}${path}`;
  let resp; // <- Aseguramos que resp está declarada antes del bloque try/catch

  // 💡 FIX: Capturamos errores de red/conexión aquí
  try {
      resp = await fetch(url, { ...opts, method, headers });
  } catch (e) {
      console.error("❌ Error de Conexión de Red (fetch falló):", e);
      // Lanzamos un error útil que el frontend puede mostrar
      throw new Error("NETWORK_FAILURE: No se pudo establecer conexión con la API de Express en " + API_BASE);
  }
  // 💡 FIN FIX

  // 4) Leer como texto y luego intentar JSON
  let text = "";
  try { text = await resp.text(); } catch { /* empty */ }

  const data = text ? toJsonSafe(text) : null;

  // 5) Manejo de error uniforme
  if (!resp.ok) {
    const msg =
      data?.error?.message ||
      data?.message ||
      text ||
      `HTTP ${resp.status}`;
    
    // Si el error es una falla de red que el catch no capturó
    if (!resp.status) {
        throw new Error("NETWORK_FAILURE: Falló la conexión con la API.");
    }
    
    throw new Error(`[${method}] ${url} → ${resp.status} ${msg}`);
  }

  // Si no hay body (204) devolvemos objeto vacío
  return data ?? {};
}

export default api;