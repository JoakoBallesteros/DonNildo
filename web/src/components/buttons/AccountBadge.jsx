// src/components/buttons/AccountBadge.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccountMe } from "../../services/accountService.mjs";

export default function AccountBadge() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    // 1) Intentar leer del localStorage
    const storedName = localStorage.getItem("dn_user_name");
    const storedRole = localStorage.getItem("dn_role");

    if (storedName || storedRole) {
      setMe({
        nombre: storedName || "Usuario",
        rol: storedRole || "Rol",
      });
      return; // no llama a la api
    }

    // 2) Solo si no hay nada cacheado, pegarle a /account/me
    (async () => {
      try {
        const data = await getAccountMe(); // una sola vez por sesión
        if (!alive) return;
        setMe(data);

        localStorage.setItem("dn_user_name", data?.nombre || "");
        localStorage.setItem("dn_role", data?.rol || "");
      } catch (e) {
        if (alive) setErr(e.message);
        console.error("[AccountBadge] error getAccountMe:", e);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (err) return null;

  return (
    <button
      type="button"
      onClick={() => navigate("/account")}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900"
      title={me ? `${me.nombre} / ${me.rol}` : "Mi perfil"}
    >
      <span className="inline-block w-6 h-6 rounded-full bg-emerald-800 flex-shrink-0" />
      <div className="flex flex-col text-left min-w-0">
        <span className="font-semibold leading-tight break-words">
          {me ? me.nombre : "Usuario"}
        </span>
        <span className="text-sm opacity-80 leading-tight break-words">
          {me ? me.rol : "Rol"}
        </span>
      </div>
    </button>
  );
}
