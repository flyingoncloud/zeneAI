import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "./utils"
import { X } from "./icons"

const DialogContext = React.createContext<{ open: boolean; setOpen: (open: boolean) => void }>({
  open: false,
  setOpen: () => {},
});

const Dialog = ({ children, open, onOpenChange }: any) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : uncontrolledOpen;
  const setIsOpen = isControlled ? onOpenChange : setUncontrolledOpen;
  
  return (
    <DialogContext.Provider value={{ open: isOpen, setOpen: setIsOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

const DialogTrigger = ({ children, asChild, ...props }: any) => {
  const { setOpen } = React.useContext(DialogContext);
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent) => {
         children.props.onClick?.(e);
         setOpen(true);
      }
    });
  }
  
  return <button onClick={() => setOpen(true)} {...props}>{children}</button>
}

const DialogPortal = ({ children }: any) => {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}

const DialogOverlay = ({ className, ...props }: any) => (
  <div className={cn("fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in-0", className)} {...props} />
)

const DialogContent = ({ children, className, ...props }: any) => {
  const { open, setOpen } = React.useContext(DialogContext);
  
  if (!open) return null;
  
  return (
    <DialogPortal>
      <DialogOverlay 
        onClick={() => setOpen(false)}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
        <div 
           className={cn(
             "pointer-events-auto bg-background relative flex flex-col w-full max-w-lg gap-4 rounded-xl border p-6 shadow-2xl duration-200 animate-in zoom-in-95 fade-in-0", 
             className
           )} 
           {...props}
        >
            {children}
            <button 
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-50"
            >
              <X className="h-4 w-4 text-slate-400 hover:text-white" />
              <span className="sr-only">Close</span>
            </button>
        </div>
      </div>
    </DialogPortal>
  )
}

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h2 ref={ref} className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
DialogDescription.displayName = "DialogDescription"

const DialogClose = ({ className, ...props }: any) => {
  const { setOpen } = React.useContext(DialogContext);
  return <button onClick={() => setOpen(false)} className={className} {...props} />
}

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
}
