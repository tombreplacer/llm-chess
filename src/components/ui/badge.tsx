import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] sm:text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 tracking-wide uppercase",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow",
        outline: "text-foreground border-border",
        cyan: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",
        emerald: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
        amber: "border-amber-500/40 bg-amber-500/10 text-amber-300",
        rose: "border-rose-500/40 bg-rose-500/10 text-rose-300",
        white: "bg-slate-100 border-white/80 text-slate-900 font-extrabold shadow-sm",
        black: "bg-slate-950 border-slate-700 text-slate-100 font-extrabold shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
