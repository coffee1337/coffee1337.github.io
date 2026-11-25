import { useEffect, useRef, useState, type MouseEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSite } from "../../context/site";
import { useScrollSpy } from "../../hooks/useScrollSpy";
import { CommandPalette } from "../Command/CommandPalette";
import { KbdShortcut } from "../Kbd/KbdShortcut";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { useScrollLock } from "../../hooks/useScrollLock";

const NAV_IDS = ["about", "stack", "projects", "certificates", "resume", "contact"] as const;
const MOBILE_IDS = ["about", "stack", "capabilities", "projects", "certificates", "resume", "experience", "contact"] as const;

type NavKey = keyof ReturnType<typeof useSite>["dict"]["nav"];

export function Header() {
  const site = useSite();
  const { dict, lang, switchLang, theme, toggleTheme, section, setSection, pathBase, route } = site;
  const { lockUntilSettled } = useScrollSpy();
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [compact, setCompact] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const paletteButton = useRef<HTMLButtonElement>(null);
  const paletteWasOpen = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useFocusTrap(menuRef, menuOpen);
  useScrollLock(menuOpen || paletteOpen);
  const lastY = useRef(0);
  const onHome = route.kind === "home";

  const href = (id: string) => (onHome ? `#${id}` : `${pathBase}/#${id}`);

  const go = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (!onHome) return;
    event.preventDefault();
    setSection(id);
    lockUntilSettled();
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    const onScroll = () => {
      const delta = window.scrollY - lastY.current;
      setCompact(window.scrollY > 24);
      if (Math.abs(delta) > 8) setHidden(delta > 0 && window.scrollY > 100);
      lastY.current = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // e.code не зависит от раскладки: на RU «k» приходит как «л».
      if ((event.metaKey || event.ctrlKey) && (event.code === "KeyK" || event.key.toLowerCase() === "k")) {
        event.preventDefault();
        setPaletteOpen(true);
        return;
      }
      if (event.key === "Escape") {
        setMenuOpen(false);
        setPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const first = menuRef.current?.querySelector<HTMLElement>("a[href], button");
    (first ?? menuButton.current)?.focus();
  }, [menuOpen]);

  // Фокус возвращается на триггер палитры, даже если её открыли хоткеем.
  useEffect(() => {
    if (paletteWasOpen.current && !paletteOpen) paletteButton.current?.focus();
    paletteWasOpen.current = paletteOpen;
  }, [paletteOpen]);

  const current = section === "education" ? "about" : section === "capabilities" ? "stack" : section === "experience" ? "resume" : section;

  return (
    <>
      <header
        className={`fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center rounded-full border border-[var(--line)] bg-[color-mix(in_srgb,var(--bg-2)_70%,transparent)] px-3 backdrop-blur-md transition-all duration-300 ${
          compact ? "py-1.5 shadow-lg" : "py-2.5"
        } ${hidden ? "-translate-y-24 opacity-0" : "opacity-100"}`}
      >
        <a
          href={href("top")}
          onClick={(event) => go(event, "top")}
          className="whitespace-nowrap font-mono text-sm font-semibold"
        >
          <span className="text-[var(--accent)]">●</span> coffee1337
        </a>

        <nav className="mx-5 hidden items-center gap-1 lg:flex" aria-label={dict.a11y.primaryNav}>
          {NAV_IDS.map((id) => (
            <a
              key={id}
              href={href(id)}
              onClick={(event) => go(event, id)}
              className="relative whitespace-nowrap rounded-full px-2 py-1 font-mono text-[11px] uppercase tracking-wider text-[var(--ink-dim)] hover:text-[var(--ink)]"
            >
              {current === id && (
                <motion.span
                  layoutId="active-nav"
                  className="absolute inset-0 -z-10 rounded-full bg-[var(--line)]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              {dict.nav[id as NavKey]}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            ref={paletteButton}
            type="button"
            className="hidden rounded-full px-1 py-1 lg:block"
            onClick={() => setPaletteOpen(true)}
            aria-label={dict.a11y.openPalette}
            data-track="cmdk_open"
          >
            <KbdShortcut />
          </button>

          <div
            className="hidden rounded-full border border-[var(--line)] p-0.5 sm:flex"
            role="group"
            aria-label={dict.a11y.lang}
          >
            {(["en", "ru"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => switchLang(code)}
                aria-pressed={lang === code}
                data-track="lang"
                className="relative rounded-full px-2 py-1 font-mono text-[10px]"
              >
                {lang === code && (
                  <motion.span
                    layoutId="lang-badge"
                    className="absolute inset-0 -z-10 rounded-full bg-[var(--accent)]"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className={lang === code ? "text-[var(--bg)]" : ""}>{code.toUpperCase()}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="theme-btn"
            onClick={(event) => toggleTheme({ x: event.clientX, y: event.clientY })}
            aria-label={theme === "dark" ? dict.a11y.themeToLight : dict.a11y.themeToDark}
            data-track="theme"
          >
            {theme === "dark" ? "☼" : "☾"}
          </button>

          <button
            ref={menuButton}
            type="button"
            className="font-mono text-[10px] uppercase lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {dict.nav.menu}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            id="mobile-menu"
            ref={menuRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 overflow-y-auto bg-[var(--bg)] p-6 pt-28 lg:hidden"
            role="dialog"
            aria-modal="true"
            data-lenis-prevent
          >
            <nav className="flex flex-col" aria-label={dict.a11y.mobileNav}>
              {MOBILE_IDS.map((id, index) => (
                <a
                  key={id}
                  href={href(id)}
                  onClick={(event) => go(event, id)}
                  className="border-b border-[var(--line)] py-4 font-mono text-2xl"
                >
                  <span className="mr-4 text-sm text-[var(--accent)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {dict.nav[id as NavKey]}
                </a>
              ))}
            </nav>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <div
                className="flex rounded-full border border-[var(--line)] p-0.5"
                role="group"
                aria-label={dict.a11y.lang}
              >
                {(["en", "ru"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => switchLang(code)}
                    aria-pressed={lang === code}
                    data-track="lang"
                    className={`rounded-full px-3 py-1.5 font-mono text-[11px] uppercase transition-colors ${
                      lang === code
                        ? "bg-[var(--accent)] text-[var(--bg)]"
                        : "text-[var(--ink-dim)] hover:text-[var(--ink)]"
                    }`}
                  >
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setPaletteOpen(true);
                }}
                aria-label={dict.a11y.openPalette}
                data-track="cmdk_open"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-1.5 font-mono text-[11px] uppercase text-[var(--ink-dim)] transition-colors hover:border-[var(--accent)] hover:text-[var(--ink)]"
              >
                <span aria-hidden>⌕</span>
                <KbdShortcut />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="mt-8 font-mono text-xs uppercase"
            >
              {dict.nav.close} ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
