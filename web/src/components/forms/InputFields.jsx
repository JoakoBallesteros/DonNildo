export default function InputField({ label, placeholder, type = "text" }) {
  return (
    <div className="flex flex-col">
      {label && (
        <label className="text-sm text-[#154734] mb-1 font-medium">
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        className="border border-[#cfdcd3] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#154734]"
      />
    </div>
  );
}
