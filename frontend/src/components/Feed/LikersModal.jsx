/**
 * @file LikersModal.jsx
 * @description Modal displaying the full list of usernames of users who liked a post.
 * Directly fulfills the requirement: "Save the usernames of people who liked or commented."
 *
 * @param {object}   props
 * @param {string[]} props.likedUsers - Array of usernames who liked the post.
 * @param {Function} props.onClose    - Modal close callback.
 */

import React from "react";
import Avatar from "../shared/Avatar.jsx";
import sharedStyles from "../shared/shared.module.css";

export default function LikersModal({ likedUsers = [], onClose }) {
  return (
    <div className={sharedStyles.modalOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={sharedStyles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={sharedStyles.modalHeader}>
          <h3 className={sharedStyles.modalTitle}>
            <span>❤️ Liked by ({likedUsers.length})</span>
          </h3>
          <button
            className={sharedStyles.modalCloseBtn}
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className={sharedStyles.modalBody}>
          {likedUsers.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", textAlign: "center", padding: "16px 0" }}>
              No likes yet.
            </p>
          ) : (
            likedUsers.map((username, index) => (
              <div key={`${username}-${index}`} className={sharedStyles.likerRow}>
                <Avatar name={username} size="sm" />
                <span className={sharedStyles.likerName}>@{username}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
