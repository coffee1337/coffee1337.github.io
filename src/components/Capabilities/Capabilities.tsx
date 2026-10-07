import { useSite } from "../../context/site";
import { useReveal } from "../../hooks/useMotion";

export function Capabilities() {
  const { dict } = useSite();
  const ref = useReveal<HTMLElement>();
  const cap = dict.capabilities;
  return (
    <section id="capabilities" data-section="capabilities" ref={ref} className="section-anchor relative z-[2] py-20 md:py-28">
      <div className="site-wrap">
        <p className="kicker">{cap.index} — {cap.label}</p>
        <h2 data-reveal className="display mt-4 text-[clamp(2.4rem,5vw,4.4rem)]">{cap.title}</h2>
        <div className="mt-12 grid border-t border-[var(--line)] md:grid-cols-3">
          {cap.items.map((item) => (
            <article key={item.index} data-reveal className="cap-col">
              <div className="flex items-baseline justify-between gap-3">
                <span className="mono text-[10px] text-[var(--faint)]">{item.index}</span>
                <span className="cap-rule" aria-hidden />
              </div>
              <h3 className="display mt-6 text-3xl md:text-4xl">{item.title}</h3>
              <p className="mono mt-4 text-[10px] text-[var(--accent)]">{item.tags}</p>
              <p className="mt-4 text-[var(--muted)]">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
