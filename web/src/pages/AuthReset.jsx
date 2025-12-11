import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";


const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function AuthReset() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

 
  const redirectTo = "/login?reset=ok";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    async function init() {
      if (code) {
      
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError(error.message || "El enlace es inválido o ha expirado.");
        } else {
         
          window.history.replaceState({}, "", window.location.pathname);
        }
        setReady(true);
        return;
      }

     
      const { data } = await supabase.auth.getSession();
      if (data.session) {
       
        setReady(true);
      } else {
        setError("El enlace de restablecimiento no es válido o ha expirado.");
        setReady(true);
      }
    }

    init();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);


    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setLoading(false);
      setError(updateError.message || "No se pudo actualizar la contraseña.");
      return;
    }

    
    await supabase.auth.signOut();

   
    setLoading(false);
    setMessage(
      "¡Contraseña actualizada! Serás redirigido al inicio de sesión en un momento."
    );
    setTimeout(() => {
      window.location.href = redirectTo; 
    }, 1500);
  };

 
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-700">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-4 text-green-800">
          Restablecer contraseña
        </h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        {message && <p className="text-green-700 mb-4">{message}</p>}
        {/* Only show the form if we have no success message yet. */}
        {!message && (
          <form onSubmit={handleSubmit}>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Nueva contraseña
            </label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-green-700"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 text-white font-semibold rounded-lg transition-colors ${
                loading
                  ? "bg-green-700 opacity-70 cursor-not-allowed"
                  : "bg-green-700 hover:bg-green-800"
              }`}
            >
              {loading ? "Guardando…" : "Cambiar contraseña"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
