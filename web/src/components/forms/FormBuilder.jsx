// src/components/forms/FormBuilder.jsx
import InputField from "./InputFields";

const COLS = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
};

export default function FormBuilder({
  fields = [],
  values = {},
  onChange,
  errors = {},
  columns = 4,
}) {
  const gridClass = COLS[columns] || "grid-cols-4";

  const handleChange = (name, value) => onChange?.(name, value);

  const renderField = (f) => {
    const v = values[f.name] ?? "";
    const common =
      "border border-[#cfdcd3] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#154734] w-full";

    const Label = f.label ? (
      <label className="text-sm text-[#154734] mb-1 font-medium">{f.label}</label>
    ) : null;

  
    if (f.type === "select") {
      return (
        <div className="flex flex-col">
          {Label}
          <select
            name={f.name}
            value={v}
            onChange={(e) => handleChange(f.name, e.target.value)}
            className={common}
            disabled={f.disabled}
            readOnly={f.readOnly}
          >
            <option value="">{f.placeholder || "Seleccionar..."}</option>
            {f.options?.map((opt) => (
              <option key={(opt.value ?? opt) + ""} value={opt.value ?? opt}>
                {opt.label ?? opt}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (f.type === "textarea") {
      return (
        <div className="flex flex-col">
          {Label}
          <textarea
            name={f.name}
            value={v}
            onChange={(e) => handleChange(f.name, e.target.value)}
            placeholder={f.placeholder}
            rows={f.rows || 3}
            className={common}
            readOnly={f.readOnly}
            disabled={f.disabled}
          />
        </div>
      );
    }

   
    return (
      <div className="flex flex-col">
        {Label}
        <input
          type={f.type || "text"}
          name={f.name}
          value={v}
          onChange={(e) => handleChange(f.name, e.target.value)}
          placeholder={f.placeholder}
          className={common}
          readOnly={f.readOnly}
          disabled={f.disabled}
        />
      </div>
    );
  };

  return (
    <div className={`grid ${gridClass} gap-4 items-end`}>
      {fields.map((f) => (
        <div key={f.name} className={f.colSpan ? `col-span-${f.colSpan}` : ""}>
          {renderField(f)}
          {errors[f.name] && (
            <p className="text-red-600 text-xs mt-1">{errors[f.name]}</p>
          )}
        </div>
      ))}
    </div>
  );
}
