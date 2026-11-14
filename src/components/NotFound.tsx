import { links } from "../content";
import { useSite } from "../context/site";

export function NotFound() {
  const { dict } = useSite();
  const page = dict.a11y.notFound;
  return (
    <main className="grid min-h-[100svh] place-items-center px-6">
      <div className="max-w-xl text-center">
        <svg viewBox="0 0 64 64" className="mx-auto h-20 w-20" aria-hidden>
          <g fill="none" stroke="var(--ink-dim)" strokeWidth={1.5}>
            <path d="M14 24h28v18a8 8 0 0 1-8 8H22a8 8 0 0 1-8-8z" />
            <path d="M42 28h5a5 5 0 0 1 0 10h-5" />
            <path d="M22 40h12" stroke="var(--accent)" />
          </g>
          <circle cx={20} cy={56} r={1.4} fill="var(--accent)" opacity={0.5} />
          <circle cx={28} cy={58} r={1} fill="var(--accent)" opacity={0.35} />
        </svg>
        <p className="kicker mt-8">404</p>
        <h1 className="display mt-4 text-4xl md:text-6xl">{page.title}</h1>
        <p className="mt-4 text-[var(--ink-dim)]">{page.body}</p>
        <a className="btn btn-primary mt-8" href={links.site}>
          {page.back}
        </a>
      </div>
    </main>
  );
}
