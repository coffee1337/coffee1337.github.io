import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { links } from "../../content";
import { useSite } from "../../context/site";
import { useToast } from "../Toast/ToastProvider";

export function Footer() {
  const { dict } = useSite();
  const { toast } = useToast();
  const [time, setTime] = useState("--:--:--");
  useEffect(() => { const update = () => setTime(new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date())); update(); const id = window.setInterval(update, 1000); return () => window.clearInterval(id); }, []);
  return <footer className="relative z-[2] overflow-hidden border-t border-[var(--line)] bg-[var(--bg)] pb-8 pt-12">
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -80px" }} className="site-wrap">
      <svg className="mb-10 h-auto w-full text-[var(--ink)]" viewBox="0 0 1200 150" role="img" aria-label="COFFEE1337"><text x="0" y="125" textLength="1200" lengthAdjust="spacingAndGlyphs" fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="1" style={{ fontFamily: "var(--font-display)" }} fontSize="150" fontWeight="800">COFFEE1337</text></svg>
      <div className="grid gap-10 border-b border-[var(--line)] pb-12 md:grid-cols-3">
        <div><p className="font-mono text-xl"><span className="text-[var(--accent)]">●</span> coffee1337</p><p className="mt-4 max-w-xs text-sm text-[var(--ink-dim)]">{dict.footer.role}</p><span className="mt-5 inline-flex rounded-full border border-[var(--ok)] px-3 py-1 font-mono text-[10px] uppercase text-[var(--ok)]">{dict.footer.status}</span></div>
        <nav className="flex flex-col items-start gap-3 font-mono text-xs" aria-label="Footer links"><a href={links.github}>GitHub ↗</a><a href={links.linkedin}>LinkedIn ↗</a><a href={links.telegram}>Telegram ↗</a><button type="button" onClick={() => { void navigator.clipboard.writeText(links.email); toast(`✓ ${dict.contact.copied}: ${links.email}`); }}>Email ⧉</button><a href={links.resumePdf}>Resume PDF ↗</a><a href="/llms.txt">llms.txt ↗</a></nav>
        <div className="flex flex-col items-start gap-4 text-sm"><p className="text-[var(--ink-dim)]">{dict.footer.location}</p><time className="font-mono tabular-nums text-2xl" dateTime={new Date().toISOString()}>{time}</time><a href={links.mailto} className="rounded-full bg-[var(--accent)] px-5 py-2 font-mono text-xs text-[var(--bg)]">{dict.footer.sayHello} ↗</a></div>
      </div>
      <div className="flex flex-col gap-2 pt-5 font-mono text-[11px] text-[var(--ink-faint)] md:flex-row md:items-center md:justify-between"><span>© 2026 {dict.footer.rights} (coffee1337)</span><span>{dict.footer.builtWith}</span><span>⌘K</span></div>
    </motion.div>
  </footer>;
}
