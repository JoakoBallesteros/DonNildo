// web/src/lib/apiClient.js
import supa from "./supabaseClient";

/**
 * Normaliza una URL/origen (quita trailing slash y agrega https:// si falta).
 * - "dn-api-production.up.railway.app" -> "https://dn-api-production.up.railway.app"
 * - "https://dn-api-production.up.railway.app/" -> "https://dn-api-production.up.railway.app"
 * - "/api" -> "/api"
 */
function normalizeOrigin(raw) {
  const v = (raw || "").trim();
  if (!v) return "";

  if (v.startsWith("/")) return v.replace(/\/+$/, "");

  if (!/^https?:\/\//i.test(v)) return `https://${v}`.replace(/\/+$/, "");

  return v.replace(/\/+$/, "");
}

/**
 * API_BASE queda SIEMPRE con /api al final.
 *
 * Env recomendada:
 *   VITE_API_URL="https://dn-api-production.up.railway.app"
 * (también soporta si por error la dejas con /api)
 */
function buildApiBase() {
  const originRaw = import.meta.env.VITE_API_URL;
  const origin = normalizeOrigin(originRaw) || "http://localhost:4000";

  // si ya termina en /api, no lo dupliques
  if (/\/api\/?$/i.test(origin)) return origin.replace(/\/+$/, "");
  return `${origin}/api`;
}

export const API_BASE = buildApiBase();
console.log("🔧 API_BASE en runtime:", API_BASE);

function toJsonSafe(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Normaliza el path que te pasan.
 * Acepta:
 *  - "ventas?x=1"               -> "/ventas?x=1"
 *  - "/ventas"                  -> "/ventas"
 *  - "/api/ventas"              -> "/ventas"   (para no duplicar)
 *  - "/api/v1/auth/password/reset" -> "/v1/auth/password/reset"
 */
function normalizePath(path) {
  let p = String(path || "").trim();
  if (!p) return "";

  if (!p.startsWith("/")) p = `/${p}`;
  p = p.replace(/^\/api(?=\/|$)/i, ""); // evita /api duplicado

  if (p === "/") p = "";
  return p;
}

/**
 * api(path, opts)
 * - arma URL como: `${API_BASE}${path}`
 * - agrega Authorization Bearer si hay sesión en Supabase
 * - parsea JSON si puede, sino devuelve {}
 */
export async function api(path, opts = {}) {
  const method = String(opts.method || "GET").toUpperCase();
  const isFormData = opts.body instanceof FormData;

  const {
    data: { session } = {},
  } = await supa.auth.getSession();
  const token = session?.access_token;

  const cleanPath = normalizePath(path);
  const url = `${API_BASE}${cleanPath || ""}`;

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
    resp = await fetch(url, {
      ...opts,
      method,
      headers,
      body,
      // si algún día usás cookies, podés activar esto:
      // credentials: "include",
    });
  } catch (e) {
    console.error("❌ Error de red (fetch falló):", e);
    throw new Error(`NETWORK_FAILURE: No se pudo conectar con la API en ${API_BASE}`);
  }

  let text = "";
  try {
    text = await resp.text();
  } catch { /* ignore */ }

  const data = text ? toJsonSafe(text) : null;

  if (!resp.ok) {
    const msg =
      data?.error?.message ||
      data?.message ||
      (text && text.slice(0, 300)) ||
      `HTTP ${resp.status}`;

    throw new Error(`[${method}] ${url} → ${resp.status} ${msg}`);
  }

  return data ?? {};
}

export const apiFetch = api;
export default api;
