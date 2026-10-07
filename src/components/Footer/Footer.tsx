import { links } from "../../content";
import { useSite } from "../../context/site";
import { NeuralMark } from "../Brand/NeuralMark";

export function Footer() {
  const { dict } = useSite();
  const year = new Date().getFullYear();
  return (
    <footer className="relative z-[2] bg-[var(--bg)] pb-10">
      <div className="site-wrap flex flex-col gap-6 border-t border-[var(--line)] pt-8 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <NeuralMark className="h-10 w-10 text-[var(--text)]" />
          <div>
            <p className="display text-2xl leading-none">{dict.footer.rights}</p>
            <p className="mono mt-2 text-[10px] text-[var(--muted)]">{dict.footer.role}</p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-5 text-sm" aria-label="Social">
          <a className="text-link" href={links.github} target="_blank" rel="noopener noreferrer">GitHub</a>
          <a className="text-link" href={links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a className="text-link" href={links.telegram} target="_blank" rel="noopener noreferrer">Telegram</a>
        </nav>
        <p className="mono text-[10px] text-[var(--faint)]">© {year}</p>
      </div>
    </footer>
  );
}
