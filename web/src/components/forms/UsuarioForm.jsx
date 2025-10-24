import { useEffect, useState } from "react";

export default function UsuarioForm({ initial = {}, roles = [], onSubmit, onCancel }) {
  const [dni, setDni] = useState(initial.dni ?? "");
  const [nombre, setNombre] = useState(initial.nombre ?? "");
  const [mail, setMail] = useState(initial.mail ?? "");
  const [idRol, setIdRol] = useState(initial.id_rol ?? (roles[0]?.id_rol ?? ""));
  const [activo, setActivo] = useState((initial.estado ?? "ACTIVO") === "ACTIVO");
  const [errors, setErrors] = useState({});

  useEffect(() => { if (!idRol && roles.length) setIdRol(roles[0].id_rol); }, [roles]);

  const validar = () => {
    const e = {};
    if (!dni.trim()) e.dni = "DNI requerido";
    if (!nombre.trim()) e.nombre = "Nombre requerido";
    if (!mail.trim()) e.mail = "Email requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) e.mail = "Email inválido";
    if (!idRol) e.id_rol = "Seleccione un rol";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const guardar = () => {
    if (!validar()) return;
    onSubmit?.({
      id_usuario: initial.id_usuario,
      dni: dni.trim(),
      nombre: nombre.trim(),
      mail: mail.trim(),
      id_rol: Number(idRol),
      estado: activo ? "ACTIVO" : "INACTIVO",
    });
  };

  return (
    <div className="space-y-4">
      {/* DNI / Nombre */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-semibold text-[#154734] mb-1 block">DNI</label>
          <input className={`w-full rounded-md border px-3 py-2 ${errors.dni ? "border-red-300" : "border-[#d8e4df]"}`}
                 value={dni} onChange={e=>{ setDni(e.target.value); if(errors.dni) setErrors(x=>({...x,dni:undefined})); }}/>
          {errors.dni && <p className="text-xs text-red-600 mt-1">{errors.dni}</p>}
        </div>

        <div>
          <label className="text-sm font-semibold text-[#154734] mb-1 block">Nombre</label>
          <input className={`w-full rounded-md border px-3 py-2 ${errors.nombre ? "border-red-300" : "border-[#d8e4df]"}`}
                 value={nombre} onChange={e=>{ setNombre(e.target.value); if(errors.nombre) setErrors(x=>({...x,nombre:undefined})); }}/>
          {errors.nombre && <p className="text-xs text-red-600 mt-1">{errors.nombre}</p>}
        </div>

        {/* Email / Rol */}
        <div>
          <label className="text-sm font-semibold text-[#154734] mb-1 block">E-Mail</label>
          <input type="email"
                 className={`w-full rounded-md border px-3 py-2 ${errors.mail ? "border-red-300" : "border-[#d8e4df]"}`}
                 value={mail} onChange={e=>{ setMail(e.target.value); if(errors.mail) setErrors(x=>({...x,mail:undefined})); }}/>
          {errors.mail && <p className="text-xs text-red-600 mt-1">{errors.mail}</p>}
        </div>

        <div>
          <label className="text-sm font-semibold text-[#154734] mb-1 block">Rol</label>
          <select className={`w-full rounded-md border px-3 py-2 ${errors.id_rol ? "border-red-300" : "border-[#d8e4df]"}`}
                  value={idRol} onChange={e=>setIdRol(e.target.value)}>
            {roles.map(r => <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>)}
          </select>
          {errors.id_rol && <p className="text-xs text-red-600 mt-1">{errors.id_rol}</p>}

          <div className="mt-3 flex items-center gap-2">
            <input id="activo" type="checkbox" checked={activo} onChange={e=>setActivo(e.target.checked)} />
            <label htmlFor="activo">Activo</label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-md border border-[#d8e4df] text-[#154734] bg-white">
          Cancelar
        </button>
        <button onClick={guardar} className="px-5 py-2 rounded-md text-white bg-[#154734] hover:bg-[#103a2b]">
          Guardar
        </button>
      </div>
    </div>
  );
}
