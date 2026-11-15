import { useEffect, useState } from "react";
import { useSite } from "../../context/site";
import { links } from "../../content";
import { CopyButton } from "../CopyButton";

type Topic = "hire" | "project" | "other";
type Field = "name" | "email" | "message";
type State = "idle" | "sending" | "sent" | "mailto" | "error";

const KEY = import.meta.env.VITE_WEB3FORMS_KEY as string | undefined;
const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined;
const PROVIDER = (import.meta.env.VITE_CONTACT_PROVIDER as string | undefined) ?? (KEY ? "web3forms" : ENDPOINT ? "custom" : "none");

export function ContactForm() {
  const { dict } = useSite();
  const f = dict.sections.contactForm;
  const [topic, setTopic] = useState<Topic>("hire");
  const [state, setState] = useState<State>("idle");
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});

  useEffect(() => {
    const onTopic = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail;
      if (detail === "hire" || detail === "project" || detail === "other") setTopic(detail);
    };
    window.addEventListener("contact-topic", onTopic);
    return () => window.removeEventListener("contact-topic", onTopic);
  }, []);

  const subject = `${f.topics[topic]} — coffee1337.github.io`;

  const setError = (field: Field, message: string) =>
    setErrors((prev) => (prev[field] === message ? prev : { ...prev, [field]: message }));

  const clearError = (field: Field) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  /** Нативная валидация остаётся включённой; здесь мы дублируем её сообщением под полем. */
  const onInvalid =
    (field: Field) => (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      event.preventDefault();
      const el = event.currentTarget;
      setError(field, el.validity.valueMissing || el.validity.tooShort ? f.errRequired : f.errEmail);
    };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (honeypot) return;

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      topic,
      message: String(data.get("message") || "").trim(),
      subject,
    };

    // Без внешнего провайдера форма работает через почтовый клиент пользователя.
    if (PROVIDER === "none") {
      const mailSubject = `[Portfolio] ${f.topics[topic]} — ${payload.name}`;
      const mailBody = `${payload.message}\n\n---\nFrom: ${payload.name} (${payload.email})`;
      window.location.href = `${links.mailto}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(mailBody)}`;
      setState("mailto");
      return;
    }

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
      setState("sent");
      form.reset();
    } catch {
      setState("error");
    }
  };

  const baseField =
    "w-full border bg-[var(--bg)] px-3 py-2 font-mono text-sm text-[var(--ink)] outline-none focus:border-[var(--accent)]";
  const field = (name: Field) =>
    `${baseField} ${errors[name] ? "border-[var(--accent)]" : "border-[var(--line)]"}`;
  const label = "font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]";
  const errorText = "font-mono text-[10px] leading-relaxed text-[var(--accent)]";

  return (
    <form onSubmit={onSubmit} className="border border-[var(--line)] bg-[var(--bg-2)] p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ink-faint)]">{f.title}</p>

      <div className="mt-5 grid gap-4">
        <label className="grid gap-1.5">
          <span className={label}>{f.name}</span>
          <input
            name="name"
            required
            minLength={2}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "contact-err-name" : undefined}
            className={field("name")}
            onInvalid={onInvalid("name")}
            onInput={() => clearError("name")}
          />
          {errors.name && (
            <span id="contact-err-name" role="alert" className={errorText}>
              {errors.name}
            </span>
          )}
        </label>

        <label className="grid gap-1.5">
          <span className={label}>{f.email}</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "contact-err-email" : undefined}
            className={field("email")}
            onInvalid={onInvalid("email")}
            onInput={() => clearError("email")}
          />
          {errors.email && (
            <span id="contact-err-email" role="alert" className={errorText}>
              {errors.email}
            </span>
          )}
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
          <textarea
            name="message"
            required
            minLength={10}
            rows={5}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "contact-err-message" : undefined}
            className={`${field("message")} resize-y`}
            onInvalid={onInvalid("message")}
            onInput={() => clearError("message")}
          />
          {errors.message && (
            <span id="contact-err-message" role="alert" className={errorText}>
              {errors.message}
            </span>
          )}
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

        <div role="status" aria-live="polite" className="min-h-[1.2em] font-mono text-[11px] text-[var(--ink-dim)]">
          {state === "sent" && <span className="text-[var(--ok)]">{f.success}</span>}
          {state === "error" && <span className="text-[var(--accent)]">{f.error}</span>}
          {state === "idle" && f.privacy}
          {state === "mailto" && (
            <span className="flex flex-wrap items-center gap-2">
              <span>{f.mailtoOpened}</span>
              <CopyButton value={links.email} label={dict.contact.copyEmail} copiedLabel={dict.contact.copied} />
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
