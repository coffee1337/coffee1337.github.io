import { useEffect, useId, useRef, useState, type MouseEvent } from "react";
import { useSite } from "../../context/site";
import { useScrollSpy } from "../../hooks/useScrollSpy";
import { NeuralMark } from "../Brand/NeuralMark";

const links = [
  { href: "#about", key: "about" },
  { href: "#capabilities", key: "capabilities" },
  { href: "#experience", key: "experience" },
  { href: "#projects", key: "projects" },
  { href: "#stack", key: "stack" },
  { href: "#resume", key: "resume" },
  { href: "#contact", key: "contact" },
] as const;

export function Header() {
  const { dict, lang, setLang, theme, toggleTheme, section, setSection } = useSite();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const labels = dict.nav;
  const { lockUntilSettled } = useScrollSpy();

  const go = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    setSection(id);
    lockUntilSettled();
    setOpen(false);
    event.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const root = panelRef.current;
    const focusable = root?.querySelectorAll<HTMLElement>("a, button");
    focusable?.[0]?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const current = section === "education" ? "resume" : section;

  return (
    <header className={`fixed inset-x-0 top-0 z-50 ${scrolled ? "is-scrolled" : ""}`}>
      <a href="#about" className="skip-link">
        {dict.a11y.skip}
      </a>
      <div className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
        <a href="#top" className="brand-mark" onClick={(e) => go(e, "top")} aria-label="ET">
          <NeuralMark className="brand-orb h-6 w-6" />
          <span className="display text-lg leading-none">ET</span>
        </a>

        <nav className="hidden items-center gap-4 xl:flex" aria-label="Primary">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="nav-link"
              aria-current={current === l.href.slice(1) ? "true" : undefined}
              onClick={(e) => go(e, l.href.slice(1))}
            >
              {labels[l.key]}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-[var(--line)] p-0.5" role="group" aria-label={dict.a11y.lang}>
            {(["en", "ru"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLang(code)}
                aria-pressed={lang === code}
                className="mono rounded-full px-2 py-1 text-[10px]"
                style={{
                  background: lang === code ? "var(--text)" : "transparent",
                  color: lang === code ? "var(--bg)" : "var(--muted)",
                }}
              >
                {code}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="theme-btn"
            aria-label={theme === "dark" ? dict.a11y.themeToLight : dict.a11y.themeToDark}
            data-tip={theme === "dark" ? dict.a11y.themeLight : dict.a11y.themeDark}
            onClick={(e) => toggleTheme({ x: e.clientX, y: e.clientY })}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            type="button"
            className="mono px-2 text-[10px] xl:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? labels.close : labels.menu}
          </button>
        </div>
      </div>

      {open && (
        <div id={menuId} ref={panelRef} className="site-wrap mt-2 xl:hidden">
          <nav className="flex flex-col border border-[var(--line)] bg-[var(--bg)] p-2" aria-label="Mobile">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="border-b border-[var(--line)] px-3 py-3 text-lg last:border-b-0"
                aria-current={current === l.href.slice(1) ? "true" : undefined}
                onClick={(e) => go(e, l.href.slice(1))}
              >
                {labels[l.key]}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="2.4" fill="currentColor" />
      <path d="M8 1.2v1.8M8 13v1.8M1.2 8h1.8M13 8h1.8M3.2 3.2l1.3 1.3M11.5 11.5l1.3 1.3M3.2 12.8l1.3-1.3M11.5 4.5l1.3-1.3" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path d="M9.2 1.6a5.6 5.6 0 1 0 5.2 7.6A4.6 4.6 0 0 1 9.2 1.6z" fill="currentColor" />
    </svg>
  );
}
