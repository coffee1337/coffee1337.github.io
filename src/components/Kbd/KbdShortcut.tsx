import { useEffect, useState } from "react";

/**
 * Подсказка хоткея: ⌘K на Apple, Ctrl K на остальных.
 * До гидрации (и в пререндере) — нейтральный «Ctrl K», чтобы не было
 * расхождения разметки; платформа определяется в эффекте.
 */
export function KbdShortcut({ className = "" }: { className?: string }) {
  const [apple, setApple] = useState(false);

  useEffect(() => {
    const platform = navigator.platform || "";
    const ua = navigator.userAgent || "";
    setApple(/mac|iphone|ipad|ipod/i.test(platform) || /Mac OS X|iPhone|iPad/.test(ua));
  }, []);

  return (
    <kbd className={`kbd ${className}`} aria-hidden>
      {apple ? "⌘ K" : "Ctrl K"}
    </kbd>
  );
}
