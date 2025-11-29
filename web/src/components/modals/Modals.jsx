import { useEffect} from "react";
export default function Modal({ isOpen, title, onClose, children, footer, size="max-w-3xl" }) {

    useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-start pt-20 z-50">
      <div className={`bg-white rounded-2xl shadow-lg w-[90%] ${size} p-6`}>
        <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
          <h3 className="text-xl font-bold text-[#154734]">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-[#154734] font-semibold">✕</button>
        </div>
        <div>{children}</div>
        {footer && <div className="border-t border-slate-200 pt-4 mt-6">{footer}</div>}
      </div>
    </div>
  );
}