import { useSite } from "../../context/site";
import { useReveal } from "../../hooks/useMotion";
import { ScrambleHeading } from "../Scramble/ScrambleHeading";
import { StackKeyboard } from "./StackKeyboard";

export function Stack() {
  const { dict } = useSite();
  const ref = useReveal<HTMLElement>();

  return (
    <section id="stack" data-section="stack" ref={ref} className="section-anchor relative z-[2] py-20 md:py-28">
      <div className="site-wrap">
        <div className="mb-8 flex items-baseline justify-between gap-4">
          <p className="kicker">§{dict.stack.index} / {dict.stack.label}</p>
          <p className="mono text-[10px] text-[var(--ink-faint)]">{dict.stack.label}</p>
        </div>

        <ScrambleHeading text={dict.stack.title} className="display max-w-[22ch] text-[clamp(2rem,4.2vw,3.6rem)]" />

        <div className="mt-10">
          <StackKeyboard />
        </div>

        <div id="capabilities" className="mt-8 grid scroll-mt-24 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {dict.capabilities.items.map((item) => (
            <article key={item.index} data-reveal className="border border-[var(--line)] bg-[var(--bg)] p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">{item.index}</p>
              <h3 className="mt-2 font-display text-lg">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--ink-dim)]">{item.body}</p>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--ink-faint)]">{item.tags}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
