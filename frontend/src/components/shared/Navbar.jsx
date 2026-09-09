/**
 * @file Navbar.jsx
 * @description Sticky top navigation bar styled after the TaskPlanet app.
 *
 * Features:
 *  - TaskPlanet brand icon & wordmark with "Social" pill tag
 *  - Active user profile indicator with deterministic avatar
 *  - Responsive logout button
 *
 * @param {object}   props
 * @param {object}   props.user      - Authenticated user object.
 * @param {string}   props.user.username
 * @param {Function} props.onLogout  - Logout handler.
 */

import React from "react";
import Avatar from "./Avatar.jsx";
import styles from "./shared.module.css";

export default function Navbar({ user, onLogout }) {
  return (
    <header className={styles.nav}>
      {/* ── Brand & App Name (TaskPlanet Social) ── */}
      <div className={styles.brandLink} aria-label="TaskPlanet Social">
        <div className={styles.logoIcon}>TP</div>
        <div className={styles.brandTextGroup}>
          <div className={styles.brandTitle}>
            TaskPlanet
            <span className={styles.brandBadge}>Social</span>
          </div>
          <span className={styles.brandSubtitle}>Community Feed</span>
        </div>
      </div>

      {/* ── Right: User Profile & Actions ── */}
      <div className={styles.navRight}>
        <div className={styles.userBadge} title={`Logged in as ${user.username}`}>
          <Avatar name={user.username} size="sm" />
          <span className={styles.navUsername}>{user.username}</span>
        </div>

        <button
          className={styles.logoutBtn}
          onClick={onLogout}
          aria-label="Log out of TaskPlanet Social"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Log out</span>
        </button>
      </div>
    </header>
  );
}
