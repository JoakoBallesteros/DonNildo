import { useState } from "react";
import { login } from "../services/api";

export default function LoginForm() {
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(mail, password);
      // redireccionar o mostrar dashboard
    } catch (e) {
      setError("Usuario o contraseña inválidos");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <input
        type="text"
        placeholder="ej: r.acosta"
        className="w-full px-3 py-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e4b37]"
        value={mail}
        onChange={(e) => setMail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Contraseña"
        className="w-full px-3 py-2 mb-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e4b37]"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      <button
        type="submit"
        className="bg-[#1e4b37] hover:bg-[#27624a] text-white py-2 rounded-md font-semibold transition"
      >
        Iniciar sesión
      </button>
    </form>
  );
}
