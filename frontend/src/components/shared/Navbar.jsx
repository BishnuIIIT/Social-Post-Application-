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

import React, { useState, useEffect } from "react";
import Avatar from "./Avatar.jsx";
import styles from "./shared.module.css";

export default function Navbar({ user, onLogout, searchQuery = "", onSearchChange }) {
  // ── Theme State ────────────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("tp_theme");
      if (saved) return saved;
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("tp_theme", theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

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

      {/* ── Center: Search Bar (Desktop & Tablet) ── */}
      {onSearchChange && (
        <div className={styles.navSearch}>
          <span className={styles.navSearchIcon} aria-hidden="true">🔍</span>
          <input
            type="search"
            className={styles.navSearchInput}
            placeholder="Search posts, #tags, authors…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search posts"
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.navSearchClear}
              onClick={() => onSearchChange("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* ── Right: User Profile & Actions ── */}
      <div className={styles.navRight}>
        {/* Theme Switcher */}
        <button
          type="button"
          className={styles.themeToggleBtn}
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          aria-label={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {/* User Profile Badge with Live Status Dot */}
        <div className={styles.userBadge} title={`Logged in as ${user.username} (Active now)`}>
          <div className={styles.avatarWrapper}>
            <Avatar name={user.username} size="sm" />
            <span className={styles.statusDot} title="Online" aria-hidden="true" />
          </div>
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
