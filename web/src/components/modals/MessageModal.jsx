import React from "react";
import Modal from "./Modals";

export default function MessageModal({
  isOpen,
  title,
  text,
  type = "success",
  onClose,
  // confirm mode props
  confirm = false,
  onConfirm = null,
  confirmText = "Sí, eliminar",
  cancelText = "Cancelar",
}) {
  const colors = {
    success: "text-green-700",
    error: "text-red-700",
    warning: "text-yellow-700",
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    if (onClose) onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="max-w-md"
      footer={
        confirm ? (
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-xl hover:bg-gray-300"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className="bg-[#9b102e] text-white px-4 py-2 rounded-xl hover:bg-[#630924]"
            >
              {confirmText}
            </button>
          </div>
        ) : (
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-[#154734] text-white px-4 py-2 rounded-xl hover:bg-[#103a2b]"
            >
              Aceptar
            </button>
          </div>
        )
      }
    >
      <p className={`text-sm ${colors[type]}`}>{text}</p>
    </Modal>
  );
}
