/**
 * @file Avatar.jsx
 * @description A circular avatar component that displays the user's initial
 * inside a deterministic colour picked from the avatar palette in utils.js.
 *
 * @param {object}  props
 * @param {string}  props.name   - Username used to derive the colour and letter.
 * @param {"lg"|"md"|"sm"} [props.size="md"] - Size variant.
 * @param {string}  [props.className]   - Extra CSS class(es) to merge.
 */

import React from "react";
import { initials, avatarColors } from "../../utils.js";
import styles from "./shared.module.css";

/**
 * Renders a coloured circle with the user's first initial.
 *
 * @param {{ name: string, size?: "lg" | "md" | "sm", className?: string }} props
 */
export default function Avatar({ name = "?", size = "md", className = "" }) {
  const { bg, fg } = avatarColors(name);
  let sizeClass = styles.avatarMd;
  if (size === "sm") sizeClass = styles.avatarSm;
  if (size === "lg") sizeClass = styles.avatarLg;

  return (
    <div
      className={`${styles.avatar} ${sizeClass} ${className}`}
      style={{ background: bg, color: fg }}
      aria-label={`Avatar for ${name}`}
    >
      {initials(name)}
    </div>
  );
}
