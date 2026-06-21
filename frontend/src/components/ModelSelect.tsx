"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";

// Custom dropdown styled like the landing-page popouts (beige panel, 16px
// radius, Epilogue) with a GSAP open/close animation. Adds an inline search +
// scroll when the option list is long (e.g. the full model catalog).
export function ModelSelect({
  models,
  value,
  onChange,
}: {
  models: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const searchable = models.length > 12;
  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    return s ? models.filter((m) => m.toLowerCase().includes(s)) : models;
  }, [query, models]);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (open) {
      gsap.set(panel, { display: "block" });
      gsap.fromTo(
        panel,
        { opacity: 0, y: -8, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: "back.out(1.6)" }
      );
    } else if (panel.style.display === "block") {
      setQuery("");
      gsap.to(panel, {
        opacity: 0,
        y: -8,
        scale: 0.96,
        duration: 0.18,
        ease: "power2.in",
        onComplete: () => gsap.set(panel, { display: "none" }),
      });
    }
  }, [open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-black/15 bg-transparent px-4 py-1.5 text-sm transition-colors hover:border-black/40"
      >
        <span className="max-w-[14rem] truncate font-mono text-xs">{value}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2.5 4.5L6 8l3.5-3.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        ref={panelRef}
        style={{ display: "none" }}
        className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-2xl border border-black/10 bg-[var(--bg-color)] p-1.5 shadow-xl"
      >
        {searchable && (
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search models…"
            className="mb-1.5 w-full rounded-lg border border-black/10 bg-black/[.03] px-3 py-1.5 font-mono text-xs outline-none focus:border-black/30"
          />
        )}
        <div className="max-h-72 overflow-y-auto">
          {filtered.length === 0 && (
            <p className="px-3 py-2 text-xs text-zinc-400">No matches.</p>
          )}
          {filtered.map((m) => {
            const active = m === value;
            return (
              <button
                key={m}
                onClick={() => {
                  onChange(m);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-mono text-xs transition-colors ${
                  active
                    ? "bg-[var(--color-darkblue)] text-white"
                    : "hover:bg-black/[.06]"
                }`}
              >
                <span className="w-3 shrink-0">{active ? "✓" : ""}</span>
                <span className="truncate">{m}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
