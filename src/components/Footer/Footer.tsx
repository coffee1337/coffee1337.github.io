import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { links } from "../../content";
import { useSite } from "../../context/site";
import { useToast } from "../Toast/ToastProvider";
import { KbdShortcut } from "../Kbd/KbdShortcut";
import { ArrowUpRight, Copy, GitHub, LinkedIn, Llms, Mail, PixelCup, Resume, Telegram } from "../Icons";
import { trackEvent } from "../../analytics";
import "./footer.css";

/** No layout effect during prerender: fall back to useEffect to keep the SSR log clean. */
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function Footer() {
  const { dict } = useSite();
  const { toast } = useToast();
  const [time, setTime] = useState("--:--:--");
  const markRef = useRef<HTMLDivElement>(null);
  const wordRef = useRef<HTMLSpanElement>(null);
  const [wordSize, setWordSize] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setTime(new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date()));
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);

  /* Fit-text: measure the word at fontSize=100px, then derive the font-size that
     fills the container width — font size only, no transform-scale (no distortion).
     Re-measured on resize, on container width change and after fonts are ready. */
  useIsomorphicLayoutEffect(() => {
    const mark = markRef.current;
    const word = wordRef.current;
    if (!mark || !word) return;
    let frame = 0;
    let alive = true;
    const fit = () => {
      const target = mark.clientWidth;
      if (!target) return;
      const previous = word.style.fontSize;
      word.style.fontSize = "100px";
      const measured = word.getBoundingClientRect().width;
      word.style.fontSize = previous;
      if (!measured) return;
      const size = Math.floor(((target - 1) / measured) * 100 * 100) / 100;
      if (size > 0) setWordSize(size);
    };
    const schedule = () => {
      if (!alive) return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(fit);
    };
    fit();
    window.addEventListener("resize", schedule);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    observer?.observe(mark);
    if (document.fonts) void document.fonts.ready.then(schedule);
    return () => {
      alive = false;
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
    };
  }, []);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(links.email);
      toast(`✓ ${dict.contact.copied}: ${links.email}`);
      trackEvent("contact_copy", { channel: "email", value: links.email });
    } catch {
      /* clipboard unavailable (http, denied permission) — fail silently */
    }
  };

  const year = new Date().getFullYear();

  return (
    <footer className="relative z-[2] overflow-hidden border-t border-[var(--line)] bg-[var(--bg)] pb-8 pt-12">
      <div className="site-wrap relative">
        <PixelCup className="footer-mascot" />
        <div>
          <div ref={markRef} className="footer-mark" aria-hidden="true">
            <span ref={wordRef} className="footer-word" style={wordSize ? { fontSize: `${wordSize}px` } : undefined}>COFFEE1337</span>
          </div>
          <span className="sr-only">COFFEE1337</span>
          <div className="grid gap-10 border-b border-[var(--line)] pb-12 md:grid-cols-3">
            <div><p className="font-mono text-xl"><span className="text-[var(--accent)]">●</span> coffee1337</p><p className="mt-4 max-w-xs text-sm text-[var(--ink-dim)]">{dict.footer.role}</p><span className="mt-5 inline-flex rounded-full border border-[var(--ok)] px-3 py-1 font-mono text-[10px] uppercase text-[var(--ok)]">{dict.footer.status}</span></div>
            <nav className="footer-links" aria-label={dict.footer.linksAria}>
              <a className="footer-link" href={links.github} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("social_click", { network: "github", section: "footer" })} data-track="social_github"><GitHub className="footer-link__icon" /><span>GitHub</span><ArrowUpRight className="footer-link__arrow" /></a>
              <a className="footer-link" href={links.linkedin} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("social_click", { network: "linkedin", section: "footer" })} data-track="social_linkedin"><LinkedIn className="footer-link__icon" /><span>{dict.contact.linkedin}</span><ArrowUpRight className="footer-link__arrow" /></a>
              <a className="footer-link" href={links.telegram} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("social_click", { network: "telegram", section: "footer" })} data-track="social_telegram"><Telegram className="footer-link__icon" /><span>{dict.contact.telegram}</span><ArrowUpRight className="footer-link__arrow" /></a>
              <button type="button" className="footer-link" onClick={() => void copyEmail()} data-track="contact_copy_email"><Mail className="footer-link__icon" /><span>{dict.contact.email}</span><Copy className="footer-link__arrow" /></button>
              <a className="footer-link" href={links.resumePdf} onClick={() => trackEvent("resume", { action: "download_pdf", section: "footer" })} data-track="resume_pdf_footer"><Resume className="footer-link__icon" /><span>{dict.footer.resume}</span><ArrowUpRight className="footer-link__arrow" /></a>
              <a className="footer-link" href="/llms.txt"><Llms className="footer-link__icon" /><span>llms.txt</span><ArrowUpRight className="footer-link__arrow" /></a>
            </nav>
            <div className="flex flex-col items-start gap-4 text-sm"><p className="text-[var(--ink-dim)]">{dict.footer.location}</p><time className="font-mono tabular-nums text-2xl" dateTime={new Date().toISOString()} suppressHydrationWarning>{time}</time><a href={links.mailto} className="rounded-full bg-[var(--accent)] px-5 py-2 font-mono text-xs text-[var(--bg)]" onClick={() => trackEvent("social_click", { network: "mailto", section: "footer" })} data-track="social_mailto">{dict.footer.sayHello} ↗</a></div>
          </div>
          <div className="flex flex-col gap-2 pt-5 font-mono text-[11px] text-[var(--ink-faint)] md:flex-row md:items-center md:justify-between">
            <span>© {year} {dict.footer.rights} (coffee1337)</span>
            <span>{dict.footer.builtWith}</span>
            <span className="inline-flex items-center gap-2" title={dict.a11y.kbd}><KbdShortcut /><span className="sr-only">{dict.a11y.openPalette}</span></span>
          </div>
        </div>
      </div>
    </footer>
  );
}
