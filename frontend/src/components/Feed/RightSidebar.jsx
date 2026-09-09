/**
 * @file RightSidebar.jsx
 * @description Community sidebar containing suggested member connections and helpful tips.
 */

import React, { useState } from "react";
import Avatar from "../shared/Avatar.jsx";
import styles from "./RightSidebar.module.css";

/** Recommended community members to connect with */
const SUGGESTED_USERS = [
  {
    id: "alex",
    username: "AlexRivera",
    role: "Full-Stack Dev",
  },
  {
    id: "sarah",
    username: "SarahChen",
    role: "UI/UX Designer",
  },
  {
    id: "david",
    username: "DavidDev",
    role: "Open Source Contributor",
  },
];

/** Community best practice tips */
const COMMUNITY_TIPS = [
  {
    id: "drag-drop",
    title: "Drag & Drop",
    desc: "Drag images directly into the composer or paste image URLs.",
  },
  {
    id: "shortcuts",
    title: "Shortcuts",
    desc: "Likes and comments update instantly with optimistic UI feedback.",
  },
  {
    id: "discover",
    title: "Discover",
    desc: "Use bookmarks to save your favorite community moments.",
  },
];

export default function RightSidebar() {
  // Interactive follow state persisted in localStorage
  const [following, setFollowing] = useState(() => {
    try {
      const saved = localStorage.getItem("tp_following_users");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleFollow = (userId) => {
    setFollowing((prev) => {
      const updated = { ...prev, [userId]: !prev[userId] };
      try {
        localStorage.setItem("tp_following_users", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  return (
    <aside className={styles.sidebarWrapper} aria-label="Community sidebar">
      {/* ── Card 1: Who to Connect With ─────────────────────────── */}
      <section className={styles.card} aria-labelledby="connect-heading">
        <div className={styles.cardHeader}>
          <h3 id="connect-heading" className={styles.cardTitle}>
            <span className={styles.headerIcon} aria-hidden="true">✨</span>
            <span>Who to Connect With</span>
          </h3>
        </div>

        <div className={styles.userList}>
          {SUGGESTED_USERS.map((user) => {
            const isFollowed = Boolean(following[user.id]);
            return (
              <div key={user.id} className={styles.userRow}>
                <div className={styles.userInfo}>
                  <Avatar name={user.username} size="sm" />
                  <div className={styles.userMeta}>
                    <span className={styles.userName}>@{user.username}</span>
                    <span className={styles.userRole}>{user.role}</span>
                  </div>
                </div>

                <button
                  type="button"
                  className={`${styles.followBtn} ${isFollowed ? styles.followBtnActive : ""}`}
                  onClick={() => toggleFollow(user.id)}
                  aria-label={`${isFollowed ? "Unfollow" : "Follow"} @${user.username}`}
                >
                  {isFollowed ? "✓ Following" : "+ Follow"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Card 2: Community Tips ──────────────────────────────── */}
      <section className={styles.card} aria-labelledby="tips-heading">
        <div className={styles.cardHeader}>
          <h3 id="tips-heading" className={styles.cardTitle}>
            <span className={styles.headerIcon} aria-hidden="true">💡</span>
            <span>Community Tips</span>
          </h3>
        </div>

        <div className={styles.tipsList}>
          {COMMUNITY_TIPS.map((tip) => (
            <article key={tip.id} className={styles.tipItem}>
              <div className={styles.tipHeader}>
                <span className={styles.tipBullet} aria-hidden="true">•</span>
                <strong className={styles.tipTitle}>{tip.title}:</strong>
              </div>
              <p className={styles.tipDesc}>{tip.desc}</p>
            </article>
          ))}
        </div>
      </section>
    </aside>
  );
}
