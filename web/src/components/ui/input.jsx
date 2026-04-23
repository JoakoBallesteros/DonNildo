import * as React from "react"
import { cn } from "../../lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-12 w-full rounded-xl border border-[var(--hp-slate-200)] bg-white/50 px-4 py-2 text-sm text-[var(--hp-navy-900)] placeholder:text-[var(--hp-slate-400)] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hp-cyan-400)] focus-visible:border-transparent focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50 shadow-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = "Input"

export { Input }
