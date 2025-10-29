// web/src/services/userService.mjs
import { fetchWithAuth } from "../lib/fetchWithAuth.mjs";

const BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

async function request(url, options = {}) {
  // fetchWithAuth ya agrega Authorization y Content-Type (si falta)
  const resp = await fetchWithAuth(url, { method: "GET", ...options });

  let data = {};
  try {
    data = await resp.json();
  } catch {
    // puede no haber body (204, etc.)
  }

  if (!resp.ok) {
    const msg =
      data?.error?.message ||
      data?.error ||
      data?.message ||
      `HTTP ${resp.status}`;
    throw new Error(msg);
  }
  return data;
}

// ===== Usuarios =====
export async function listarUsuarios(query) {
  const url = query
    ? `${BASE}/v1/usuarios?search=${encodeURIComponent(query)}`
    : `${BASE}/v1/usuarios`;
  const { usuarios = [] } = await request(url);
  return usuarios.map(u => ({
    ...u,
    rol_nombre: u.roles?.nombre ?? "", // extrae nombre del rol
  }));;
}

export async function getUsuario(id) {
  return request(`${BASE}/v1/usuarios/${id}`);
}

export async function crearUsuario(payload) {
  return request(`${BASE}/v1/usuarios`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function actualizarUsuario(id, payload) {
  return request(`${BASE}/v1/usuarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function eliminarUsuario(id) {
  // Obtener sesión actual o refrescarla automáticamente
  const { data, error } = await supa.auth.getSession();

  if (error || !data?.session) {
    throw new Error("Sesión expirada. Volvé a iniciar sesión.");
  }

  const token = data.session.access_token;

  const resp = await fetch(`${BASE}/v1/usuarios/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    const msg =
      typeof data.error === "object"
        ? data.error.message || JSON.stringify(data.error)
        : data.error || `Error ${resp.status}`;
    throw new Error(msg);
  }

  return resp.json().catch(() => ({ success: true }));
}

// ===== Roles =====
export async function listarRoles() {
  const { roles = [] } = await request(`${BASE}/v1/roles`);
  return roles;
}