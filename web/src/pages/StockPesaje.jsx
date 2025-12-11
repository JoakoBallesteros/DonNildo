import React, { useMemo, useState, useEffect, useCallback} from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import PageContainer from "../components/pages/PageContainer";
import DataTable from "../components/tables/DataTable";
import Modified from "../components/modals/Modified";
import PrintButton from "../components/buttons/PrintButton";
import MessageModal from "../components/modals/MessageModal";
import { apiFetch } from "../lib/apiClient";
import Modal from "../components/modals/Modals";
import Logo from "../img/LogoDonNildo.png";

function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return (
    "row-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 8)
  );
}

function IconButton({ children, className = "", ...rest }) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-md text-sm bg-[#154734] text-white px-3 py-2 hover:bg-[#103a2b] ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export default function StockPesaje() {
 
  const [materiales, setMateriales] = useState([]);
  const [loadingMat, setLoadingMat] = useState(true);
  const [err, setErr] = useState("");


  const [matId, setMatId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [precioKg, setPrecioKg] = useState("");
  const [obsFila, setObsFila] = useState("");
  const [loadingSubmit, setLoadingSubmit] = useState(false);
 
  const [items, setItems] = useState([]);
  const [isCancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    title: "",
    text: "",
    type: "",
  });
  const navigate = useNavigate();
  const limpiarForm = () => {
    setMatId("");
    setCantidad("");
    setPrecioKg("");
    setObsFila("");
  };

  
  const loadMateriales = useCallback(async () => {
    try {
      setLoadingMat(true);
      setErr("");
      const data = await apiFetch("/api/stock/materiales");
      setMateriales(data || []);
    } catch (e) {
      console.error("Error cargando materiales para pesaje:", e);
      setErr(e.message || "Error al cargar materiales.");
    } finally {
      setLoadingMat(false);
    }
  }, []);

  useEffect(() => {
    loadMateriales();
  }, [loadMateriales]);

  
  const onAdd = () => {
    const material = materiales.find(
      (m) => String(m.id_producto) === String(matId)
    );
    const cant = Number(cantidad);
    const precio = Number(precioKg || 0);

    if (!material) {
      setMessageModal({
        isOpen: true,
        title: "⚠️ Error",
        text: "Seleccioná el tipo de material.",
        type: "error",
      });
      return;
    }
    if (!cant || cant <= 0) {
      setMessageModal({
        isOpen: true,
        title: "⚠️ Error",
        text: "Ingresá la cantidad (kg).",
        type: "error",
      });
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        id: genId(),
        id_producto: material.id_producto,
        tipo: material.nombre,
        unidad: material.unidad_stock || "kg",
        cantidad: cant,
        precio,
        subtotal: cant * precio,
        observaciones: obsFila && obsFila.trim() ? obsFila.trim() : "—",
      },
    ]);

    limpiarForm();
  };

  const onDelete = (row) => {
    setItems((prev) => prev.filter((r) => r.id !== row.id));
  };

  const onOpenEdit = (row) => {
    setEditRow(row);
    setEditOpen(true);
  };

  const onSaveEdited = (payload) => {
    const updated = payload?.rows?.[0];
    if (!updated || !editRow) return;
    const cant = Number(updated.cantidad || 0);
    const precio = Number(updated.precio || 0);
    const recalc = {
      ...editRow,
      ...updated,
      cantidad: cant,
      precio,
      subtotal: cant * precio,
    };
    setItems((prev) => prev.map((r) => (r.id === editRow.id ? recalc : r)));
  };

  
