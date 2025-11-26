import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL || "http://localhost:4000";
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`;
  return withScheme.replace(/\/$/, "");
}

export default function ForgotPassword() {
  const [mail, setMail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();
  const baseUrl = getApiBaseUrl();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!mail) {
      setError("Ingresá tu correo para enviarte el enlace de recuperación.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`${baseUrl}/v1/auth/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mail }),
      });

      const contentType = resp.headers.get("content-type") || "";
      const tryJson = contentType.includes("application/json");
      const data = tryJson ? await resp.json().catch(() => ({})) : {};

      if (!resp.ok) {
        const msg =
          data?.error?.message ||
          data?.message ||
          (resp.status === 404
            ? `Endpoint no encontrado: ${baseUrl}/v1/auth/password/reset`
            : `Error ${resp.status} al enviar el correo`);
        throw new Error(msg);
      }

      setSuccess(
        "Si la cuenta existe, te enviamos un correo con el enlace para restablecer tu contraseña."
      );
    } catch (e) {
      setError(e?.message || "No se pudo enviar el correo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
        {/* Brand */}
        <div className="mb-6 select-none">
          <div className="text-3xl leading-7 font-extrabold text-emerald-900">
            DON<br/>NILDO
          </div>
          <p className="mt-2 text-emerald-900/70 text-sm">
            Recuperá el acceso a tu cuenta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <label className="text-left text-sm text-[#154734] font-medium mb-1">
            Correo
          </label>
          <input
            type="email"
            placeholder="ej: usuario@empresa.com"
            autoComplete="email"
            className="w-full px-3 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#154734]"
            value={mail}
            onChange={(e) => setMail(e.target.value)}
          />

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          {success && <p className="text-green-600 text-sm mb-3">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`bg-[#154734] text-white font-semibold py-2 rounded-md transition w-full ${
              loading ? "opacity-75 cursor-not-allowed" : "hover:bg-[#2c865c]"
            }`}
          >
            {loading ? "Enviando..." : "Enviar enlace de recuperación"}
          </button>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-emerald-900/80 hover:underline"
            >
              ← Volver
            </button>
            <Link to="/login" className="text-[#154734] hover:underline">
              Ir a iniciar sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
