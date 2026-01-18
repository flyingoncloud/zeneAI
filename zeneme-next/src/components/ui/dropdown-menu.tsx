"use client";

import * as React from "react";
import { cn } from "./utils";

type DropdownMenuCtx = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const DropdownMenuContext = React.createContext<DropdownMenuCtx>({
  open: false,
  setOpen: () => {},
});

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownMenuContext.Provider>
  );
};

type PolymorphicChildProps = Record<string, unknown>;

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
  const { open, setOpen } = React.useContext(DropdownMenuContext);

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<PolymorphicChildProps>;
    const childOnClick = child.props.onClick;

    const onClick: React.MouseEventHandler<HTMLElement> = (e) => {
      if (typeof childOnClick === "function") {
        (childOnClick as (evt: React.MouseEvent<HTMLElement>) => void)(e);
      }
      setOpen(!open);
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
      "data-state": open ? "open" : "closed",
    });
  }

  return (
    <button
      ref={ref}
      onClick={() => setOpen(!open)}
      className={className}
      type="button"
      {...props}
      data-state={open ? "open" : "closed"}
    >
      {children}
    </button>
  );
});
DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "end" | "center";
    sideOffset?: number;
    forceMount?: boolean;
  }
>(({ className, align = "center", sideOffset = 4, forceMount, style, ...props }, ref) => {
  const { open } = React.useContext(DropdownMenuContext);
  if (!open && !forceMount) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-80",
        align === "end" ? "right-0" : "left-0",
        "top-full",
        className,
      )}
      style={{ ...(style ?? {}), marginTop: sideOffset }}
      {...props}
    />
  );
});
DropdownMenuContent.displayName = "DropdownMenuContent";

const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, ...props }, ref) => (
  <div ref={ref} className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)} {...props} />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

const DropdownMenuSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />,
);
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

// placeholders（保持你现有导出 API，不用 any）
const DropdownMenuGroup = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
const DropdownMenuPortal = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
const DropdownMenuSub = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
const DropdownMenuSubContent = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
const DropdownMenuSubTrigger = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
const DropdownMenuCheckboxItem = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
const DropdownMenuRadioGroup = ({ children }: { children?: React.ReactNode }) => <>{children}</>;
const DropdownMenuRadioItem = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

const DropdownMenuShortcut = ({ children }: { children?: React.ReactNode }) => (
  <span className="ml-auto text-xs tracking-widest opacity-60">{children}</span>
);

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuShortcut,
};
