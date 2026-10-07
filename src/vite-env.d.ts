/// <reference types="vite/client" />

interface Document {
  startViewTransition?: (cb: () => void) => { finished: Promise<void> };
}

interface Window {
  requestIdleCallback?: (cb: () => void) => number;
  cancelIdleCallback?: (id: number) => void;
}
