export default function SecondaryButton({ text, onClick }) {
  return (
    <button
      onClick={onClick}
      className="border border-[#0b1a38] text-[#0b1a38] px-4 py-2 rounded-lg hover:bg-[#f0f5ff] transition"
    >
      {text}
    </button>
  );
}
