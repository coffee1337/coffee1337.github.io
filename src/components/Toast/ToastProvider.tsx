import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type Toast = { id: number; message: string };
type ToastContextValue = { toast: (message: string) => void };
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const toast = useCallback((message: string) => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current.slice(-2), { id, message }]);
    window.setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), 2500);
  }, []);
  const value = useMemo(() => ({ toast }), [toast]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2" aria-live="polite">
        <AnimatePresence>
          {items.map((item) => (
            <motion.div key={item.id} role="status" drag="y" dragConstraints={{ top: 0, bottom: 100 }} onDragEnd={(_, info) => { if (info.offset.y > 24) setItems((current) => current.filter((toastItem) => toastItem.id !== item.id)); }} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }} className="rounded-full border border-[var(--line)] bg-[var(--bg-2)] px-4 py-2 font-mono text-xs shadow-lg">
              {item.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
