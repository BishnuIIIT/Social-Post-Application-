/**
 * @file Spinner.jsx
 * @description Accessible animated loading spinner using an inline SVG.
 * Screen readers announce "Loading…" via an aria-label.
 *
 * @param {object} props
 * @param {number} [props.size=20]    - SVG width/height in pixels.
 * @param {string} [props.color]      - Stroke colour; defaults to current CSS colour.
 * @param {string} [props.className]  - Extra CSS class(es) to merge.
 */

import React from "react";
import styles from "./shared.module.css";

/**
 * @param {{ size?: number, color?: string, className?: string }} props
 */
export default function Spinner({ size = 20, color = "currentColor", className = "" }) {
  return (
    <svg
      className={`${styles.spinner} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      aria-label="Loading…"
      role="status"
    >
      {/* Full circle track */}
      <circle cx="12" cy="12" r="9" opacity={0.2} />
      {/* Partial arc that animates */}
      <path d="M12 3a9 9 0 0 1 9 9" />
    </svg>
  );
}
