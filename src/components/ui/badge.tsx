import * as React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
}

const variantClasses = {
  default: "bg-primary/10 text-primary border-primary/20",
  secondary: "bg-secondary text-secondary-foreground border-border",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
  destructive: "bg-red-50 text-red-700 border-red-200",
  outline: "bg-transparent text-foreground border-border",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
