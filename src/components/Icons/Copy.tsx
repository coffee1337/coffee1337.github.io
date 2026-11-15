import type { IconProps } from "./types";

/** Copy — two offset sheets. */
export function Copy({ className }: IconProps) {
  return (
    <svg
      className={className}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="8.6" y="8.6" width="11.2" height="11.2" />
      <path d="M15.4 5.6V3.2H3.4v12.2h2.4" />
    </svg>
  );
}
