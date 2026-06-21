"use client";

import { useEffect } from "react";
import { gsap } from "gsap";

// Floating brand cursor label (from the landing site). Shows "click" near
// interactive elements and "to home" on the logo. Pair with cursor.css.
export function CursorBubble() {
  useEffect(() => {
    const bubble = document.querySelector<HTMLElement>(".cursor-bubble");
    if (!bubble) return;

    const xTo = gsap.quickTo(bubble, "x", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(bubble, "y", { duration: 0.5, ease: "power3" });
    let hovering = false;
    gsap.set(bubble, { rotation: -30 });

    const onMove = (e: MouseEvent) => {
      xTo(e.clientX + 13);
      yTo(e.clientY - 43);
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const found = target?.closest(
        'a, button, [role="button"], .logo-stellarouter, [data-cursor]'
      );
      if (found && !hovering) {
        hovering = true;
        bubble.textContent = found.matches(".logo-stellarouter")
          ? "to home"
          : found.getAttribute("data-cursor") || "click";
        gsap.killTweensOf(bubble, "opacity,scale,rotation");
        gsap.to(bubble, {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 1.7,
          delay: 0.1,
          ease: "elastic.out(1, 0.4)",
        });
      } else if (!found && hovering) {
        hovering = false;
        gsap.killTweensOf(bubble, "opacity,scale,rotation");
        gsap.to(bubble, {
          opacity: 1,
          scale: 0,
          rotation: -30,
          duration: 0.3,
          ease: "sine.inOut",
        });
      }
    };

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseover", onOver);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
    };
  }, []);

  return <div className="cursor-bubble">click</div>;
}
