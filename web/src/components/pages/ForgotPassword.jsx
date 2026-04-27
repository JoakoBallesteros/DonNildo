// web/src/components/pages/ForgotPassword.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../img/LogoHydroPack.png";

function getApiOrigin() {
  const raw = import.meta.env.VITE_API_URL?.trim();

  // Dev fallback
  if (!raw) return "http://localhost:4000";

  // Si te pasan solo el host (dn-api-production.up.railway.app)
  if (!/^https?:\/\//i.test(raw) && !raw.startsWith("/")) {
    return `https://${raw}`.replace(/\/$/, "");
  }

  // Si es URL absoluta
  if (/^https?:\/\//i.test(raw)) return raw.replace(/\/$/, "");

  // Si es relativa (raro en tu caso, pero por las dudas)
  if (raw.startsWith("/")) return raw.replace(/\/$/, "");

  return raw.replace(/\/$/, "");
}

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [mail, setMail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [resendIn, setResendIn] = useState(0);

  const apiOrigin = getApiOrigin();

  useEffect(() => {
    if (!resendIn) return;
    const id = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (resendIn > 0 || loading) return;

    setError(null);
    setSuccess(null);

    const email = (mail || "").trim();
    if (!email) {
      setError("Ingresá tu correo para enviarte el enlace de recuperación.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`${apiOrigin}/api/v1/auth/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const contentType = resp.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await resp.json().catch(() => ({}))
        : {};

      if (!resp.ok) {
        const msg =
          data?.message ||
          (resp.status === 429
            ? "Demasiados intentos. Probá nuevamente en un minuto."
            : "No se pudo enviar el correo.");

        if (resp.status === 429 || (msg || "").toLowerCase().includes("limit")) {
          setResendIn(60);
        }
        throw new Error(msg);
      }

      setSuccess(
        "Si la cuenta existe, te enviamos un correo con el enlace para restablecer tu contraseña."
      );
      setResendIn(60);
    } catch (err) {
      setError(err?.message || "No se pudo enviar el correo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #060d1f 0%, #0b1a38 40%, #102354 100%)' }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-blue-100 p-6">
        <div className="mb-6 select-none flex flex-col items-center">
          <img src={logo} alt="HydroPack" className="w-16 h-16 object-contain mb-3" />
          <div className="text-2xl font-extrabold text-[#0b1a38]" style={{ fontFamily: 'Syne, sans-serif' }}>
            HydroPack
          </div>
          <p className="mt-1 text-slate-500 text-sm">
            Recuperá el acceso a tu cuenta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <label className="text-left text-sm text-[#0b1a38] font-medium mb-1">
            Correo
          </label>
          <input
            type="email"
            placeholder="ej: usuario@empresa.com"
            autoComplete="email"
            className="w-full px-3 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e3a6e]"
            value={mail}
            onChange={(e) => setMail(e.target.value)}
          />

          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          {success && <p className="text-[#06b6d4] text-sm mb-3">{success}</p>}

          <button
            type="submit"
            disabled={loading || resendIn > 0}
            className={`bg-[#0b1a38] text-white font-semibold py-2 rounded-md transition w-full ${
              loading || resendIn > 0
                ? "opacity-75 cursor-not-allowed"
                : "hover:bg-[#1e3a6e]"
            }`}
          >
            {loading
              ? "Enviando…"
              : resendIn > 0
              ? `Reenviar en ${resendIn}s`
              : "Enviar enlace de recuperación"}
          </button>

          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-slate-500 hover:underline"
            >
              ← Volver
            </button>
            <Link to="/login" className="text-[#1e3a6e] hover:underline">
              Ir a iniciar sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
