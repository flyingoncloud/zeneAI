import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { useZenemeStore } from '../../hooks/useZenemeStore';

interface HelpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ open, onOpenChange }) => {
  const { t } = useZenemeStore();
  const help = t.help;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-[#1a1d2e] border-white/10 text-slate-200 shadow-2xl p-0 gap-0 overflow-hidden rounded-xl">
        
        {/* Fixed Header */}
        <div className="p-6 pb-4 bg-[#1a1d2e] border-b border-white/5 relative z-10">
          <DialogHeader>
            <DialogTitle className="text-xl font-medium tracking-tight text-white">
              {help.title}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm mt-1">
              {help.subtitle}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Content Area */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar bg-[#161825] px-6 py-2 animate-in fade-in-50 duration-300">
          <Accordion type="single" collapsible defaultValue="item-0" className="w-full">
            {help.items.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-white/5">
                <AccordionTrigger className="text-slate-200 hover:text-white hover:no-underline py-4 text-sm font-medium text-left">
                  {item.trigger}
                </AccordionTrigger>
                <AccordionContent className="text-slate-400 leading-relaxed text-sm pb-4">
                  <p>{item.content}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Fixed Footer */}
        <div className="p-6 pt-4 bg-[#1a1d2e] border-t border-white/5 flex justify-end gap-3 z-10">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            className="text-slate-400 hover:text-slate-200 hover:bg-white/5 min-w-[80px]"
          >
            {t.common.close}
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
};
