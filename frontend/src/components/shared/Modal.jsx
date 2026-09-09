import React, { useEffect } from "react";
import styles from "./shared.module.css";

/**
 * Reusable accessible Modal dialog.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {string|React.ReactNode} props.title
 * @param {React.ReactNode} props.children
 * @param {number|string} [props.maxWidth=440]
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 440,
}) {
  // Close on Escape key and prevent background scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={styles.modalContent}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
}
