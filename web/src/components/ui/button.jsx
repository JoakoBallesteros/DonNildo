import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-[linear-gradient(135deg,var(--hp-navy-700),var(--hp-navy-600))] text-white shadow-[0_0_15px_rgba(37,84,178,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:bg-[linear-gradient(135deg,var(--hp-navy-600),var(--hp-navy-500))] border border-[rgba(34,211,238,0.2)]",
        destructive:
          "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20",
        outline:
          "border border-[var(--hp-navy-200)] bg-white/5 backdrop-blur-md text-[var(--hp-navy-800)] hover:bg-[var(--hp-navy-50)] hover:text-[var(--hp-navy-900)] hover:border-[var(--hp-navy-400)]",
        secondary:
          "bg-[var(--hp-cyan-50)] text-[var(--hp-navy-800)] hover:bg-[var(--hp-cyan-100)] border border-[var(--hp-cyan-200)]",
        ghost: "hover:bg-[var(--hp-slate-100)] text-[var(--hp-slate-600)] hover:text-[var(--hp-navy-900)]",
        link: "text-[var(--hp-cyan-500)] underline-offset-4 hover:underline",
        glow: "relative bg-transparent text-[var(--hp-cyan-400)] border border-[var(--hp-cyan-400)] shadow-[0_0_10px_rgba(34,211,238,0.2),inset_0_0_10px_rgba(34,211,238,0.1)] hover:shadow-[0_0_20px_rgba(34,211,238,0.6),inset_0_0_15px_rgba(34,211,238,0.3)] hover:text-white transition-all overflow-hidden before:absolute before:inset-0 before:-z-10 before:bg-[var(--hp-cyan-400)] before:opacity-0 hover:before:opacity-100 before:transition-opacity",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
