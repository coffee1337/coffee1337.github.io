import { links } from "../content";
import { useSite } from "../context/site";
import { NeuralMark } from "./Brand/NeuralMark";

export function NotFound() {
  const { dict } = useSite();
  const page = dict.a11y.notFound;
  return (
    <main className="grid min-h-[100svh] place-items-center px-6">
      <div className="max-w-xl text-center">
        <NeuralMark className="mx-auto h-16 w-16 text-[var(--text)]" />
        <p className="kicker mt-8">404</p>
        <h1 className="display mt-4 text-5xl md:text-7xl">{page.title}</h1>
        <p className="mt-4 text-[var(--muted)]">{page.body}</p>
        <a className="btn btn-primary mt-8" href={links.site}>{page.back}</a>
      </div>
    </main>
  );
}
