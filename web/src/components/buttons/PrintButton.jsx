import React from "react";
import { Printer } from "lucide-react";

/**
 * Imprime solo el nodo con id = targetId.
 * Si no pasás targetId -> imprime toda la página (window.print()).
 */
export default function PrintButton({
  targetId,
  label = "Imprimir",
  className = "",
}) {
  const handlePrint = () => {
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

    // Abrimos una ventana efímera con el contenido a imprimir
    const w = window.open("", "_blank", "width=800,height=600");
    if (!w) return;

    // Copiamos <head> para que se apliquen los estilos (Tailwind, etc.)
    const head = document.head.innerHTML;

    // Podés agregar estilos específicos para impresión acá:
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

    // Esperamos un tick para que carguen los estilos
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 150);
  };

  return (
    <button
      onClick={handlePrint}
      className={`inline-flex items-center gap-2 rounded-full bg-[#f1f6f3] text-[#154734] px-4 py-2 border border-[#e2ede8] hover:bg-[#e8f4ef] ${className}`}
    >
      <Printer className="w-4 h-4" />
      {label}
    </button>
  );
}