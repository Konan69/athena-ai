import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Attach cursor-follow glow handlers to an element.
 * - Updates CSS vars --mx/--my on mouse move
 * - Fades glow in/out smoothly without flashing
 * - Returns a cleanup function to remove listeners
 */
export function attachCursorGlow(
  el: HTMLElement,
  options?: { hideX?: string; hideY?: string }
) {
  const hideX = options?.hideX ?? "-200px";
  const hideY = options?.hideY ?? "-200px";
  const onMove = (e: MouseEvent) => {
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
    const glow = el.querySelector('[data-glow="true"]') as HTMLElement | null;
    if (glow) glow.style.opacity = "1";
  };
  const onLeave = () => {
    el.style.setProperty("--mx", hideX);
    el.style.setProperty("--my", hideY);
    const glow = el.querySelector('[data-glow="true"]') as HTMLElement | null;
    if (glow) glow.style.opacity = "0";
  };

  // initialize hidden
  el.style.setProperty("--mx", hideX);
  el.style.setProperty("--my", hideY);

  el.addEventListener("mousemove", onMove);
  el.addEventListener("mouseleave", onLeave);

  return () => {
    el.removeEventListener("mousemove", onMove);
    el.removeEventListener("mouseleave", onLeave);
  };
}

/**
 * Declarative props helpers for React elements:
 * Use like: {...cursorGlowProps()}
 * They set css vars and inline handlers; use when ref is not convenient.
 */
export function cursorGlowProps(hideX = "-200px", hideY = "-200px") {
  return {
    style: { "--mx": hideX, "--my": hideY } as React.CSSProperties,
    onMouseMove: (e: React.MouseEvent<HTMLElement>) => {
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      target.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      target.style.setProperty("--my", `${e.clientY - rect.top}px`);
      const glow = target.querySelector(
        '[data-glow="true"]'
      ) as HTMLElement | null;
      if (glow) glow.style.opacity = "1";
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      const target = e.currentTarget as HTMLElement;
      target.style.setProperty("--mx", hideX);
      target.style.setProperty("--my", hideY);
      const glow = target.querySelector(
        '[data-glow="true"]'
      ) as HTMLElement | null;
      if (glow) glow.style.opacity = "0";
    },
  };
}
