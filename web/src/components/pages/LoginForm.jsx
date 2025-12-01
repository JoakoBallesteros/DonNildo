// src/components/pages/LoginForm.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signIn } from "../../services/authService";

export default function LoginForm() {
  const [mail, setMail] = useState(
    () => localStorage.getItem("dn_mail_recordado") || ""
  );
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(
    () => Boolean(localStorage.getItem("dn_mail_recordado"))
  );
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { appUser } = await signIn(mail, password);

      // Guardar datos básicos para el resto de la app (sidebar, home, etc.)
      if (appUser?.rol) {
        localStorage.setItem("dn_role", appUser.rol);
      }
      if (appUser?.nombre) {
        localStorage.setItem("dn_user_name", appUser.nombre);
      }

      // Recordar mail si corresponde
      if (rememberMe) {
        localStorage.setItem("dn_mail_recordado", mail);
      } else {
        localStorage.removeItem("dn_mail_recordado");
      }

      setSuccess("Inicio de sesión exitoso.");
      navigate("/");
    } catch (err) {
      // Si viene de la API con 403 (usuario inactivo / no registrado)
      if (err?.status === 403 && err?.message) {
        setError(err.message);
      } else {
        // Si viene de Supabase (credenciales inválidas)
        setError("Usuario o contraseña inválidos");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full">
      {/* USUARIO */}
      <label className="text-left text-sm text-[#154734] font-medium mb-1">
        Usuario
      </label>
      <input
        type="email"
        placeholder="ej: usuario@empresa.com"
        autoComplete="email"
        className="w-full px-3 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#154734]"
        value={mail}
        onChange={(e) => setMail(e.target.value)}
      />

      {/* CONTRASEÑA */}
      <label className="text-left text-sm text-[#154734] font-medium mb-1">
        Contraseña
      </label>
      <div className="relative mb-4">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Contraseña"
          autoComplete="current-password"
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#154734] pr-10"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* 👁️ Botón para mostrar/ocultar */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
        >
          {showPassword ? (
            // OJO TACHADO
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.7"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3l18 18M10.7 10.7a3 3 0 104.6 4.6M6.7 6.7C4.9 7.9 3.6 9.9 3 12c1.6 4 5.4 7 9 7 1.5 0 3-.4 4.3-1.1M12 5c3.6 0 7.4 3 9 7-.6 1.5-1.5 2.9-2.7 4"
              />
            </svg>
          ) : (
            // OJO ABIERTO
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.7"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.04 12.32c2.34-5.44 6.02-8.32 9.96-8.32 3.94 0 7.61 2.88 9.96 8.32-2.35 5.44-6.02 8.32-9.96 8.32-3.94 0-7.61-2.88-9.96-8.32z"
              />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>

      {/* RECORDAR / OLVIDÉ */}
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

        <Link to="/forgot" className="text-[#154734] hover:underline">
          Olvidé mi contraseña
        </Link>
      </div>

      {/* ERRORES / OK */}
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {success && <p className="text-green-600 text-sm mb-4">{success}</p>}

      {/* BOTÓN */}
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
