"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "./utils";
import { X } from "./icons";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue>({
  open: false,
  setOpen: () => {},
});

type DialogProps = {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const Dialog = ({ children, open, onOpenChange }: DialogProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (isControlled) onOpenChange?.(next);
      else setUncontrolledOpen(next);
    },
    [isControlled, onOpenChange],
  );

  return <DialogContext.Provider value={{ open: isOpen, setOpen }}>{children}</DialogContext.Provider>;
};

type PolymorphicChildProps = Record<string, unknown>;

type DialogTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  children: React.ReactNode;
};

const DialogTrigger = ({ children, asChild, className, ...props }: DialogTriggerProps) => {
  const { setOpen } = React.useContext(DialogContext);

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<PolymorphicChildProps>;
    const childOnClick = child.props.onClick;

    const onClick: React.MouseEventHandler<HTMLElement> = (e) => {
      if (typeof childOnClick === "function") {
        (childOnClick as (evt: React.MouseEvent<HTMLElement>) => void)(e);
      }
      setOpen(true);
    };

    const mergedClassName = cn(
      typeof (child.props as PolymorphicChildProps).className === "string"
        ? ((child.props as PolymorphicChildProps).className as string)
        : "",
      typeof className === "string" ? className : "",
      typeof (props as PolymorphicChildProps).className === "string"
        ? ((props as PolymorphicChildProps).className as string)
        : "",
    );

    return React.cloneElement(child, {
      ...(child.props as PolymorphicChildProps),
      ...(props as PolymorphicChildProps),
      className: mergedClassName,
      onClick,
    });
  }

  return (
    <button onClick={() => setOpen(true)} className={className} {...props}>
      {children}
    </button>
  );
};

type DialogPortalProps = { children: React.ReactNode };

const DialogPortal = ({ children }: DialogPortalProps) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  if (!mounted) return null;
  return createPortal(children, document.body);
};

const DialogOverlay = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in-0", className)}
    {...props}
  />
);

type DialogContentProps = React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode };

const DialogContent = ({ children, className, ...props }: DialogContentProps) => {
  const { open, setOpen } = React.useContext(DialogContext);
  if (!open) return null;

  return (
    <DialogPortal>
      <DialogOverlay onClick={() => setOpen(false)} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
        <div
          className={cn(
            "pointer-events-auto bg-background relative flex w-full max-w-lg flex-col gap-4 rounded-lg border p-6 shadow-2xl duration-200 animate-in zoom-in-95 fade-in-0",
            className,
          )}
          {...props}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {children}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 z-50 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
            type="button"
          >
            <X className="h-4 w-4 text-slate-400 hover:text-white" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </div>
    </DialogPortal>
  );
};

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
DialogTitle.displayName = "DialogTitle";

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
DialogDescription.displayName = "DialogDescription";

const DialogClose = ({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => {
  const { setOpen } = React.useContext(DialogContext);
  return (
    <button onClick={() => setOpen(false)} className={className} type="button" {...props}>
      {children}
    </button>
  );
};

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogClose,
};
