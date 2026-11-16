import { useState } from "react";
import { useToast } from "./Toast/ToastProvider";
import { trackEvent } from "../analytics";

/** Телеграм-хэндл всегда начинается с «@», адрес почты — нет. */
function channelOf(value: string): "email" | "telegram" {
  return value.trim().startsWith("@") ? "telegram" : "email";
}

export function CopyButton({ value, label, copiedLabel, className = "" }: { value: string; label: string; copiedLabel: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      trackEvent("contact_copy", { channel: channelOf(value), value });
      setCopied(true);
      toast(`✓ ${copiedLabel}: ${value}`);
      window.setTimeout(() => setCopied(false), 1500);
    } catch { setCopied(false); }
  };
  return <button type="button" className={`copy-btn ${className}`} onClick={() => void onCopy()} aria-label={copied ? copiedLabel : label} data-track="contact_copy"><span aria-live="polite">{copied ? copiedLabel : label}</span></button>;
}
