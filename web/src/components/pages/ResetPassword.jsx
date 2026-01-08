import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import supa from "../../lib/supabaseClient";

function hashParams() {
  const raw = (window.location.hash || "").replace(/^#/, "");
  return new URLSearchParams(raw);
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [stage, setStage] = useState("checking");
  const [error, setError] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        setError(null);

        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        // 0) Errores que vuelven en el hash (ej otp_expired)
        const hp = hashParams();
        const errCode = hp.get("error_code");
        const errDesc = hp.get("error_description");
        if (errCode) {
          throw new Error(
            decodeURIComponent(errDesc || "") ||
              `Link inválido (${errCode}).`
          );
        }

        // 1) PKCE flow (code)
        if (code) {
          const { error } = await supa.auth.exchangeCodeForSession(code);
          if (error) throw error;
          window.history.replaceState({}, "", url.pathname);
          setStage("ready");
          return;
        }

        // 2) OTP flow (token_hash/type)
        const tokenHash = url.searchParams.get("token_hash") || url.searchParams.get("token");
        const type = url.searchParams.get("type");
        if (tokenHash && type) {
          const { error } = await supa.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });
          if (error) throw error;
          window.history.replaceState({}, "", url.pathname);
          setStage("ready");
          return;
        }

        // 3) Implicit hash access_token
        if ((window.location.hash || "").includes("access_token")) {
          const { data, error } = await supa.auth.getSession();
          if (error) throw error;
          if (!data?.session) throw new Error("No se pudo validar la sesión.");
          setStage("ready");
          return;
        }

        // 4) Sesión ya existente
        const { data } = await supa.auth.getSession();
        if (data?.session) {
          setStage("ready");
          return;
        }

        throw new Error("Enlace inválido o expirado.");
      } catch (e) {
        console.error(e);
        setError(e?.message || "No se pudo validar el enlace.");
        setStage("ready");
      }
    };

    run();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!password || password.length < 8) {
      return setError("La contraseña debe tener al menos 8 caracteres.");
    }
    if (password !== confirm) {
      return setError("Las contraseñas no coinciden.");
    }

    const { error } = await supa.auth.updateUser({ password });
    if (error) return setError(error.message);

    await supa.auth.signOut();
    setStage("done");
    setTimeout(() => navigate("/login?reset=ok"), 1200);
  };

  return (
    <div className="min-h-screen bg-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
        <div className="mb-6 select-none">
          <div className="text-3xl leading-7 font-extrabold text-emerald-900">
            DON<br/>NILDO
          </div>
          <p className="mt-2 text-emerald-900/70 text-sm">
            Establecé / restablecé tu contraseña
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
