import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supa } from "../../lib/supabaseClient";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [stage, setStage] = useState("checking"); // checking | ready | done
  const [error, setError] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // 1) Validar el enlace e iniciar sesión temporal para poder cambiar la contraseña
  useEffect(() => {
    const run = async () => {
      try {
        setError(null);

        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          // Nuevo flujo: llega ?code=...
          const { error } = await supa.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (window.location.hash.includes("access_token")) {
          // Flujo clásico: llega #access_token=...
          // En general la sesión ya queda activa; verificamos:
          const { data, error } = await supa.auth.getSession();
          if (error) throw error;
          if (!data?.session) throw new Error("No se pudo validar la sesión.");
        } else {
          throw new Error("Enlace inválido o expirado.");
        }

        setStage("ready");
      } catch (e) {
        console.error(e);
        setError(e?.message || "No se pudo validar el enlace.");
        setStage("ready");
      }
    };
    run();
  }, []);

  // 2) Guardar nueva contraseña
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 8)
      return setError("La contraseña debe tener al menos 8 caracteres.");
    if (password !== confirm) return setError("Las contraseñas no coinciden.");

    const { error } = await supa.auth.updateUser({ password });
    if (error) return setError(error.message);

    setStage("done");
    setTimeout(() => navigate("/login"), 1200);
  };

  return (
    <div className="min-h-screen bg-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
        <div className="mb-6 select-none">
          <div className="text-3xl leading-7 font-extrabold text-emerald-900">
            DON<br/>NILDO
          </div>
          <p className="mt-2 text-emerald-900/70 text-sm">
            Restablecé tu contraseña
          </p>
        </div>

        {stage === "checking" ? (
          <p className="text-sm text-emerald-900/80">Validando enlace…</p>
        ) : stage === "done" ? (
          <p className="text-green-600 text-sm">
            ¡Contraseña actualizada! Redirigiendo al inicio de sesión…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col">
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

            <label className="text-left text-sm text-[#154734] font-medium mb-1">
              Nueva contraseña
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#154734]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <label className="text-left text-sm text-[#154734] font-medium mb-1">
              Confirmar contraseña
            </label>
            <input
              type="password"
              className="w-full px-3 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#154734]"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
            />

            <button
              type="submit"
              className="bg-[#154734] text-white font-semibold py-2 rounded-md transition w-full hover:bg-[#2c865c]"
            >
              Guardar nueva contraseña
            </button>

            <div className="mt-4 text-right text-sm">
              <Link to="/login" className="text-[#154734] hover:underline">
                Volver a iniciar sesión
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
