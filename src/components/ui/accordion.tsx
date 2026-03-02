import * as React from 'react';

interface AccordionProps {
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  children: React.ReactNode;
}

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
}

interface AccordionTriggerProps {
  children: React.ReactNode;
}

interface AccordionContentProps {
  children: React.ReactNode;
}

const AccordionContext = React.createContext<{
  open: string | null;
  setOpen: (value: string | null) => void;
  type: 'single' | 'multiple';
  collapsible: boolean;
} | null>(null);

export function Accordion({ children, type = 'single', collapsible = true }: AccordionProps) {
  const [open, setOpen] = React.useState<string | null>(null);
  return (
    <AccordionContext.Provider value={{ open, setOpen, type, collapsible }}>
      <div className="space-y-4">{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ value, children }: AccordionItemProps) {
  return <div data-accordion-item={value}>{children}</div>;
}

export function AccordionTrigger({ children }: AccordionTriggerProps) {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error('AccordionTrigger must be used within Accordion');
  const { open, setOpen, type, collapsible } = ctx;
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  
  const getCurrentValue = () => {
    return buttonRef.current?.parentElement?.getAttribute('data-accordion-item') || '';
  };
  
  const isOpen = open === getCurrentValue();
  
  const handleClick = () => {
    const value = getCurrentValue();
    if (type === 'single') {
      // Single mode: collapse one section if another is opened
      setOpen(isOpen && collapsible ? null : value);
    } else {
      // Multiple mode: allow multiple sections to be open
      // This would require a different state management approach
      console.warn('Multiple mode not implemented yet');
    }
  };
  
  return (
    <button
      className="w-full flex items-center justify-between px-4 py-3 bg-white border rounded shadow-sm hover:bg-gray-50 transition text-left font-medium text-lg"
      aria-expanded={isOpen}
      onClick={handleClick}
      ref={buttonRef}
      type="button"
    >
      {children}
      <span className={`ml-2 transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
    </button>
  );
}

export function AccordionContent({ children }: AccordionContentProps) {
  const ctx = React.useContext(AccordionContext);
  if (!ctx) throw new Error('AccordionContent must be used within Accordion');
  const { open } = ctx;
  const divRef = React.useRef<HTMLDivElement | null>(null);
  
  const getCurrentValue = () => {
    return divRef.current?.parentElement?.getAttribute('data-accordion-item') || '';
  };
  
  const isOpen = open === getCurrentValue();
  
  return (
    <div
      className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[1000px] py-4' : 'max-h-0 py-0'}`}
      aria-hidden={!isOpen}
      ref={divRef}
    >
      {isOpen ? children : null}
    </div>
  );
} 