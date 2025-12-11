import supa from "./supabaseClient";

const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

console.log("🔧 API_BASE en runtime:", API_BASE);

function toJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function api(path, opts = {}) {
  const {
    data: { session } = {},
  } = await supa.auth.getSession();
  const token = session?.access_token;

  const method = (opts.method || "GET").toUpperCase();
  const isFormData = opts.body instanceof FormData;

  
  let cleanPath = path || "";
  if (!cleanPath.startsWith("/")) cleanPath = `/${cleanPath}`;
  cleanPath = cleanPath.replace(/^\/api(?=\/|$)/, "");
  if (!cleanPath.startsWith("/")) cleanPath = `/${cleanPath}`;
  if (cleanPath === "/") cleanPath = "";

  const url = `${API_BASE}${cleanPath || "/"}`;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {}),
  };

 
  let body = opts.body;
  if (!isFormData && body != null && typeof body === "object") {
    body = JSON.stringify(body);
  }

  let resp;
  try {
    resp = await fetch(url, { ...opts, method, headers, body });
  } catch (e) {
    console.error("❌ Error de Conexión de Red (fetch falló):", e);
    throw new Error(
      "NETWORK_FAILURE: No se pudo establecer conexión con la API de Express en " +
        API_BASE
    );
  }

  let text = "";
  try {
    text = await resp.text();
  } catch {
   
  }

  const data = text ? toJsonSafe(text) : null;

  if (!resp.ok) {
    const msg =
      data?.error?.message || data?.message || text || `HTTP ${resp.status}`;

    if (!resp.status) {
      throw new Error("NETWORK_FAILURE: Falló la conexión con la API.");
    }

    throw new Error(`[${method}] ${url} → ${resp.status} ${msg}`);
  }

  return data ?? {};
}

export const apiFetch = api;
export default api;
