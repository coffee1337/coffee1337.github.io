import type { IconProps } from "./types";

/** ArrowUpRight — external link. */
export function ArrowUpRight({ className }: IconProps) {
  return (
    <svg
      className={className}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6.5 17.5 17.2 6.8M8.6 6.6h8.8v8.8" />
    </svg>
  );
}
