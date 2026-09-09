/**
 * @file EmptyState.jsx
 * @description Reusable empty-state card component.
 *
 * Replaces the ad-hoc inline empty div in Feed.jsx with a composable component
 * that accepts a custom icon, title, description, and optional call-to-action.
 *
 * @param {object}    props
 * @param {string}    props.icon        - Emoji or text icon displayed at the top.
 * @param {string}    props.title       - Bold heading (e.g. "No posts found").
 * @param {string}    props.description - Supporting detail text.
 * @param {string}    [props.ctaLabel]  - Button label. Omit to hide the button.
 * @param {Function}  [props.onCta]     - Click handler for the CTA button.
 *
 * @example
 * <EmptyState
 *   icon="📭"
 *   title="No posts yet"
 *   description="Be the first to share something."
 *   ctaLabel="Create a Post"
 *   onCta={scrollToComposer}
 * />
 */

import React from "react";
import styles from "./shared.module.css";

export default function EmptyState({ icon, title, description, ctaLabel, onCta }) {
  return (
    <div className={styles.emptyState} role="status">
      {/* Visual icon — emoji or text glyph */}
      {icon && <span className={styles.emptyStateIcon} aria-hidden="true">{icon}</span>}

      <h3 className={styles.emptyStateTitle}>{title}</h3>
      <p className={styles.emptyStateDesc}>{description}</p>

      {/* Optional call-to-action button */}
      {ctaLabel && onCta && (
        <button
          type="button"
          className={styles.emptyStateCta}
          onClick={onCta}
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
