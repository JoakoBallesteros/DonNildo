const API_BASE =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:4000";

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `Error HTTP ${res.status}`);
    }
    return res.json();
  } catch (e) {
    console.error("❌ Error en fetch:", e);
    throw new Error("No se pudo conectar con el servidor");
  }
}
