import React from "react";
import { Printer } from "lucide-react";


export default function PrintButton({
  targetId,
  label = "Imprimir",
  className = "",
  disabled = false,
}) {
  const handlePrint = () => {
    if (disabled) return; 

    if (!targetId) {
      window.print();
      return;
    }
    const node = document.getElementById(targetId);
    if (!node) {
      console.warn(`PrintButton: no se encontró #${targetId}`);
      window.print();
      return;
    }

    const w = window.open("", "_blank", "width=800,height=600");
    if (!w) return;

    const head = document.head.innerHTML;

    const extraPrintCSS = `
      <style>
        @media print {
          html, body { background: white; }
          .no-print { display: none !important; }
        }
      </style>
    `;

    w.document.open();
    w.document.write(`
      <html>
        <head>${head}${extraPrintCSS}</head>
        <body>${node.outerHTML}</body>
      </html>
    `);
    w.document.close();

    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 150);
  };

  return (
    <button
      onClick={(e) => {
        if (disabled) {
          e.preventDefault();
          return;
        }
        handlePrint();
      }}
      disabled={disabled}
      className={`
        inline-flex items-center gap-2 rounded-full 
        px-4 py-2 border 
        ${disabled
          ? "opacity-50 cursor-not-allowed bg-gray-200 border-gray-300 text-gray-500"
          : "bg-[#f1f6f3] text-[#154734] border-[#e2ede8] hover:bg-[#e8f4ef]"
        }
        ${className}
      `}
    >
      <Printer className="w-4 h-4" />
      {label}
    </button>
  );
}
