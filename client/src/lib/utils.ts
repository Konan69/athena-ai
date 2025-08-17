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

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = bytes / 1024;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size = size / 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}