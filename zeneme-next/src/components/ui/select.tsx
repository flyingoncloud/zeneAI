import * as React from "react"
import { cn } from "./utils"
import { ChevronDown, Check } from "./icons"
/* eslint-disable @typescript-eslint/no-explicit-any */

const SelectContext = React.createContext<{ 
  value: string; 
  onValueChange: (value: string) => void; 
  open: boolean; 
  setOpen: (open: boolean) => void;
}>({
  value: "",
  onValueChange: () => {},
  open: false,
  setOpen: () => {},
});

const Select = ({ value, onValueChange, children, defaultValue }: any) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || "");
    const [open, setOpen] = React.useState(false);
    
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;
    const handleValueChange = (val: string) => {
        if (!isControlled) setInternalValue(val);
        onValueChange?.(val);
        setOpen(false);
    };

    return (
      <SelectContext.Provider value={{ value: currentValue, onValueChange: handleValueChange, open, setOpen }}>
         <div className="relative inline-block w-full">{children}</div>
      </SelectContext.Provider>
    )
}

const SelectTrigger = ({ className, children, ...props }: any) => {
    const { open, setOpen } = React.useContext(SelectContext);
    return (
        <button
            type="button"
            onClick={() => setOpen(!open)}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    )
}

const SelectValue = ({ placeholder, children }: any) => {
    const { value } = React.useContext(SelectContext);
    return <span>{value || placeholder || children}</span>
}

const SelectContent = ({ className, children, position = "popper", ...props }: any) => {
    const { open } = React.useContext(SelectContext);
    if (!open) return null;
    return (
        <div className={cn(
            "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80",
            position === "popper" && "top-full mt-1 w-full",
            className
        )} {...props}>
            <div className="p-1">{children}</div>
        </div>
    )
}

const SelectItem = ({ className, children, value, ...props }: any) => {
    const { value: selectedValue, onValueChange } = React.useContext(SelectContext);
    const isSelected = selectedValue === value;
    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                onValueChange(value);
            }}
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                className
            )}
            {...props}
        >
            {isSelected && (
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <Check className="h-4 w-4" />
                </span>
            )}
            <span className="truncate">{children}</span>
        </div>
    )
}

// Dummy components
const SelectGroup = ({children}: any) => <>{children}</>
const SelectLabel = ({children, className}: any) => <div className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}>{children}</div>
const SelectSeparator = ({className}: any) => <div className={cn("-mx-1 my-1 h-px bg-muted", className)} />
const SelectScrollUpButton = () => null
const SelectScrollDownButton = () => null

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
