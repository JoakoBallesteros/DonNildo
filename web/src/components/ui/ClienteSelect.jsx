import React, { useState } from "react"; 
import { Combobox, Transition } from "@headlessui/react";

export default function ClienteSelect({ clientes = [], value, onChange }) {
  const [query, setQuery] = useState("");

  const filtrados =
    query === ""
      ? clientes
      : clientes.filter((c) =>
          c.razon_social.toLowerCase().includes(query.toLowerCase()) ||
          c.numero_documento.includes(query)
        );

  return (
    <Combobox value={value} onChange={onChange}>
      <div className="relative w-full">
        <div className="relative">
          <Combobox.Input
            className="w-full border border-[#dce8fd] rounded-xl px-4 py-2 text-sm"
            placeholder="Buscar cliente…"
            displayValue={(c) => c?.razon_social || ""}
            onChange={(e) => setQuery(e.target.value)}
          />

          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-4 w-4 text-[#0b1a38]"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              fill="none"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </Combobox.Button>
        </div>

        <Transition>
          <Combobox.Options className="absolute w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-60 overflow-auto z-[9999]">
            {filtrados.length === 0 ? (
              <div className="px-4 py-2 text-slate-500">Consumidor Final (No registrado)</div>
            ) : (
              filtrados.map((c) => (
                <Combobox.Option
                  key={c.id_cliente}
                  value={c}
                  className={({ active }) =>
                    `cursor-pointer px-4 py-2 text-sm flex justify-between ${
                      active ? "bg-[#f0f5ff]" : ""
                    }`
                  }
                >
                  <span className="font-medium text-[#0b1a38]">{c.razon_social}</span>
                  <span className="text-xs text-slate-500">{c.numero_documento}</span>
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
}
