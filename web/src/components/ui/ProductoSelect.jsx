import React, { useState } from "react"; 
import { Combobox, Transition } from "@headlessui/react";

export default function ProductoSelect({ productos = [], value, onChange }) {
  const [query, setQuery] = useState("");

  const filtrados =
    query === ""
      ? productos
      : productos.filter((p) =>
          p.nombre.toLowerCase().includes(query.toLowerCase())
        );

  return (
    <Combobox value={value} onChange={onChange}>
      <div className="relative w-full">

        {/* Input */}
        <div className="relative">
          <Combobox.Input
            className="w-full border border-[#d8e4df] rounded-xl px-4 py-2 text-sm"
            placeholder="Buscar producto…"
            displayValue={(p) => p?.nombre || ""}
            onChange={(e) => setQuery(e.target.value)}
          />

          {/* Flecha simple */}
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-4 w-4 text-[#154734]"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              fill="none"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </Combobox.Button>
        </div>

        {/* Opciones */}
        <Transition>
          <Combobox.Options className="absolute w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-60 overflow-auto z-[9999]">
            {filtrados.length === 0 ? (
              <div className="px-4 py-2 text-slate-500">No se encontró</div>
            ) : (
              filtrados.map((p) => (
                <Combobox.Option
                  key={p.id_producto}
                  value={p}
                  className={({ active }) =>
                    `cursor-pointer px-4 py-2 text-sm ${
                      active ? "bg-[#e8f4ef]" : ""
                    }`
                  }
                >
                  {p.nombre}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>

      </div>
    </Combobox>
  );
}
