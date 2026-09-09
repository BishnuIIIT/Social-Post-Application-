import React from "react";
import Modal from "../shared/Modal.jsx";
import Avatar from "../shared/Avatar.jsx";
import sharedStyles from "../shared/shared.module.css";

/**
 * Modal displaying the list of users who liked a post.
 * Uses the reusable Modal dialog primitive.
 *
 * @param {object}   props
 * @param {string[]} props.likedUsers
 * @param {Function} props.onClose
 */
export default function LikersModal({ likedUsers = [], onClose }) {
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`❤️ Liked by (${likedUsers.length})`}
      maxWidth={420}
    >
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
    </Modal>
  );
}
