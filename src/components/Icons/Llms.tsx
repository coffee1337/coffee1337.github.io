import type { IconProps } from "./types";

/** Llms — document with angle brackets: text version of the site for models. */
export function Llms({ className }: IconProps) {
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
      <path d="M10.2 12.4 8.1 15.1l2.1 2.7M14 12.4l2.1 2.7-2.1 2.7" />
    </svg>
  );
}
