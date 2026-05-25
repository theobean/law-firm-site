"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right";
  className?: string;
}

const animMap = {
  up: "reveal-up",
  left: "reveal-left",
  right: "reveal-right",
};

export default function ScrollReveal({ children, delay = 0, direction = "up", className }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={
        visible
          ? { animation: `${animMap[direction]} 0.6s cubic-bezier(0.4,0,0.2,1) ${delay}s both` }
          : { opacity: 0 }
      }
    >
      {children}
    </div>
  );
}
