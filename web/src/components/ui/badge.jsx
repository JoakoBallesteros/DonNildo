import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--hp-navy-100)] text-[var(--hp-navy-800)] hover:bg-[var(--hp-navy-200)]",
        secondary:
          "border-transparent bg-[var(--hp-cyan-50)] text-[var(--hp-cyan-600)] hover:bg-[var(--hp-cyan-100)]",
        destructive:
          "border-transparent bg-red-100 text-red-700 hover:bg-red-200",
        outline: "text-foreground",
        success: "border-transparent bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
        warning: "border-transparent bg-amber-100 text-amber-700 hover:bg-amber-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
