/**
 * @file ErrorMessage.jsx
 * @description Reusable inline error message component.
 *
 * Replaces scattered inline `<p style={{ color: "var(--color-error)" }}>` patterns
 * across Auth, Composer, CommentList, and Feed with a single accessible component.
 *
 * @param {object}  props
 * @param {string}  props.message   - The error string to display.
 * @param {string}  [props.className] - Optional additional CSS class.
 *
 * @example
 * {error && <ErrorMessage message={error} />}
 */

import React from "react";
import styles from "./shared.module.css";

export default function ErrorMessage({ message, className = "" }) {
  if (!message) return null;

  return (
    <p
      className={`${styles.errorMessage} ${className}`}
      role="alert"
      aria-live="polite"
    >
      {/* Warning icon for quick visual recognition */}
      <span aria-hidden="true">⚠</span>
      <span>{message}</span>
    </p>
  );
}
