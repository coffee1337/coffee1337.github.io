import { useSite } from "../../context/site";
import { useReveal } from "../../hooks/useMotion";

export function Stack() {
  const { dict } = useSite();
  const ref = useReveal<HTMLElement>();
  const marquee = dict.stack.groups.flatMap((g) => g.items);

  return (
    <section id="stack" data-section="stack" ref={ref} className="section-anchor relative z-[2] bg-[var(--bg)] py-24 md:py-32">
      <div className="site-wrap">
        <p className="kicker">
          {dict.stack.index} — {dict.stack.label}
        </p>
        <h2 data-reveal className="display mt-4 max-w-4xl text-[clamp(2.6rem,5vw,5rem)]">
          {dict.stack.title}
        </h2>
      </div>

      <div className="mt-10 overflow-hidden border-y border-[var(--line)] py-3">
        <div className="marquee flex w-max gap-8">
          {[...marquee, ...marquee].map((item, i) => (
            <span key={`${item}-${i}`} className="mono text-[12px] text-[var(--muted)]">
              {item}
              <span className="mx-8 text-[var(--lime)]">/</span>
            </span>
          ))}
        </div>
      </div>

      <div className="site-wrap mt-12 grid gap-x-16 gap-y-12 md:grid-cols-2">
        {dict.stack.groups.map((group) => (
          <div key={group.name}>
            <h3 className="display text-3xl">{group.name}</h3>
            <ul className="mt-4">
              {group.items.map((item, i) => (
                <li key={item} data-reveal className="stack-item">
                  <span className="text-lg">{item}</span>
                  <span className="idx mono text-[10px] text-[var(--faint)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
