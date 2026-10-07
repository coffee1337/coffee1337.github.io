import { useState } from "react";

export function CopyButton({
  value,
  label,
  copiedLabel,
}: {
  value: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button type="button" className="copy-btn" onClick={() => void onCopy()} aria-label={copied ? copiedLabel : label}>
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </button>
  );
}
