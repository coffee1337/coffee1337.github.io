export function NeuralMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" fill="none" aria-hidden>
      <circle cx="32" cy="32" r="18" stroke="currentColor" strokeWidth="1.25" opacity="0.85" />
      <circle cx="32" cy="32" r="8" stroke="var(--accent)" strokeWidth="1" opacity="0.7" />
      <circle cx="32" cy="32" r="3.2" fill="var(--lime)" />
      <circle cx="32" cy="14" r="1.7" fill="currentColor" />
      <circle cx="48" cy="40" r="1.7" fill="currentColor" />
      <circle cx="17" cy="42" r="1.7" fill="currentColor" />
      <path d="M32 14 L32 29 M48 40 L35 33 M17 42 L29 34" stroke="var(--accent)" strokeWidth="0.8" opacity="0.7" />
    </svg>
  );
}
