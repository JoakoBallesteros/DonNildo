export default function ActionButton({
  type = "edit",
  text,
  onClick,
  className = "",
}) {
  const styles =
    type === "edit"
      ? "bg-[#0c7c59] hover:bg-[#0a6648]"
      : "bg-[#b32121] hover:bg-[#941b1b]";

  return (
    <button
      onClick={onClick}
      className={`${styles} text-white px-1 py-1.5 rounded-md text-sm font-semibold transition ${className}`}
    >
      {text}
    </button>
  );
}
