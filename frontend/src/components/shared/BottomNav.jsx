/**
 * @file BottomNav.jsx
 * @description Mobile Bottom Navigation Bar inspired by the TaskPlanet mobile app.
 *
 * In the TaskPlanet mobile app, bottom navigation allows swift access to
 * the Social page, Home, Tasks, and Profile. This component gives the mobile
 * view an authentic mobile app feel.
 *
 * @param {object}   props
 * @param {string}   props.activeTab     - "all" | "my"
 * @param {Function} props.onSelectTab   - Tab selection handler
 * @param {Function} props.onCreateClick - Handler to focus or open the composer
 * @param {Function} props.onLogout      - Logout handler
 */

import React from "react";
import styles from "./shared.module.css";

export default function BottomNav({ activeTab, onSelectTab, onCreateClick, onLogout }) {
  return (
    <nav className={styles.bottomNav} aria-label="Mobile Navigation">
      {/* ── All Feed ── */}
      <button
        className={`${styles.bottomNavItem} ${activeTab === "all" ? styles.bottomNavItemActive : ""}`}
        onClick={() => {
          onSelectTab("all");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        aria-label="Community Feed"
      >
        <span className={styles.bottomNavIcon}>🏠</span>
        <span>Feed</span>
      </button>

      {/* ── Saved Posts ── */}
      <button
        className={`${styles.bottomNavItem} ${activeTab === "saved" ? styles.bottomNavItemActive : ""}`}
        onClick={() => {
          onSelectTab("saved");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        aria-label="Saved Bookmarks"
      >
        <span className={styles.bottomNavIcon}>🔖</span>
        <span>Saved</span>
      </button>

      {/* ── Create Post Action Button ── */}
      <button
        className={styles.bottomNavCenterBtn}
        onClick={onCreateClick}
        aria-label="Create Post"
        title="Create a new post"
      >
        ＋
      </button>

      {/* ── My Posts ── */}
      <button
        className={`${styles.bottomNavItem} ${activeTab === "my" ? styles.bottomNavItemActive : ""}`}
        onClick={() => {
          onSelectTab("my");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        aria-label="My Posts"
      >
        <span className={styles.bottomNavIcon}>👤</span>
        <span>My Posts</span>
      </button>

      {/* ── Logout ── */}
      <button
        className={styles.bottomNavItem}
        onClick={onLogout}
        aria-label="Log Out"
      >
        <span className={styles.bottomNavIcon}>🚪</span>
        <span>Logout</span>
      </button>
    </nav>
  );
}
