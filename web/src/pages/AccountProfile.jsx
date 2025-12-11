
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccountMe, updateAccountMe } from "../services/accountService.mjs";

export default function AccountProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    dni: "",
    mail: "",
    rol: "",
  });
  const [original, setOriginal] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await getAccountMe();
        const data = {
          nombre: me?.nombre || "",
          dni: me?.dni || "",
          mail: me?.mail || "",
          rol: me?.rol || "",
        };
        setForm(data);
        setOriginal(data);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasChanges = useMemo(() => {
    if (!original) return false;
    return (
      (form.nombre || "") !== (original.nombre || "") ||
      (form.dni || "") !== (original.dni || "")
    );
  }, [form, original]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!hasChanges || saving) return;
    setErr("");
    setOk("");
    setSaving(true);
    try {
      const updated = await updateAccountMe({
        nombre: form.nombre.trim(),
        dni: form.dni.trim(),
      });
      setOk("Datos guardados ✓");

      localStorage.setItem("dn_user_name", updated?.nombre || form.nombre);
      localStorage.setItem("dn_role", updated?.rol || form.rol);

     
      setTimeout(() => navigate(-1), 800);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Cargando…</div>;

  return (
    <div className="max-w-xl mx-auto p-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 px-3 py-1.5 rounded-md border border-emerald-200 text-emerald-900 hover:bg-emerald-50"
      >
        ← Volver
      </button>

      <h1 className="text-2xl font-bold text-emerald-900 mb-4">Mi perfil</h1>

      {err && (
        <div className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-red-700">
          {err}
        </div>
      )}
      {ok && (
        <div className="mb-3 rounded border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
          {ok}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-emerald-900 mb-1">
            Nombre
          </label>
          <input
            type="text"
            value={form.nombre}
            onChange={(e) =>
              setForm((f) => ({ ...f, nombre: e.target.value }))
            }
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-emerald-900 mb-1">
            DNI
          </label>
          <input
            type="text"
            value={form.dni}
            onChange={(e) => setForm((f) => ({ ...f, dni: e.target.value }))}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={form.mail}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-emerald-900 mb-1">
              Rol
            </label>
            <input
              type="text"
              value={form.rol}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600"
            />
          </div>
        </div>

        <div className="pt-2 flex gap-2">
          <button
            type="submit"
            disabled={!hasChanges || saving}
            className={`px-4 py-2 rounded text-white ${
              !hasChanges || saving
                ? "bg-emerald-700/60 cursor-not-allowed"
                : "bg-emerald-700 hover:bg-emerald-800"
            }`}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded border border-emerald-200 text-emerald-900 hover:bg-emerald-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}


