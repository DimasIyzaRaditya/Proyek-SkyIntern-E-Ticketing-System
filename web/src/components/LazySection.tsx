"use client";

import { type ReactNode, useEffect, useRef } from "react";

interface LazySectionProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay slot: 1–5 maps to 80–400 ms */
  delay?: 1 | 2 | 3 | 4 | 5;
  /** Fraction of element that must be visible before triggering (default 0.08) */
  threshold?: number;
}

/**
 * Wraps children and fade+slides them up when they scroll into the viewport.
 * Uses a single IntersectionObserver per instance (no global state).
 */
export default function LazySection({
  children,
  className = "",
  delay,
  threshold = 0.08,
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If reduced motion is preferred, skip the animation entirely
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      el.classList.remove("reveal-hidden");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("reveal-visible");
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: "0px 0px -32px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  const delayClass = delay ? `reveal-delay-${delay}` : "";

  return (
    <div ref={ref} className={`reveal-hidden ${delayClass} ${className}`}>
      {children}
    </div>
  );
}
