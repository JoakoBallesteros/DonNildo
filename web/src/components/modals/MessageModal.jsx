import React from "react";
import Modal from "./Modals";

export default function MessageModal({ isOpen, title, text, type, onClose }) {
  const colors = {
    success: "text-green-700",
    error: "text-red-700",
    warning: "text-yellow-700",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="max-w-md"
      footer={
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#154734] text-white px-4 py-2 rounded-xl hover:bg-[#103a2b]"
          >
            Aceptar
          </button>
        </div>
      }
    >
      <p className={`text-sm ${colors[type]}`}>{text}</p>
    </Modal>
  );
}
