import { supa } from "../lib/supabaseClient";
import api from "../lib/api";

// Mantener dn_token sincronizado con la sesión de Supabase
supa.auth.onAuthStateChange((_event, session) => {
  const t = session?.access_token || null;
  if (t) localStorage.setItem("dn_token", t);
  else localStorage.removeItem("dn_token");
});

// Login directo con Supabase
export async function signIn(email, password) {
  const { data, error } = await supa.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;

  // Después del login avisamos a la API para auditar
  try {
    await api("/v1/auth/touch-session", {
      method: "POST",
    });
  } catch (e) {
    console.warn(
      "[authService] No se pudo registrar auditoría de login:",
      e.message
    );
  }

  return data.user;
}

export async function signOut() {
  try {
    // 1) Primero auditamos el logout en la API
    await api("/v1/auth/logout-audit", { method: "POST" });
  } catch (e) {
    console.warn("[authService] No se pudo registrar auditoría de logout:", e.message);
  }

  // 2) Después cierro la sesión en Supabase
  await supa.auth.signOut();
}