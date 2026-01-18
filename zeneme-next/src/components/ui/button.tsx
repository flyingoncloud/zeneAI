"use client";

import * as React from "react";
import { cn } from "./utils";

type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

type ButtonVariantsInput = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

const buttonVariants = ({ variant = "default", size = "default", className = "" }: ButtonVariantsInput = {}) => {
  const base =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 aria-invalid:ring-2 aria-invalid:ring-destructive/20 aria-invalid:border-destructive";
  const variants: Record<ButtonVariant, string> = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive:
      "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
    outline:
      "border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
    link: "text-primary underline-offset-4 hover:underline",
  };
  const sizes: Record<ButtonSize, string> = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-10 rounded-md px-8",
    icon: "h-9 w-9",
  };

  return cn(base, variants[variant], sizes[size], className);
};

type PolymorphicChildProps = Record<string, unknown>;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, children, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<PolymorphicChildProps>;
      const mergedClassName = cn(
        typeof (child.props as PolymorphicChildProps).className === "string"
          ? ((child.props as PolymorphicChildProps).className as string)
          : "",
        buttonVariants({ variant, size, className }),
      );

      return React.cloneElement(child, {
        ...(child.props as PolymorphicChildProps),
        ...(props as PolymorphicChildProps),
        className: mergedClassName,
      });
    }

    return (
      <button className={buttonVariants({ variant, size, className })} ref={ref} {...props}>
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