const onConfirm = async () => {
  if (loadingSubmit) return; 

  if (!items.length) {
    setMessageModal({
      isOpen: true,
      title: "⚠️ Sin ítems",
      text: "Debes cargar al menos un material antes de confirmar el pesaje.",
      type: "error",
    });
    return;
  }

  setLoadingSubmit(true); 

  try {
    const payload = {
      items: items.map((i) => ({
        id_producto: i.id_producto,
        cantidad: i.cantidad,
        precio_kg: i.precio || 0,
        observaciones:
          i.observaciones && i.observaciones !== "—"
            ? i.observaciones
            : undefined,
      })),
    };

    await apiFetch("/api/stock/pesaje", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    setMessageModal({
      isOpen: true,
      title: "✅ Pesaje registrado",
      text: "El stock de los materiales fue actualizado correctamente.",
      type: "success",
    });

    setItems([]);
    limpiarForm();

  } catch (e) {
    console.error("Error confirmando pesaje:", e);
    setMessageModal({
      isOpen: true,
      title: "❌ Error al registrar pesaje",
      text: e.message || "Ocurrió un error al registrar el pesaje.",
      type: "error",
    });
  } finally {
    setLoadingSubmit(false);
  }
};

  const handleCancelClick = () => {
    if (items.length > 0) {      
      setCancelConfirmOpen(true);
    } else {
      navigate("/stock");                
    }
  };
  const handleCancelConfirm = () => {
    setCancelConfirmOpen(false);
    navigate("/stock");        
  };
 
  const columns = useMemo(
    () => [
      {
        id: "tipo",
        header: "Tipo",
        accessor: "tipo",
        width: 220,
        align: "center",
        cellClass: "text-center whitespace-nowrap",
      },
      {
        id: "cantidad",
        header: "Cantidad (kg)",
        accessor: (r) => r.cantidad,
        align: "center",
        width: 140,
        cellClass: "tabular-nums whitespace-nowrap text-center",
      },
      {
        id: "precioKg",
        header: "Precio x Kg",
        accessor: (r) =>
          (r.precio ?? 0).toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
          }),
          align: "center",
        width: 140,
        cellClass: "tabular-nums whitespace-nowrap text-center",
      },
      {
        id: "subtotal",
        header: "Subtotal",
        accessor: (r) =>
          (r.subtotal ?? 0).toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
          }),
         align: "center",
        width: 140,
        cellClass: "tabular-nums whitespace-nowrap text-center",
      },
      {
        id: "obs",
        header: "Observaciones",
        accessor: (r) => r.observaciones || "—",
        align: "center",
         cellClass: "text-center",
        width: 260,
      },
      {
        id: "acc",
        header: "Acciones",
        align: "center",
        cellClass: "text-center",
        width: 200,
        render: (row) => (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onOpenEdit(row)}
              className="inline-flex items-center gap-1 rounded-md text-xs bg-[#154734] text-white px-2 py-1 hover:bg-[#103a2b] whitespace-nowrap"
            >
              Modificar
            </button>
            <button
              onClick={() => onDelete(row)}
              className="inline-flex items-center gap-1 rounded-md text-xs bg-[#a30000] text-white px-2 py-1 hover:bg-[#7a0000] whitespace-nowrap"
            >
              Eliminar
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <PageContainer title="Registro de Pesaje">
      <div className="space-y-5 md:space-y-6 pb-28 md:pb-12">
        {/* Form de alta */}
        <div className="bg-white rounded-2xl border border-[#e3e9e5] shadow-sm p-4 sm:p-5 md:p-6">
          {err && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
              {err}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_auto] gap-4 items-end">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-[#154734] mb-1">
                Tipo de Material
              </label>
              <select
                value={matId}
                onChange={(e) => setMatId(e.target.value)}
                className="border border-[#d8e4df] rounded-md px-3 py-2"
                disabled={loadingMat}
              >
                <option value="">
                  {loadingMat ? "Cargando materiales..." : "Seleccione…"}
                </option>
                {materiales.map((m) => (
                  <option key={m.id_producto} value={m.id_producto}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-[#154734] mb-1">
                Cantidad (kg)
              </label>
              <input
                type="number"
                min={0}
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Ingresar cantidad…"
                className="border border-[#d8e4df] rounded-md px-3 py-2"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-[#154734] mb-1">
                Precio x Kg (opcional)
              </label>
              <input
                type="number"
                min={0}
                value={precioKg}
                onChange={(e) => setPrecioKg(e.target.value)}
                placeholder="Ingresar precio…"
                className="border border-[#d8e4df] rounded-md px-3 py-2"
              />
            </div>

            <div className="flex md:justify-end">
              <IconButton
                onClick={onAdd}
                className="w-full justify-center md:w-auto px-10 py-2.5 mb-1"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">Añadir</span>
              </IconButton>
            </div>

            <div className="md:col-span-4 flex flex-col">
              <label className="text-sm font-semibold text-[#154734] mb-1">
                Observaciones (opcional)
              </label>
              <input
                value={obsFila}
                onChange={(e) => setObsFila(e.target.value)}
                placeholder="(Opcional)"
                className="border border-[#d8e4df] rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>

        {/* Tabla para imprimir */}
        <div
          id="pesaje-print"
          className="hidden print:block"
          style={{ padding: "20px" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "18px",
            }}
          >
            {items.map((row) => (
              <div
                key={row.id}
                style={{
                  border: "2px solid #000",
                  borderRadius: "12px",
                  padding: "20px",
                  background: "white",
                  pageBreakInside: "avoid",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "230px",
                }}
              >
               
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "12px",
                  }}
                >
                 
                  <img
                    src={Logo}
                    alt="Logo"
                    style={{
                      width: "55px",
                      height: "55px",
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />

                
                  <div style={{ textAlign: "left" }}>
                    <h2
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        margin: 0,
                      }}
                    >
                      {row.tipo}
                    </h2>

                    <p
                      style={{
                        fontSize: "26px",
                        fontWeight: "bold",
                        margin: "2px 0 0 0",
                      }}
                    >
                      {row.cantidad} {row.unidad?.toUpperCase() ?? "KG"}
                    </p>
                  </div>
                </div>

               
                <p
                  style={{
                    fontSize: "12px",
                    textAlign: "center",
                    marginTop: "8px",
                  }}
                >
                  Fecha: {new Date().toLocaleString("es-AR")}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {/* Versión desktop */}
          <div
            className="hidden md:block bg-white rounded-2xl border border-[#e3e9e5] shadow-sm p-3 md:p-4"
          >
            <DataTable
              columns={columns}
              data={items}
              zebra={false}
              stickyHeader={true}
                wrapperClass="dn-table-wrapper-tall overflow-y-auto overflow-x-auto"

              tableClass="w-full text-sm border-collapse"
              theadClass="bg-[#e8f4ef] text-[#154734]"
              rowClass="hover:bg-[#f6faf7] border-t border-[#edf2ef]"
              headerClass="px-3 py-2.5 font-semibold"
              cellClass="px-3 py-2.5 text-center"
              emptyLabel="Sin ítems cargados"
            />
          </div>

          {/* Versión mobile */}
          <div className="md:hidden space-y-3">
            {!items.length && (
              <div className="rounded-2xl border border-dashed border-[#d8e4df] bg-[#f7fbf9] px-4 py-6 text-center text-sm text-[#62736a]">
                Sin ítems cargados
              </div>
            )}
            {items.map((row) => (
              <div
                key={row.id}
                className="rounded-2xl border border-[#e3e9e5] bg-white shadow-sm p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-[#7a8b82]">
                      Tipo
                    </p>
                    <p className="text-base font-semibold text-[#0d231a]">
                      {row.tipo}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-[#7a8b82]">
                      Subtotal
                    </p>
                    <p className="text-base font-semibold text-[#154734]">
                      {(row.subtotal ?? 0).toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm text-[#1f2e27]">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#7a8b82]">
                      Cantidad
                    </p>
                    <p className="font-medium">
                      {row.cantidad} {row.unidad}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-[#7a8b82]">
                      Precio x Kg
                    </p>
                    <p className="font-medium">
                      {(row.precio ?? 0).toLocaleString("es-AR", {
                        style: "currency",
                        currency: "ARS",
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 text-sm">
                  <p className="text-xs font-semibold text-[#7a8b82]">
                    Observaciones
                  </p>
                  <p className="text-[#1f2e27]">
                    {row.observaciones && row.observaciones !== "—"
                      ? row.observaciones
                      : "—"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onOpenEdit(row)}
                    className="flex-1 rounded-md bg-[#154734] text-white px-3 py-2 text-sm font-medium hover:bg-[#103a2b] transition"
                  >
                    Modificar
                  </button>
                  <button
                    onClick={() => onDelete(row)}
                    className="flex-1 rounded-md bg-[#a30000] text-white px-3 py-2 text-sm font-medium hover:bg-[#7a0000] transition"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones: imprimir */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="md:ml-auto">
           <PrintButton
              targetId="pesaje-print"   // ✔ el correcto
              disabled={items.length === 0}
              className={items.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
            />
          </div>
        </div>

        {/* Botones Confirmar / Cancelar */}
        <div className="flex flex-col md:flex-row md:justify-center gap-3">
          <button
            type="button"
            className="w-full md:w-auto rounded-md border border-[#154734] text-[#154734] px-8 py-2 font-semibold hover:bg-[#e8f4ef] transition"
            onClick={() => {
             handleCancelClick();
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loadingSubmit} 
            className={`w-full md:w-auto px-8 py-2 rounded-md font-semibold text-white transition 
              ${loadingSubmit 
                ? "bg-[#6a8679] cursor-not-allowed opacity-70" 
                : "bg-[#154734] hover:bg-[#103a2b]"
              }`}
            onClick={onConfirm}
          >
            {loadingSubmit ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

    
      {editRow && (
        <Modified
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          title={`Modificar: ${editRow.tipo}`}
          data={{ rows: [editRow] }}
          itemsKey="rows"
          columns={[
            { key: "tipo", label: "Tipo", readOnly: true },
            {
              key: "cantidad",
              label: "Cantidad (kg)",
              type: "number",
              align: "text-center",
            },
            {
              key: "precio",
              label: "Precio x Kg",
              type: "number",
              align: "text-center",
            },
            { key: "observaciones", label: "Observaciones" },
            {
              key: "subtotal",
              label: "Subtotal",
              readOnly: true,
              align: "text-center",
            },
          ]}
          computeTotal={(rows) =>
            rows.reduce(
              (sum, r) => sum + Number(r.cantidad || 0) * Number(r.precio || 0),
              0
            )
          }
          onSave={onSaveEdited}
        />
      )}


      <MessageModal
        isOpen={messageModal.isOpen}
        title={messageModal.title}
        text={messageModal.text}
        type={messageModal.type}
        onClose={() => setMessageModal((prev) => ({ ...prev, isOpen: false }))}
      />
     
      <Modal
        isOpen={isCancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        title="Confirmar Cancelación"
        size="max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setCancelConfirmOpen(false)}
              className="px-4 py-2 rounded-md font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              Volver
            </button>
            <button
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
    </PageContainer>
  );
}
