import React, { useEffect, useState } from "react";
import MessageModal from "../modals/MessageModal";
import Modal from "../modals/Modals";

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
  labels = { caja: "Caja", material: "Material" },
  onSubmit,
  onCancel, 
}) {
  const [form, setForm] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [isCancelConfirmOpen, setCancelConfirmOpen] = useState(false);

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
      unidad:
        nuevoTipo === "Material" ? (prev.unidad === "u" ? "u" : "kg") : "u",
      categoria: nuevoTipo === "Caja" ? prev.categoria : "",
      medidas:
        nuevoTipo === "Caja"
          ? prev.medidas || { l: "", a: "", h: "" }
          : { l: "", a: "", h: "" },
    }));
  };

  const { tipo, medidas } = form;

  useEffect(() => {
    if (tipo !== "Caja") return;

    const { l, a, h } = medidas || {};
    if (!l || !a || !h) return;

    const L = Number(l) || 0;
    const A = Number(a) || 0;
    const H = Number(h) || 0;

    const volumen = L * A * H;
    let cat = "";

    if (volumen <= 3000) cat = "Chica";
    else if (volumen <= 10000) cat = "Mediana";
    else cat = "Grande";

    setForm((prev) =>
      prev.categoria === cat ? prev : { ...prev, categoria: cat }
    );
  }, [tipo, medidas]);

  const validate = () => {
    if (!form.referencia?.trim()) return "La referencia es obligatoria";
    if (!form.precio && form.precio !== 0) return "El precio es obligatorio";
    if (form.tipo === "Caja") {
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

  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    title: "",
    text: "",
    type: "",
  });

  const submit = async (e) => {
    e.preventDefault();
    e.stopPropagation?.();
    if (loading) return;
    setLoading(true);

    const err = validate();
    if (err) {
      setMessageModal({
        isOpen: true,
        title: "Error",
        text: err,
        type: "error",
      });
      setLoading(false);
      return;
    }

    try {
      await onSubmit?.(normalize(form));
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "border border-[#d8e4df] rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-[#154734]";
  const areaCls = inputCls;
  const selectCls = inputCls;

  const TabHeader = !lockTipo ? (
    <div className="flex gap-2 mb-6">
      {[
        { key: "Caja", label: labels.caja ?? "Caja" },
        { key: "Material", label: labels.material ?? "Material" },
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
        <label className="text-sm font-semibold text-[#154734] mb-1">
          Nombre / Modelo
        </label>
        <input
          value={form.referencia}
          onChange={(e) => setField("referencia", e.target.value)}
          placeholder="Caja corrugada"
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-[#154734] mb-1">
            Categoría
          </label>
          <input
            readOnly
            value={form.categoria || ""}
            className="border border-[#d8e4df] rounded-md px-3 py-2 w-full bg-gray-100 text-gray-700"
            placeholder="Se calcula automáticamente"
          />
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
              onChange={(e) =>
                setMedida(k, e.target.value === "" ? "" : Number(e.target.value))
              }
              placeholder={["40", "30", "20"][i]}
              className={inputCls}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-col">
        <label className="text-sm font-semibold text-[#154734] mb-1">
          Cantidad inicial (u) — opcional
        </label>
        <input
          type="number"
          min={0}
          value={form.cantidad ?? ""}
          onChange={(e) => setField("cantidad", e.target.value)}
          placeholder="Ej: 100"
          className={inputCls}
        />
      </div>

      <div className="flex flex-col">
        <label className="text-sm font-semibold text-[#154734] mb-1">
          Precio unitario
        </label>
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
        <label className="text-sm font-semibold text-[#154734] mb-1">
          Notas (opcional)
        </label>
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
          <label className="text-sm font-semibold text-[#154734] mb-1">
            Nombre
          </label>
          <input
            value={form.referencia}
            onChange={(e) => setField("referencia", e.target.value)}
            placeholder="Cartón, Papel Kraft…"
            className={inputCls}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-[#154734] mb-1">
            Unidad
          </label>
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
            {form.unidad === "kg"
              ? "Cantidad (kg) — opcional"
              : "Cantidad (u) — opcional"}
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
        <label className="text-sm font-semibold text-[#154734] mb-1">
          Notas (opcional)
        </label>
        <textarea
          value={form.notas}
          onChange={(e) => setField("notas", e.target.value)}
          rows={3}
          className={areaCls}
        />
      </div>
    </div>
  );

  
  const handleCancelClick = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    const dirty = JSON.stringify(form) !== JSON.stringify(initialValues);

    if (dirty) {
      setCancelConfirmOpen(true);
    } else {
      onCancel?.();
    }
  };

  const handleCancelConfirm = () => {
    setCancelConfirmOpen(false);
    onCancel?.();
  };

  return (
    <>
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
              <label className="text-sm font-semibold text-[#154734] mb-1">
                Tipo
              </label>
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

        <div className="mt-8 flex flex-col sm:flex-row sm:justify-center gap-3 sm:gap-4 pt-2">
          <button
            type="button"
            onClick={handleCancelClick}
            className="h-12 px-8 rounded-xl border-2 border-[#154734] text-[#154734] font-semibold hover:bg-[#e8f4ef] w-full sm:w-auto"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading}
            className="h-12 px-10 rounded-xl bg-[#154734] text-white font-semibold shadow hover:bg-[#103a2b] w-full sm:w-auto disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading
              ? "Guardando..."
              : mode === "create"
              ? "Guardar"
              : "Guardar cambios"}
          </button>
        </div>
      </form>

      <MessageModal
        isOpen={messageModal.isOpen}
        title={messageModal.title}
        text={messageModal.text}
        type={messageModal.type}
        onClose={() =>
          setMessageModal((prev) => ({
            ...prev,
            isOpen: false,
          }))
        }
      />

      <Modal
        isOpen={isCancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        title="Confirmar Cancelación"
        size="max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setCancelConfirmOpen(false)}
              className="px-4 py-2 rounded-md font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={handleCancelConfirm}
              className="px-4 py-2 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 transition"
            >
              Sí, cancelar
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-700">
          ¿Estás seguro de que querés cancelar? Se perderán los datos sin guardar.
        </p>
      </Modal>
    </>
  );
}
