// src/components/pages/LoginForm.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signIn } from "../../services/authService"; // login por SDK Supabase
import { supa } from "../../lib/supabaseClient";

export default function LoginForm() {
  const [mail, setMail] = useState(() => localStorage.getItem("dn_mail_recordado") || "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => Boolean(localStorage.getItem("dn_mail_recordado")));
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await signIn(mail, password);

      // Recuperar el usuario logueado desde supabase
      const { data: { user }, error: userError } = await supa.auth.getUser();
      if (userError) throw userError;

      // Buscar su rol
      const { data: rolData } = await supa
        .from("usuarios")
        .select("id_rol, roles(nombre)")
        .eq("id_auth", user.id)
        .single();

      const roleName = rolData?.roles?.nombre || "";
      localStorage.setItem("dn_role", roleName);

      if (rememberMe) localStorage.setItem("dn_mail_recordado", mail);
      else localStorage.removeItem("dn_mail_recordado");

      navigate("/");
    } catch (err) {
      setError(err?.message || "Usuario o contraseña inválidos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full">
      <label className="text-left text-sm text-[#154734] font-medium mb-1">Usuario</label>
      <input
        type="email"
        placeholder="ej: usuario@empresa.com"
        autoComplete="email"
        className="w-full px-3 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#154734]"
        value={mail}
        onChange={(e) => setMail(e.target.value)}
      />

      <label className="text-left text-sm text-[#154734] font-medium mb-1">Contraseña</label>
      <input
        type="password"
        placeholder="Contraseña"
        autoComplete="current-password"
        className="w-full px-3 py-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#154734]"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

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

        {/* 👉 Link directo a la vista de recuperación */}
        <Link
          to="/forgot"
          className="text-[#154734] hover:underline focus:outline-none"
        >
          Olvidé mi contraseña
        </Link>
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      {success && <p className="text-green-600 text-sm mb-4">{success}</p>}

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
