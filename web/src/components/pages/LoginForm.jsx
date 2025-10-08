import { useState } from "react";
import { login } from "web/src/services/api.js";


export default function LoginForm() {
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(mail, password);
      // redirigir o mostrar dashboard
    } catch (e) {
      setError("Usuario o contraseña inválidos" + e);
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
        className="bg-[#154734] hover:bg-[#2c865c] text-white font-semibold py-2 rounded-md transition w-full"
      >
        Iniciar sesión
      </button>
    </form>
  );
}

