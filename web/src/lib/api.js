// web/src/lib/api.js
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
  const resp = await fetch(url, { ...opts, method, headers });

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
    throw new Error(`[${method}] ${url} → ${resp.status} ${msg}`);
  }

  // Si no hay body (204) devolvemos objeto vacío
  return data ?? {};
}


export default api;