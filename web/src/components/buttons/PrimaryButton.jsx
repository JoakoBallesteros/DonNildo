export default function PrimaryButton({ text, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`bg-[#154734] text-white px-4 py-2 rounded-lg hover:bg-[#1c5e47] transition ${className}`}
    >
      {text}
    </button>
  );
}