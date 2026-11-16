import type { ReactNode } from "react";
import { links } from "../../content";
import { useSite } from "../../context/site";
import { useMagnetic, useReveal } from "../../hooks/useMotion";
import { CopyButton } from "../CopyButton";
import { ScrambleHeading } from "../Scramble/ScrambleHeading";
import { NeuralMark } from "../Brand/NeuralMark";
import { GitHub, LinkedIn, Mail, Resume, Telegram } from "../Icons";
import { ContactForm } from "./ContactForm";
import { trackEvent } from "../../analytics";

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
          <NeuralMark className="h-8 w-8 text-[var(--ink)]" />
        </div>
        <ScrambleHeading data-reveal text={c.title} className="display mt-6 max-w-5xl text-[clamp(2.8rem,7vw,6.4rem)]" />
        <p data-reveal className="mt-6 flex items-center gap-3 text-[var(--ink-dim)]">
          <span className="status-dot" aria-hidden />
          {c.status}
        </p>
        <div data-reveal className="mt-8 flex flex-wrap gap-3">
          <a ref={cta} className="btn btn-primary" href={links.mailto} onClick={() => trackEvent("social_click", { network: "mailto", section: "contact" })} data-track="social_mailto_contact">{c.cta}</a>
          <a className="btn btn-ghost" href={links.github} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("social_click", { network: "github", section: "contact" })} data-track="social_github_contact">{c.github}</a>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div data-reveal><ContactForm /></div>
          <ul className="border-t border-[var(--line)]">
          <Row icon={<Mail className="h-4 w-4" />} label={c.email} value={links.email} href={links.mailto} network="mailto" copyValue={links.email} copyLabel={c.copyEmail} copiedLabel={c.copied} />
          <Row icon={<GitHub className="h-4 w-4" />} label="GitHub" value="coffee1337" href={links.github} external network="github" />
          <Row icon={<LinkedIn className="h-4 w-4" />} label={c.linkedin} value="in/coffee1337" href={links.linkedin} external network="linkedin" />
          <Row icon={<Telegram className="h-4 w-4" />} label={c.telegram} value={links.telegramHandle} href={links.telegram} external network="telegram" copyValue={links.telegramHandle} copyLabel={c.copyTelegram} copiedLabel={c.copied} />
            <Row icon={<Resume className="h-4 w-4" />} label={c.resume} value="resume" href={links.resumeRepo} external resumeRepo />
          </ul>
        </div>
      </div>
    </section>
  );
}

function Row({
  icon,
  label,
  value,
  href,
  external = false,
  network,
  resumeRepo = false,
  copyValue,
  copyLabel,
  copiedLabel,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href: string;
  external?: boolean;
  network?: "mailto" | "github" | "linkedin" | "telegram";
  resumeRepo?: boolean;
  copyValue?: string;
  copyLabel?: string;
  copiedLabel?: string;
}) {
  const onFollow = () => {
    if (network) {
      trackEvent("social_click", { network, section: "contact" });
      return;
    }
    if (resumeRepo) trackEvent("resume", { action: "view_repo", section: "contact" });
  };
  return (
    <li data-reveal className="contact-line">
      <a
        href={href}
        className="contact-row group"
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        onClick={onFollow}
        data-track={network ? `social_${network}` : resumeRepo ? "resume_repo_contact" : undefined}
      >
        <span className="inline-flex items-center gap-2.5">
          <span className="inline-flex shrink-0 text-[var(--ink-faint)] transition-colors duration-300 group-hover:text-[var(--accent)]">{icon}</span>
          <span className="kicker">{label}</span>
        </span>
        <span className="contact-value">{value}</span>
      </a>
      {copyValue && copyLabel && copiedLabel && (
        <CopyButton value={copyValue} label={copyLabel} copiedLabel={copiedLabel} />
      )}
    </li>
  );
}
