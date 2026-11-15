import { useEffect } from "react";
import { getLenis } from "../lib/lenis";

/**
 * Блокировка страницы для модалок: Lenis.stop() + overflow hidden на body.
 * Счётчик нужен, чтобы вложенные оверлеи (лоадер → палитра) не разблокировали
 * скролл раньше времени. Ширина скроллбара компенсируется padding-right.
 */
let locks = 0;
let savedOverflow = "";
let savedPadding = "";

function acquire(): void {
  locks += 1;
  if (locks > 1) return;
  const body = document.body;
  savedOverflow = body.style.overflow;
  savedPadding = body.style.paddingRight;
  const gutter = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
  body.style.overflow = "hidden";
  if (gutter > 0) body.style.paddingRight = `${gutter}px`;
  getLenis()?.stop();
}

function release(): void {
  locks = Math.max(0, locks - 1);
  if (locks > 0) return;
  const body = document.body;
  body.style.overflow = savedOverflow;
  body.style.paddingRight = savedPadding;
  getLenis()?.start();
}

export function isScrollLocked(): boolean {
  return locks > 0;
}

export function useScrollLock(open: boolean): void {
  useEffect(() => {
    if (!open) return;
    acquire();
    return release;
  }, [open]);
}
