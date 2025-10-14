// src/components/forms/ProductFormTabs.jsx
import React, { useEffect, useState } from "react";

export default function ProductFormTabs({
  mode = "create",
  initialValues = {
    tipo: "Caja",
    referencia: "",
    categoria: "",
    medidas: { l: "", a: "", h: "" },
    unidad: "u",
    cantidad: "",
    precio: "",
    notas: "",
  },
  lockTipo = false,
  labels = { caja: "Caja", material: "Producto" },
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(initialValues);
  useEffect(() => setForm(initialValues), [initialValues]);

  const setField = (clave, valor) =>
    setForm((prev) => ({ ...prev, [clave]: valor }));

  const setMedida = (nombreMedida, valor) =>
    setForm((prev) => ({
      ...prev,
      medidas: { ...(prev.medidas || {}), [nombreMedida]: valor },
    }));

  const applyTipo = (nuevoTipo) => {
    setForm((prev) => ({
      ...prev,
      tipo: nuevoTipo,
      unidad: nuevoTipo === "Material" ? (prev.unidad === "u" ? "u" : "kg") : "u",
      categoria: nuevoTipo === "Caja" ? prev.categoria : "",
      medidas:
        nuevoTipo === "Caja"
          ? (prev.medidas || { l: "", a: "", h: "" })
          : { l: "", a: "", h: "" },
    }));
  };

  const validate = () => {
    if (!form.referencia?.trim()) return "La referencia es obligatoria";
    if (!form.precio && form.precio !== 0) return "El precio es obligatorio";
    if (form.tipo === "Caja") {
      if (!form.categoria) return "Seleccioná la categoría de la caja";
      const { l, a, h } = form.medidas || {};
      if (!l || !a || !h) return "Completá Largo, Ancho y Alto (cm)";
    }
    return null;
  };

  const normalize = (f) => ({
    ...f,
    precio: Number(f.precio || 0),
    cantidad:
      f.cantidad === "" || f.cantidad === null ? undefined : Number(f.cantidad),
    medidas:
      f.tipo === "Caja"
        ? {
            l: Number(f.medidas?.l || 0),
            a: Number(f.medidas?.a || 0),
            h: Number(f.medidas?.h || 0),
          }
        : undefined,
  });

  const submit = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { alert(err); return; }
    onSubmit?.(normalize(form));
  };

  const inputCls =
    "border border-[#d8e4df] rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-[#154734]";
  const areaCls = inputCls;
  const selectCls = inputCls;

  const TabHeader = !lockTipo ? (
    <div className="flex gap-2 mb-6">
      {[
        { key: "Caja", label: labels.caja ?? "Caja" },
        { key: "Material", label: labels.material ?? "Producto" },
      ].map((t) => {
        const active = form.tipo === t.key;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => applyTipo(t.key)}
            className={`h-10 px-6 rounded-full text-[14px] font-semibold transition ${
              active
                ? "bg-[#154734] text-white shadow hover:bg-[#103a2b]"
                : "bg-white text-[#154734] border border-[#cfe4db] hover:bg-[#e8f4ef]"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  ) : null;

  const tabCaja = (
    <div className="space-y-4">
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-[#154734] mb-1">Nombre / Modelo</label>
        <input
          value={form.referencia}
          onChange={(e) => setField("referencia", e.target.value)}
          placeholder="Caja corrugada 40x30x20"
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-[#154734] mb-1">Categoría</label>
          <select
            value={form.categoria}
            onChange={(e) => setField("categoria", e.target.value)}
            className={selectCls}
          >
            <option value="">Seleccionar…</option>
            <option value="Chica">Chica</option>
            <option value="Mediana">Mediana</option>
            <option value="Grande">Grande</option>
          </select>
        </div>

        {["l", "a", "h"].map((k, i) => (
          <div key={k} className="flex flex-col">
            <label className="text-sm font-semibold text-[#154734] mb-1">
              {["Largo (cm)", "Ancho (cm)", "Alto (cm)"][i]}
            </label>
            <input
              type="number"
              min={0}
              value={form.medidas?.[k] ?? ""}
              onChange={(e) => setMedida(k, Number(e.target.value))}
              placeholder={["40", "30", "20"][i]}
              className={inputCls}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col">
        <label className="text-sm font-semibold text-[#154734] mb-1">Precio unitario</label>
        <input
          type="number"
          min={0}
          value={form.precio}
          onChange={(e) => setField("precio", e.target.value)}
          placeholder="Ej: 1200"
          className={inputCls}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-sm font-semibold text-[#154734] mb-1">Notas (opcional)</label>
        <textarea
          value={form.notas}
          onChange={(e) => setField("notas", e.target.value)}
          rows={3}
          className={areaCls}
        />
      </div>
    </div>
  );

  const tabMaterial = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-[#154734] mb-1">Nombre</label>
          <input
            value={form.referencia}
            onChange={(e) => setField("referencia", e.target.value)}
            placeholder="Cartón, Papel Kraft…"
            className={inputCls}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-[#154734] mb-1">Unidad</label>
          <select
            value={form.unidad}
            onChange={(e) => setField("unidad", e.target.value)}
            className={selectCls}
          >
            <option value="kg">kg</option>
            <option value="u">u</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-[#154734] mb-1">
            {form.unidad === "kg" ? "Cantidad (kg) — opcional" : "Cantidad (u) — opcional"}
          </label>
          <input
            type="number"
            min={0}
            value={form.cantidad ?? ""}
            onChange={(e) => setField("cantidad", e.target.value)}
            className={inputCls}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-[#154734] mb-1">
            {form.unidad === "kg" ? "Precio x kg" : "Precio unitario"}
          </label>
          <input
            type="number"
            min={0}
            value={form.precio}
            onChange={(e) => setField("precio", e.target.value)}
            placeholder={form.unidad === "kg" ? "Ej: 7000" : "Ej: 1200"}
            className={inputCls}
          />
        </div>
      </div>

      <div className="flex flex-col">
        <label className="text-sm font-semibold text-[#154734] mb-1">Notas (opcional)</label>
        <textarea
          value={form.notas}
          onChange={(e) => setField("notas", e.target.value)}
          rows={3}
          className={areaCls}
        />
      </div>
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      {!lockTipo ? (
        <>
          {TabHeader}
          <div className="border border-[#e3e9e5] rounded-md bg-white p-4">
            {form.tipo === "Caja" ? tabCaja : tabMaterial}
          </div>
        </>
      ) : (
        <div className="w-full">
          <div className="mb-3">
            <label className="text-sm font-semibold text-[#154734] mb-1">Tipo</label>
            <input
              value={form.tipo}
              readOnly
              className="border border-[#d8e4df] rounded-md px-3 py-2 bg-slate-50"
            />
          </div>
          <div className="border border-[#e3e9e5] rounded-md bg-white p-4">
            {form.tipo === "Caja" ? tabCaja : tabMaterial}
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-center gap-4 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 px-8 rounded-xl border-2 border-[#154734] text-[#154734] font-semibold hover:bg-[#e8f4ef]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="h-12 px-10 rounded-xl bg-[#154734] text-white font-semibold shadow hover:bg-[#103a2b]"
        >
          {mode === "create" ? "Guardar" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
