"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div
            key={idx}
            className="border border-gray-200 rounded-sm overflow-hidden bg-white"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-primary text-lg pr-6">{item.q}</span>
              <ChevronDown
                size={20}
                className={`text-accent flex-shrink-0 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-6 pb-6 pt-0 text-gray-600 leading-relaxed border-t border-gray-100">
                <p className="pt-4">{item.a}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
