import React, { useState } from "react";

/** TabControl simple (estilo clásico)
 *  props:
 *   - tabs: [{ key, label, content }]
 *   - defaultKey?: string
 *   - onChange?: (key)=>void
 */
export default function Tabs({ tabs = [], defaultKey, onChange }) {
  const first = defaultKey ?? tabs?.[0]?.key;
  const [active, setActive] = useState(first);

  const activate = (k) => {
    setActive(k);
    onChange?.(k);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-1 border-b border-[#e3e9e5]">
        {tabs.map((t) => {
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => activate(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-md
                ${isActive
                  ? "bg-white text-[#154734] border border-b-white border-[#e3e9e5]"
                  : "text-slate-600 hover:text-[#154734] bg-[#f6faf7] border border-transparent"}`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div className="border border-[#e3e9e5] border-t-0 rounded-b-md bg-white p-4">
        {tabs.find((t) => t.key === active)?.content}
      </div>
    </div>
  );
}
