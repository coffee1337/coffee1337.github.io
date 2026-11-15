import type { IconProps } from "./types";
import "./PixelCup.css";

/**
 * Pixel cup: 16x16 grid, 1 unit step = one clean pixel.
 * Rects never overlap (body outline, handle, saucer, steam), so there is no
 * double fill and no muddy edges. Steam is three columns that rise in steps
 * and fade; static under prefers-reduced-motion.
 */
export function PixelCup({ className }: IconProps) {
  return (
    <svg
      className={`pixel-cup${className ? ` ${className}` : ""}`}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g className="pixel-cup__steam">
        <rect className="pixel-cup__puff" x="4" y="2" width="1" height="2" />
        <rect className="pixel-cup__puff" x="6" y="2" width="1" height="2" />
        <rect className="pixel-cup__puff" x="8" y="2" width="1" height="2" />
      </g>
      <g className="pixel-cup__body">
        <rect x="2" y="4" width="9" height="1" />
        <rect x="2" y="5" width="1" height="7" />
        <rect x="10" y="5" width="1" height="7" />
        <rect x="3" y="12" width="7" height="1" />
      </g>
      <g className="pixel-cup__handle">
        <rect x="11" y="6" width="2" height="1" />
        <rect x="13" y="7" width="1" height="2" />
        <rect x="11" y="9" width="2" height="1" />
      </g>
      <rect className="pixel-cup__saucer" x="1" y="13" width="13" height="1" />
    </svg>
  );
}
