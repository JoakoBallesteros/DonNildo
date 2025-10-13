export default function ActionButton({
  type = "edit",
  text = "",
  onClick,
  className = "",
}) {
  const base =
    "w-[110px] py-1.5 rounded-md text-white font-medium text-sm transition";

  const styles = {
    edit: "bg-[#0f7a4e] hover:bg-[#0d6843]", // Verde
    delete: "bg-[#b91c1c] hover:bg-[#991b1b]", // Rojo
  };

  return (
    <button
      onClick={onClick}
      className={`${base} ${styles[type] || ""} ${className}`}
    >
      {text}
    </button>
  );
}
