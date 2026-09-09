/**
 * @file RightSidebar.jsx
 * @description Desktop right-hand community widget column for the 3-column feed layout.
 *
 * Features:
 *  - "🔥 Trending Topics" card with clickable tags that filter the feed
 *  - "✨ Community Spotlight" with interactive Follow/Following toggles
 *  - "💡 Community Tips" with helpful app tips & shortcuts
 *
 * @param {object}   props
 * @param {Function} [props.onSelectTag] - Callback when user clicks a trending hashtag.
 */

import React, { useState } from "react";
import Avatar from "../shared/Avatar.jsx";
import styles from "./Feed.module.css";

const TRENDING_TOPICS = [
  { tag: "TaskPlanet", count: "128 posts", isHot: true },
  { tag: "WebDev", count: "94 posts", isHot: true },
  { tag: "FullStack", count: "67 posts", isHot: false },
  { tag: "DesignSystems", count: "51 posts", isHot: false },
  { tag: "React18", count: "43 posts", isHot: false },
];

const SUGGESTED_MEMBERS = [
  { username: "AlexRivera", role: "Product Designer" },
  { username: "SarahChen", role: "Frontend Architect" },
  { username: "DavidDev", role: "Cloud & MongoDB" },
];

export default function RightSidebar({ onSelectTag }) {
  const [followingMap, setFollowingMap] = useState({});

  const toggleFollow = (username) => {
    setFollowingMap((prev) => ({
      ...prev,
      [username]: !prev[username],
    }));
  };

  return (
    <aside className={styles.rightSidebar} aria-label="Community Widgets">
      {/* ── Trending Topics Card ───────────────────────────────── */}
      <div className={styles.widgetCard}>
        <div className={styles.widgetHeader}>
          <span className={styles.widgetTitle}>
            <span aria-hidden="true">🔥</span> Trending Topics
          </span>
          <span className={styles.widgetBadge}>Live</span>
        </div>

        <div className={styles.trendingList}>
          {TRENDING_TOPICS.map((item) => (
            <div
              key={item.tag}
              className={styles.trendingItem}
              onClick={() => onSelectTag?.(item.tag)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSelectTag?.(item.tag)}
              title={`Filter by #${item.tag}`}
            >
              <div className={styles.trendingMeta}>
                <span className={styles.trendingTag}>
                  #{item.tag}
                  {item.isHot && <span className={styles.hotBadge}>Hot</span>}
                </span>
                <span className={styles.trendingCount}>{item.count}</span>
              </div>
              <span className={styles.trendingArrow}>›</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Community Spotlight Card ───────────────────────────── */}
      <div className={styles.widgetCard}>
        <div className={styles.widgetHeader}>
          <span className={styles.widgetTitle}>
            <span aria-hidden="true">✨</span> Who to Connect With
          </span>
        </div>

        <div className={styles.memberList}>
          {SUGGESTED_MEMBERS.map((member) => {
            const isFollowing = Boolean(followingMap[member.username]);
            return (
              <div key={member.username} className={styles.memberItem}>
                <Avatar name={member.username} size="sm" />
                <div className={styles.memberMeta}>
                  <span className={styles.memberName}>@{member.username}</span>
                  <span className={styles.memberRole}>{member.role}</span>
                </div>
                <button
                  type="button"
                  className={`${styles.followBtn} ${isFollowing ? styles.followBtnActive : ""}`}
                  onClick={() => toggleFollow(member.username)}
                  aria-pressed={isFollowing}
                  aria-label={`${isFollowing ? "Unfollow" : "Follow"} @${member.username}`}
                >
                  {isFollowing ? "Following" : "+ Follow"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Community Tips & Guidelines ────────────────────────── */}
      <div className={styles.widgetCard}>
        <div className={styles.widgetHeader}>
          <span className={styles.widgetTitle}>
            <span aria-hidden="true">💡</span> Community Tips
          </span>
        </div>
        <ul className={styles.tipsList}>
          <li>
            <strong>Drag & Drop:</strong> Drag multiple photos into the composer anytime.
          </li>
          <li>
            <strong>Shortcuts:</strong> Press <kbd>Ctrl + Enter</kbd> to publish instantly.
          </li>
          <li>
            <strong>Discover:</strong> Use <span className={styles.tipTag}>#hashtags</span> to group topics and join discussions.
          </li>
        </ul>
      </div>
    </aside>
  );
}
