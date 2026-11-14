import { useState } from "react";
import { useToast } from "./Toast/ToastProvider";

export function CopyButton({ value, label, copiedLabel, className = "" }: { value: string; label: string; copiedLabel: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast(`✓ ${copiedLabel}: ${value}`);
      window.setTimeout(() => setCopied(false), 1500);
    } catch { setCopied(false); }
  };
  return <button type="button" className={`copy-btn ${className}`} onClick={() => void onCopy()} aria-label={copied ? copiedLabel : label}><span aria-live="polite">{copied ? copiedLabel : label}</span></button>;
}
