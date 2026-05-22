"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-chartreuse-zap disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-transparent text-cloud-white border border-chartreuse-zap rounded-full px-4 py-2 hover:bg-veridian-stroke hover:text-cloud-white",
        secondary:
          "bg-transparent text-cloud-white border border-border-light rounded-full px-4 py-2 hover:bg-muted-ash hover:text-cloud-white",
        outline:
          "bg-transparent text-cloud-white border border-border-light rounded-full px-4 py-2 hover:bg-muted-ash",
        hero:
          "bg-transparent text-cloud-white border border-chartreuse-zap rounded px-8 py-0 h-12 hover:bg-veridian-stroke",
        ghost:
          "bg-transparent text-cloud-white border-0 rounded-none p-0 hover:text-chartreuse-zap",
        icon: "bg-transparent text-smokey-carbon border border-border-light rounded-full p-0.5 hover:text-cloud-white hover:border-chartreuse-zap size-9 [&_svg]:size-5",
        destructive:
          "bg-alert-red text-cloud-white rounded-full px-4 py-2 hover:brightness-110",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-11 px-8 text-base",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
