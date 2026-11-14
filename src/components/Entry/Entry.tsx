import { links } from "../../content";
import { useSite } from "../../context/site";
import { useReveal } from "../../hooks/useMotion";
import { ScrambleHeading } from "../Scramble/ScrambleHeading";

const TARGETS: Record<string, string> = {
  hire: "#about",
  freelance: "#contact",
  code: "#projects",
};

export function Entry() {
  const { dict } = useSite();
  const ref = useReveal<HTMLElement>({ stagger: 0.06 });
  const entry = dict.sections.entry;

  const onCard = (id: string) => {
    if (id === "hire") {
      window.open(links.resumePdf, "_blank", "noopener,noreferrer");
      return;
    }
    if (id === "freelance") {
      window.dispatchEvent(new CustomEvent("contact-topic", { detail: "project" }));
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    document.getElementById("projects")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="entry" data-section="entry" ref={ref} className="section-anchor relative z-[2] py-20 md:py-28">
      <div className="site-wrap">
        <div className="mb-10 flex items-baseline justify-between gap-4">
          <p className="kicker">§{entry.index} / {entry.label}</p>
          <p className="mono text-[10px] text-[var(--ink-faint)]">{entry.label}</p>
        </div>

        <ScrambleHeading text={entry.title} className="display text-[clamp(2rem,4vw,3.4rem)]" />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {entry.cards.map((card) => (
            <a
              key={card.id}
              href={TARGETS[card.id]}
              onClick={(event) => {
                event.preventDefault();
                onCard(card.id);
              }}
              data-reveal
              className="group relative flex min-h-[190px] flex-col justify-between border border-[var(--line)] bg-[var(--bg-2)] p-5 transition-colors hover:border-[var(--accent)]"
            >
              <span className="absolute left-0 top-0 h-full w-0.5 origin-top scale-y-0 bg-[var(--accent)] transition-transform duration-300 group-hover:scale-y-100" />
              <h3 className="font-display text-xl">{card.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--ink-dim)]">{card.body}</p>
              <span className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--accent)]">
                {card.action}
                <span className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5">↗</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
