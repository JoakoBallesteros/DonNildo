import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
  // Cargamos el mail si estaba recordado
  const [mail, setMail] = useState(() => localStorage.getItem("dn_mail_recordado") || "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem("dn_mail_recordado")));
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const resp = await fetch(`${baseUrl}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mail, password }),
      });

      if (!resp.ok) {
        const details = await resp.json().catch(() => ({}));
        // Aseguramos mostrar SIEMPRE un string (evita [object Object])
        throw new Error(details?.error?.message || details?.message || "Usuario o contraseña incorrectos");
      }

      const data = await resp.json();

      // Guardar sesión
      localStorage.setItem("dn_token", data.token);
      if (data.refreshToken) localStorage.setItem("dn_refresh", data.refreshToken);
      localStorage.setItem("dn_user", JSON.stringify(data.user));

      // Recordarme
      if (rememberMe) localStorage.setItem("dn_mail_recordado", mail);
      else localStorage.removeItem("dn_mail_recordado");

      navigate("/");
    } catch (err) {
      setError(err?.message || "Usuario o contraseña inválidos");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setSuccess(null);

    if (!mail) {
      setError("Ingrese su correo para recuperar la contraseña");
      return;
    }

    try {
      const resp = await fetch(`${baseUrl}/v1/auth/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mail }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data?.error?.message || data?.message || "No se pudo enviar el correo");
      }

      // Por seguridad, siempre mismo mensaje público
      setSuccess("Si la cuenta existe, te enviamos un correo para restablecer la contraseña.");
    } catch (e) {
      setError(e?.message || "No se pudo enviar el correo");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full">
      {/* Usuario (email) */}
      <label className="text-left text-sm text-[#154734] font-medium mb-1">Usuario</label>
      <input
        type="email"
        placeholder="ej: usuario@empresa.com"
        autoComplete="email"
        className="w-full px-3 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#154734]"
        value={mail}
        onChange={(e) => setMail(e.target.value)}
      />

      {/* Contraseña */}
      <label className="text-left text-sm text-[#154734] font-medium mb-1">Contraseña</label>
      <input
        type="password"
        placeholder="Contraseña"
        autoComplete="current-password"
        className="w-full px-3 py-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#154734]"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* Recordarme + Olvidé */}
      <div className="flex justify-between items-center mb-6 text-sm">
        <label className="flex items-center gap-1 text-gray-600">
          <input
            type="checkbox"
            className="accent-[#154734]"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          Recordarme
        </label>
        <button
          type="button"
          className="text-[#154734] hover:underline focus:outline-none"
          onClick={handleForgotPassword}
        >
          Olvidé mi contraseña
        </button>
      </div>

      {/* Mensajes */}
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {success && <p className="text-green-600 text-sm mb-4">{success}</p>}

      {/* Botón */}
      <button
        type="submit"
        disabled={loading}
        className={`bg-[#154734] text-white font-semibold py-2 rounded-md transition w-full ${
          loading ? "opacity-75 cursor-not-allowed" : "hover:bg-[#2c865c]"
        }`}
      >
        {loading ? "Iniciando sesión..." : "Iniciar sesión"}
      </button>
    </form>
  );
}

