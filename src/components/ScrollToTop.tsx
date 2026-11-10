"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(0);

  useEffect(() => {
    const overlays = document.getElementById("site-bottom-overlays");
    if (!overlays) return;
    const update = () => setBottomOffset(overlays.getBoundingClientRect().height);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(overlays);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      style={{ bottom: bottomOffset + 24 }}
      className={`fixed right-6 z-50 w-11 h-11 rounded-sm bg-accent hover:bg-accent/90 text-white shadow-lg flex items-center justify-center transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <ArrowUp size={20} />
    </button>
  );
}
