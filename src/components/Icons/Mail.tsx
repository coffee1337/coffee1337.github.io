import type { IconProps } from "./types";

/** Mail — envelope, 1.4 hairline, square corners. */
export function Mail({ className }: IconProps) {
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
      aria-hidden="true"
      focusable="false"
    >
      <rect x="2.7" y="5.2" width="18.6" height="13.6" />
      <path d="M3.2 5.9 12 12.4l8.8-6.5" />
    </svg>
  );
}
