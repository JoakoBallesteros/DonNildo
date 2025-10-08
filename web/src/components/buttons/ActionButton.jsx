export default function ActionButton({ type = "edit", text, onClick }) {
  const styles =
    type === "edit"
      ? "bg-[#0c7c59] hover:bg-[#0a6648]"
      : "bg-[#b32121] hover:bg-[#941b1b]";
  return (
    <button
      onClick={onClick}
      className={`${styles} text-white px-3 py-1 rounded-md transition`}
    >
      {text}
    </button>
  );
}
