
import { api } from "../lib/apiClient";

export async function listarUsuarios(query) {
  const q = query ? `?search=${encodeURIComponent(query)}` : "";
  const { usuarios = [] } = await api(`/v1/usuarios${q}`);
  
  return usuarios.map(u => ({ ...u, rol_nombre: u.roles?.nombre ?? "" }));
}

export const getUsuario = (id) =>
  api(`/v1/usuarios/${id}`);

export const crearUsuario = (payload) =>
  api(`/v1/usuarios`, { method: "POST", body: JSON.stringify(payload) });

export const actualizarUsuario = (id, payload) =>
  api(`/v1/usuarios/${id}`, { method: "PUT", body: JSON.stringify(payload) });

export const eliminarUsuario = (id) =>
  api(`/v1/usuarios/${id}`, { method: "DELETE" });

export async function listarRoles() {
  const { roles = [] } = await api(`/v1/roles`);
  return roles;
}
