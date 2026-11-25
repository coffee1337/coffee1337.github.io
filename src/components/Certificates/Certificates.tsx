import { useState } from "react";
import { useSite } from "../../context/site";
import { useReveal } from "../../hooks/useMotion";
import { ScrambleHeading } from "../Scramble/ScrambleHeading";
import { trackEvent } from "../../analytics";
import type { CertificateCategory, CertificateItem, CertificateLink } from "../../content/types";

type FilterId = "all" | CertificateCategory;

const FILTERS: readonly FilterId[] = ["all", "ip", "ai", "cloud"];

/**
 * §05 / СЕРТИФИКАТЫ: государственная регистрация БД Роспатента как главный артефакт
 * и сетка вендорских сертификатов. Все строки — из словаря, ссылки — из данных.
 */
export function Certificates() {
  const { dict, pathBase } = useSite();
  const t = dict.sections.certificates;
  const ref = useReveal<HTMLElement>();
  const [filter, setFilter] = useState<FilterId>("all");

  const featured = t.items.find((item) => item.featured);
  const rest = t.items.filter((item) => !item.featured);
  const featuredVisible = Boolean(featured) && (filter === "all" || filter === featured?.category);
  const visible = rest.filter((item) => filter === "all" || item.category === filter);
  const total = String(t.items.length).padStart(2, "0");

  const changeFilter = (next: FilterId) => {
    trackEvent("certificate_filter", { filter: next });
    setFilter(next);
  };

  const hrefOf = (link: CertificateLink) => (link.kind === "case" ? `${pathBase}${link.href}` : link.href);
  const isExternal = (link: CertificateLink) => link.kind !== "case";

  return (
    <section
      id="certificates"
      data-section="certificates"
      ref={ref}
      className="section-anchor relative z-[2] py-20 md:py-28"
    >
      <div className="site-wrap">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="kicker">§{t.index} / {t.label}</p>
            <ScrambleHeading text={t.title} className="display mt-3 text-[clamp(2.2rem,5vw,4.4rem)]" />
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--ink-dim)]">{t.lead}</p>
          </div>
          <p
            className="mono text-[10px] tabular-nums text-[var(--ink-faint)]"
            aria-label={`${t.items.length} ${t.countLabel}`}
          >
            {total}
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label={t.filterLabel}>
          {FILTERS.map((id) => {
            const pressed = filter === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => changeFilter(id)}
                aria-pressed={pressed}
                data-track={`certificate_filter_${id}`}
                className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors ${
                  pressed
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]"
                    : "border-[var(--line)] text-[var(--ink-dim)] hover:border-[var(--accent)] hover:text-[var(--ink)]"
                }`}
              >
                {t.filters[id]}
              </button>
            );
          })}
        </div>

        {featuredVisible && featured && (
          <article className="border border-[var(--line)] border-l-2 border-l-[var(--accent)] bg-[var(--bg-2)]">
            <div className="flex flex-wrap items-center gap-3 border-b border-[var(--line)] px-5 py-3 md:px-7">
              <span className="font-pixel text-[10px] uppercase tracking-[0.08em] text-[var(--accent)]">
                {featured.badge}
              </span>
              <span className="mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                {t.labels.issued}: {featured.issuer}
              </span>
              <span className="mono ml-auto text-[10px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">
                {featured.date}
              </span>
            </div>

            <div className="grid gap-8 px-5 py-6 md:px-7 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <h3 className="font-display text-xl leading-tight md:text-2xl">{featured.title}</h3>
                {featured.subtitle && (
                  <p className="mt-3 text-sm leading-relaxed text-[var(--ink-dim)]">{featured.subtitle}</p>
                )}
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {featured.tags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-[var(--line)] px-2.5 py-0.5 font-mono text-[10px] text-[var(--ink-dim)]"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap gap-2">
                  {featured.links.map((link, index) => (
                    <a
                      key={`${link.kind}-${link.href}`}
                      href={hrefOf(link)}
                      target={isExternal(link) ? "_blank" : undefined}
                      rel={isExternal(link) ? "noopener noreferrer" : undefined}
                      onClick={() =>
                        trackEvent("certificate_click", {
                          id: featured.id,
                          issuer: featured.issuer,
                          section: "certificates",
                          target: link.kind,
                        })
                      }
                      data-track={`certificate_${link.kind}`}
                      className={
                        index === 0
                          ? "rounded-full bg-[var(--accent)] px-4 py-2 font-mono text-[11px] uppercase text-[var(--bg)]"
                          : "rounded-full border border-[var(--line)] px-4 py-2 font-mono text-[11px] uppercase text-[var(--ink)] hover:border-[var(--accent)]"
                      }
                    >
                      {link.label} ↗
                    </a>
                  ))}
                </div>
              </div>

              {featured.meta && (
                <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                  {featured.meta.map((row) => (
                    <div key={row.label} className="border-t border-[var(--line)] pt-2">
                      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                        {row.label}
                      </dt>
                      <dd className="mt-1 text-sm text-[var(--ink)]">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </article>
        )}

        {visible.length > 0 && (
          <ul className="mt-6 grid gap-px border border-[var(--line)] bg-[var(--line)] md:grid-cols-2 lg:grid-cols-3">
            {visible.map((item) => (
              <CertificateCard key={item.id} item={item} issuedLabel={t.labels.awarded} hrefOf={hrefOf} isExternal={isExternal} />
            ))}
          </ul>
        )}

        {!featuredVisible && visible.length === 0 && (
          <p className="mt-6 border-t border-[var(--line)] pt-6 font-mono text-xs text-[var(--ink-faint)]">
            {t.labels.empty}
          </p>
        )}
      </div>
    </section>
  );
}

function CertificateCard({
  item,
  issuedLabel,
  hrefOf,
  isExternal,
}: {
  item: CertificateItem;
  issuedLabel: string;
  hrefOf: (link: CertificateLink) => string;
  isExternal: (link: CertificateLink) => boolean;
}) {
  const verify = item.links[0];
  return (
    <li data-reveal className="flex flex-col bg-[var(--bg)] p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">{item.issuer}</span>
        <span className="font-pixel shrink-0 text-[9px] uppercase tracking-[0.08em] text-[var(--accent)]">
          {item.badge}
        </span>
      </div>

      <p className="mt-4 font-display text-lg leading-snug md:min-h-[3.2em]">{item.title}</p>
      <p className="mono mt-2 text-[10px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">
        {issuedLabel} {item.date}
      </p>

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {item.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full border border-[var(--line)] px-2 py-0.5 font-mono text-[10px] text-[var(--ink-dim)]"
          >
            {tag}
          </li>
        ))}
      </ul>

      {verify && (
        <div className="mt-auto pt-5">
          <a
            href={hrefOf(verify)}
            target={isExternal(verify) ? "_blank" : undefined}
            rel={isExternal(verify) ? "noopener noreferrer" : undefined}
            onClick={() =>
              trackEvent("certificate_click", { id: item.id, issuer: item.issuer, section: "certificates" })
            }
            data-track="certificate_verify"
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-dim)] hover:text-[var(--accent)]"
          >
            {verify.label} ↗
          </a>
        </div>
      )}
    </li>
  );
}