import supa from "./supabaseClient";

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000")
  .replace(/\/$/, "");

// Intenta parsear JSON de forma segura
function toJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function api(path, opts = {}) {
  const { data: { session } = {} } = await supa.auth.getSession();
  const token = session?.access_token;

  const method = (opts.method || "GET").toUpperCase();
  const isFormData = opts.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {})
  };

  const url = `${API_BASE}${path}`;
  let resp;

  try {
    resp = await fetch(url, {
      ...opts,
      method,
      headers
    });
  } catch (e) {
    console.error("❌ Error de red:", e);
    return Promise.reject(new Error("NETWORK_FAILURE: No se pudo conectar con el servidor."));
  }

  let text = "";
  try { text = await resp.text();

  } catch (err) {
  // Ignorar error, pero evitar catch vacío
  console.warn("No se pudo leer el cuerpo de la respuesta:", err);
}
  const data = text ? toJsonSafe(text) : null;

  if (!resp.ok) {
    const errMsg =
      data?.error?.message ||
      data?.message ||
      text ||
      `HTTP ${resp.status}`;

    return Promise.reject(new Error(errMsg));
  }

  return data ?? {};
}

export default api;
