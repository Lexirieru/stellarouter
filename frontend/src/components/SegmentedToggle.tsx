"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

type Option<T extends string> = { value: T; label: string };

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const pillRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const mounted = useRef(false);

  useEffect(() => {
    const idx = options.findIndex((o) => o.value === value);
    const btn = btnRefs.current[idx];
    const pill = pillRef.current;
    if (!btn || !pill) return;
    const to = { x: btn.offsetLeft, width: btn.offsetWidth };
    if (!mounted.current) {
      gsap.set(pill, to);
      mounted.current = true;
    } else {
      gsap.to(pill, { ...to, duration: 0.55, ease: "elastic.out(1, 0.75)" });
    }
  }, [value, options]);

  return (
    <div className="relative inline-flex gap-1 rounded-full border border-black/10 p-1">
      <div
        ref={pillRef}
        className="pointer-events-none absolute bottom-1 top-1 left-0 rounded-full bg-[var(--color-darkblue)]"
        style={{ width: 0 }}
      />
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            btnRefs.current[i] = el;
          }}
          onClick={() => onChange(o.value)}
          className={`relative z-10 rounded-full px-4 py-1.5 text-sm transition-colors duration-300 ${
            value === o.value ? "text-white" : "text-[var(--color-dark)]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
