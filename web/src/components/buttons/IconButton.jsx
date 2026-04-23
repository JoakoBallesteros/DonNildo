import React from "react";
export default function IconButton({
  onClick,
  title,
  className = "",
  children,
  label,
  variant = "outline",
  type = "button",
}) {
  const base =
    "inline-flex items-center gap-2 rounded-md px-3 py-2 transition";
  const variants = {
    outline:
      "border border-[#dce8fd] text-[#0b1a38] hover:bg-[#f0f5ff] bg-white",
    ghost: "text-[#0b1a38] hover:bg-[#f0f5ff]",
    solid: "bg-[#0b1a38] text-white hover:bg-[#102354]",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      title={title}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
      {label ? <span className="text-sm">{label}</span> : null}
    </button>
  );
}