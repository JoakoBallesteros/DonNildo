export default function SecondaryButton({ text, onClick }) {
  return (
    <button
      onClick={onClick}
      className="border border-[#154734] text-[#154734] px-4 py-2 rounded-lg hover:bg-[#e8f4ef] transition"
    >
      {text}
    </button>
  );
}
