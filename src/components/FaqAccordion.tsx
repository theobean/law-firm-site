"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Minus } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

function AccordionItem({
  item,
  isOpen,
  onClick,
  delay,
}: {
  item: FaqItem;
  isOpen: boolean;
  onClick: () => void;
  delay: number;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Scroll reveal
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={wrapperRef}
      style={
        visible
          ? { animation: `reveal-up 0.5s cubic-bezier(0.4,0,0.2,1) ${delay}s both` }
          : { opacity: 0 }
      }
      className={`border rounded-sm overflow-hidden transition-colors duration-300 ${
        isOpen
          ? "border-accent/40 bg-white shadow-md"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
      >
        <span className={`font-semibold text-lg pr-2 transition-colors duration-200 ${isOpen ? "text-accent" : "text-primary"}`}>
          {item.q}
        </span>
        <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${
          isOpen ? "bg-accent text-white rotate-0" : "bg-primary/10 text-primary"
        }`}>
          {isOpen ? <Minus size={14} /> : <Plus size={14} />}
        </span>
      </button>

      {/* Smooth height animation with grid trick */}
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
      >
        <div ref={contentRef} className="overflow-hidden">
          <div className="px-6 pb-6 border-t border-accent/20">
            <p className="pt-4 text-gray-600 leading-relaxed">{item.a}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <AccordionItem
          key={idx}
          item={item}
          isOpen={openIndex === idx}
          onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
          delay={idx * 0.07}
        />
      ))}
    </div>
  );
}
