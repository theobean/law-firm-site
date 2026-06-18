"use client";

import { useEffect, useRef } from "react";

const GRAIN_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>
       <filter id='n'>
         <feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/>
         <feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0'/>
       </filter>
       <rect width='100%' height='100%' filter='url(#n)'/>
     </svg>`
  );

export default function HeroVideo() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  // Parallax: scroll moves the video slower than the page (depth effect).
  useEffect(() => {
    const el = parallaxRef.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const y = Math.min(window.scrollY, 800) * 0.35;
      el.style.transform = `translate3d(0, ${y}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* Video with slow zoom-out on load + parallax wrapper */}
      <div ref={parallaxRef} className="absolute inset-0 will-change-transform">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/hero-office-poster.jpg"
          className="hero-zoom absolute inset-0 w-full h-full object-cover opacity-30"
          style={{ filter: "contrast(1.08) saturate(1.12) brightness(0.96)" }}
          aria-hidden="true"
        >
          <source src="/hero-office.webm" type="video/webm" />
          <source src="/hero-office.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Color grade — teal in shadows, warm amber in highlights (Hollywood lookup) */}
      <div
        className="absolute inset-0 pointer-events-none mix-blend-soft-light"
        style={{
          background:
            "linear-gradient(to bottom, rgba(10,70,90,0.55) 0%, transparent 45%, rgba(200,120,40,0.45) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Navy brand tint (keeps text readable) */}
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary/70 via-primary/55 to-primary/80 mix-blend-multiply"
        aria-hidden="true"
      />

      {/* Vignette — darkens edges, focuses center */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)",
        }}
        aria-hidden="true"
      />

      {/* Film grain — analog texture, barely visible */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.12] mix-blend-overlay"
        style={{
          backgroundImage: `url("${GRAIN_SVG}")`,
          backgroundSize: "240px 240px",
        }}
        aria-hidden="true"
      />
    </>
  );
}
