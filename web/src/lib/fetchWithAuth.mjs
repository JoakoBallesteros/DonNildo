// web/src/lib/fetchWithAuth.mjs
import supa from "./supabaseClient.js";

export async function fetchWithAuth(input, init = {}) {
  const { data, error } = await supa.auth.getSession();
  console.log("[fetchWithAuth] session?", !!data?.session);
  if (error || !data?.session) {
    try {
      await supa.auth.signOut();
    } catch {}
    throw new Error("NO_SESSION");
  }

  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${data.session.access_token}`);

  return fetch(input, { ...init, headers, cache: "no-store" });
}
