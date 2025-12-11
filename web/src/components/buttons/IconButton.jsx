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
      "border border-[#d8e4df] text-[#154734] hover:bg-[#f7faf9] bg-white",
    ghost: "text-[#154734] hover:bg-[#f7faf9]",
    solid: "bg-[#154734] text-white hover:bg-[#103a2b]",
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