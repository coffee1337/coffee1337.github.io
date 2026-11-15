/**
 * Единственный экземпляр Lenis на приложение.
 *
 * Модалки (Cmd+K, мобильное меню, чат, лоадер) должны останавливать страницу,
 * но не блокировать скролл внутри себя. Поэтому доступ к инстансу идёт через
 * модуль: `getLenis()` для императивных вызовов и `useLenis()` в компонентах.
 */
import { useSyncExternalStore } from "react";
import type Lenis from "lenis";

let instance: Lenis | null = null;
const listeners = new Set<() => void>();

export function setLenis(next: Lenis | null): void {
  if (instance === next) return;
  instance = next;
  for (const listener of listeners) listener();
}

export function getLenis(): Lenis | null {
  return instance;
}

/** Реактивная ссылка на Lenis: `null` до инициализации и при reduced motion. */
export function useLenis(): Lenis | null {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
      };
    },
    () => instance,
    () => null,
  );
}
