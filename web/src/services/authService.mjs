// src/services/authService.mjs
import { supa } from "../lib/supabaseClient";
import api from "../lib/apiClient";

// Mantener dn_token sincronizado con la sesión de Supabase
supa.auth.onAuthStateChange((_event, session) => {
  const t = session?.access_token || null;
  if (t) localStorage.setItem("dn_token", t);
  else localStorage.removeItem("dn_token");
});

// Login directo con Supabase + validación en tabla usuarios
export async function signIn(email, password) {
  // 1) Login en Supabase
  const { data, error } = await supa.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    // credenciales inválidas
    throw error;
  }

  // 2) Validar contra la API (estado ACTIVO, etc.)
  try {
    const resp = await api("/v1/auth/touch-session", {
      method: "POST",
    });

    // Devolvemos tanto el user de Supabase como el usuario de la app
    return {
      user: data.user,
      appUser: resp?.usuario || null,
    };
  } catch (e) {
    // Si la API dice que está inactivo / no registrado → cerrar sesión y re-lanzar
    console.warn("[authService] touch-session falló:", e.message);

    try {
      await supa.auth.signOut();
    } finally {
      localStorage.removeItem("dn_token");
      localStorage.removeItem("dn_user");
      localStorage.removeItem("dn_refresh");
      localStorage.removeItem("dn_user_name");
      localStorage.removeItem("dn_role");
      localStorage.removeItem("dn_sidebar_reportes");
      localStorage.removeItem("dn_sidebar_security");
      localStorage.removeItem("dn_sidebar_stock");
      localStorage.removeItem("dn_sidebar_ventas");
      sessionStorage.clear();
    }

    // e viene armado por apiClient con e.status y e.message
    throw e;
  }
}

export async function signOut() {
  try {
    // 1) Auditoría de logout en tu API
    await api("/v1/auth/logout-audit", { method: "POST" });
  } catch (e) {
    console.warn(
      "[authService] No se pudo registrar auditoría de logout:",
      e.message
    );
  }

  try {
    // 2) Cerrar sesión en Supabase
    await supa.auth.signOut();
  } finally {
    // 3) Limpiar TODO lo que use la app.local
    localStorage.removeItem("dn_token");
    localStorage.removeItem("dn_user");
    localStorage.removeItem("dn_refresh");
    localStorage.removeItem("dn_user_name");
    localStorage.removeItem("dn_role");
    localStorage.removeItem("dn_sidebar_reportes");
    localStorage.removeItem("dn_sidebar_security");
    localStorage.removeItem("dn_sidebar_stock");
    localStorage.removeItem("dn_sidebar_ventas");
    sessionStorage.clear();
  }
}
