import { useEffect, useState } from "react";
import { useSite } from "../../context/site";
import { links } from "../../content";

type Topic = "hire" | "project" | "other";
type State = "idle" | "sending" | "success" | "error";

const KEY = import.meta.env.VITE_WEB3FORMS_KEY as string | undefined;
const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined;
const PROVIDER = (import.meta.env.VITE_CONTACT_PROVIDER as string | undefined) ?? (KEY ? "web3forms" : ENDPOINT ? "custom" : "none");

export function ContactForm() {
  const { dict } = useSite();
  const f = dict.sections.contactForm;
  const [topic, setTopic] = useState<Topic>("hire");
  const [state, setState] = useState<State>("idle");
  const [honeypot, setHoneypot] = useState("");

  useEffect(() => {
    const onTopic = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail === "hire" || detail === "project" || detail === "other") setTopic(detail);
    };
    window.addEventListener("contact-topic", onTopic);
    return () => window.removeEventListener("contact-topic", onTopic);
  }, []);

  const subject = `${f.topics[topic]} — coffee1337.github.io`;

  if (PROVIDER === "none") {
    return (
      <div className="border border-[var(--line)] bg-[var(--bg-2)] p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">{f.title}</p>
        <p className="mt-3 text-sm text-[var(--ink-dim)]">{f.unavailable}</p>
        <a
          href={`${links.mailto}?subject=${encodeURIComponent(subject)}`}
          className="mt-5 inline-flex rounded-full bg-[var(--accent)] px-5 py-2 font-mono text-[11px] uppercase text-[var(--bg)]"
        >
          {f.mailtoCta} ↗
        </a>
      </div>
    );
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (honeypot) return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || ""),
      email: String(data.get("email") || ""),
      topic,
      message: String(data.get("message") || ""),
      subject,
    };

    setState("sending");
    try {
      if (PROVIDER === "web3forms" && KEY) {
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({
            access_key: KEY,
            from_name: "coffee1337.github.io",
            ...payload,
            botcheck: false,
          }),
        });
        if (!response.ok) throw new Error("web3forms");
      } else if (ENDPOINT) {
        const response = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("custom");
      } else {
        throw new Error("not_configured");
      }
      setState("success");
      form.reset();
    } catch {
      setState("error");
    }
  };

  const field = "w-full border border-[var(--line)] bg-[var(--bg)] px-3 py-2 font-mono text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]";
  const label = "font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]";

  return (
    <form onSubmit={onSubmit} className="border border-[var(--line)] bg-[var(--bg-2)] p-6" noValidate>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">{f.title}</p>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-1.5">
          <span className={label}>{f.name}</span>
          <input name="name" required autoComplete="name" className={field} />
        </label>

        <label className="grid gap-1.5">
          <span className={label}>{f.email}</span>
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>

        <div className="grid gap-1.5">
          <span className={label}>{f.topic}</span>
          <div className="flex flex-wrap gap-2" role="group" aria-label={f.topic}>
            {(["hire", "project", "other"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTopic(value)}
                aria-pressed={topic === value}
                className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase ${
                  topic === value
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--bg)]"
                    : "border-[var(--line)] text-[var(--ink-dim)]"
                }`}
              >
                {f.topics[value]}
              </button>
            ))}
          </div>
        </div>

        <label className="grid gap-1.5">
          <span className={label}>{f.message}</span>
          <textarea name="message" required rows={5} className={`${field} resize-y`} />
        </label>

        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
          className="hidden"
        />

        <button
          type="submit"
          disabled={state === "sending"}
          className="mt-1 rounded-full bg-[var(--accent)] px-5 py-2 font-mono text-[11px] uppercase text-[var(--bg)] disabled:opacity-60"
        >
          {state === "sending" ? f.sending : f.send}
        </button>

        <p role="status" aria-live="polite" className="min-h-[1.2em] font-mono text-[11px] text-[var(--ink-dim)]">
          {state === "success" && <span className="text-[var(--ok)]">{f.success}</span>}
          {state === "error" && <span className="text-[var(--accent)]">{f.error}</span>}
          {state === "idle" && f.privacy}
        </p>
      </div>
    </form>
  );
}
