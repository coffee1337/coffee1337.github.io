import type { IconProps } from "./types";

/** Resume — document sheet with folded corner and text lines. */
export function Resume({ className }: IconProps) {
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
      <path d="M5.8 2.9h7.6l4.8 4.8v13.4H5.8z" />
      <path d="M13.2 3.1v4.9h4.9" />
      <path d="M8.6 12.2h6M8.6 15.1h6M8.6 18h3.8" />
    </svg>
  );
}
