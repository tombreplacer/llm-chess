import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs sm:text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md shadow-destructive/20",
        outline:
          "border border-input bg-background hover:bg-accent/15 hover:text-accent-foreground hover:border-primary/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50",
        ghost: "hover:bg-accent/15 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        neon: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 hover:border-cyan-400 hover:shadow-cyan-glow",
        amber: "bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow-md shadow-amber-500/25",
        emerald: "bg-emerald-600 text-white font-bold hover:bg-emerald-500 shadow-md shadow-emerald-600/25",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 sm:h-8 rounded-lg px-2.5 sm:px-3 text-xs",
        lg: "h-11 rounded-xl px-8 text-base",
        icon: "h-8 w-8 sm:h-9 sm:w-9",
        "icon-sm": "h-7 w-7 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
