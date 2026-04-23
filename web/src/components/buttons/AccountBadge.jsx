import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccountMe } from "../../services/accountService.mjs";
import { cn } from "../../lib/utils";

export default function AccountBadge() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getAccountMe();
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
      className={cn(
        "group relative w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300",
        "bg-white/50 hover:bg-white border border-transparent hover:border-[var(--hp-cyan-200)] shadow-sm hover:shadow-md"
      )}
      title={me ? `${me.nombre} / ${me.rol}` : "Mi perfil"}
    >
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-[var(--hp-cyan-400)] to-[var(--hp-navy-500)] rounded-full blur opacity-0 group-hover:opacity-60 transition duration-500" />
        <span
          className="relative flex items-center justify-center w-10 h-10 rounded-full text-white font-bold text-sm bg-gradient-to-br from-[var(--hp-navy-600)] to-[var(--hp-navy-800)] border-2 border-white shadow-sm"
        >
          {me?.nombre ? me.nombre.charAt(0).toUpperCase() : "U"}
        </span>
      </div>
      <div className="flex flex-col text-left min-w-0 flex-1">
        <span className="font-semibold text-[15px] text-[var(--hp-navy-900)] leading-tight truncate group-hover:text-[var(--hp-cyan-600)] transition-colors">
          {me ? me.nombre : "Usuario"}
        </span>
        <span className="text-xs font-medium text-[var(--hp-slate-500)] leading-tight truncate uppercase tracking-wider mt-0.5">
          {me ? me.rol : "Rol"}
        </span>
      </div>
    </button>
  );
}