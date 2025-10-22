import { useState } from "react";
import { useNavigate } from "react-router-dom";


export default function LoginForm() {
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

    try {
      const resp = await fetch(`${baseUrl}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: mail, password }),
      });

      if (!resp.ok) {
        const details = await resp.json().catch(() => ({}));
        throw new Error(details?.error || "Credenciales incorrectas");
      }

      const data = await resp.json();

      localStorage.setItem("dn_token", data.token);
      if (data.refreshToken) localStorage.setItem("dn_refresh", data.refreshToken);
      localStorage.setItem("dn_user", JSON.stringify(data.user));

      navigate("/"); // o la ruta que quieras mostrar tras el login
    } catch (err) {
      setError(err.message || "Usuario o contraseña inválidos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full">
      {/* Usuario */}
      <label className="text-left text-sm text-[#154734] font-medium mb-1">
        Usuario
      </label>
      <input
        type="text"
        placeholder="ej: r.acosta"
        className="w-full px-3 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#154734]"
        value={mail}
        onChange={(e) => setMail(e.target.value)}
      />

      {/* Contraseña */}
      <label className="text-left text-sm text-[#154734] font-medium mb-1">
        Contraseña
      </label>
      <input
        type="password"
        placeholder="Contraseña"
        className="w-full px-3 py-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#154734]"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* Recordarme + Olvidé */}
      <div className="flex justify-between items-center mb-6 text-sm">
        <label className="flex items-center gap-1 text-gray-600">
          <input type="checkbox" className="accent-[#154734]" />
          Recordarme
        </label>
        <button
          type="button"
          className="text-[#154734] hover:underline focus:outline-none"
        >
          Olvidé mi contraseña
        </button>
      </div>

      {/* Error */}
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

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

