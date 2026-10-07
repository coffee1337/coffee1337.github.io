import { links } from "../../content";
import { useSite } from "../../context/site";
import { useMagnetic, useReveal } from "../../hooks/useMotion";
import { CopyButton } from "../CopyButton";
import { NeuralMark } from "../Brand/NeuralMark";

export function Contact() {
  const { dict } = useSite();
  const ref = useReveal<HTMLElement>();
  const cta = useMagnetic<HTMLAnchorElement>();
  const c = dict.contact;

  return (
    <section id="contact" data-section="contact" ref={ref} className="section-anchor relative z-[2] py-24 md:py-36">
      <div className="site-wrap">
        <div className="flex items-center justify-between">
          <p className="kicker">{c.index} — {c.label}</p>
          <NeuralMark className="h-8 w-8 text-[var(--text)]" />
        </div>
        <h2 data-reveal className="display mt-6 max-w-5xl text-[clamp(2.8rem,7vw,6.4rem)]">{c.title}</h2>
        <p data-reveal className="mt-6 flex items-center gap-3 text-[var(--muted)]">
          <span className="status-dot" aria-hidden />
          {c.status}
        </p>
        <div data-reveal className="mt-8 flex flex-wrap gap-3">
          <a ref={cta} className="btn btn-primary" href={links.mailto}>{c.cta}</a>
          <a className="btn btn-ghost" href={links.github} target="_blank" rel="noopener noreferrer">{c.github}</a>
        </div>
        <ul className="mt-14 border-t border-[var(--line)]">
          <Row label={c.email} value={links.email} href={links.mailto} copyValue={links.email} copyLabel={c.copyEmail} copiedLabel={c.copied} />
          <Row label="GitHub" value="coffee1337" href={links.github} external />
          <Row label={c.linkedin} value="in/coffee1337" href={links.linkedin} external />
          <Row label={c.telegram} value={links.telegramHandle} href={links.telegram} external copyValue={links.telegramHandle} copyLabel={c.copyTelegram} copiedLabel={c.copied} />
          <Row label={c.resume} value="resume" href={links.resumeRepo} external />
        </ul>
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  href,
  external = false,
  copyValue,
  copyLabel,
  copiedLabel,
}: {
  label: string;
  value: string;
  href: string;
  external?: boolean;
  copyValue?: string;
  copyLabel?: string;
  copiedLabel?: string;
}) {
  return (
    <li data-reveal className="contact-line">
      <a href={href} className="contact-row" {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        <span className="kicker">{label}</span>
        <span className="contact-value">{value}</span>
      </a>
      {copyValue && copyLabel && copiedLabel && (
        <CopyButton value={copyValue} label={copyLabel} copiedLabel={copiedLabel} />
      )}
    </li>
  );
}
