/**
 * @file Feed.jsx
 * @description Master social feed orchestrator inspired by the TaskPlanet social page.
 *
 * Core Features:
 *  - Top Navbar with TaskPlanet branding and user profile
 *  - Mobile Bottom Navigation Bar (Feed, Create, My Posts, Logout)
 *  - Tabs: "All Feed" (public feed), "My Posts" (author-filtered), "Trending" (most likes)
 *  - Interactive Composer supporting text, image, or both
 *  - Instant Optimistic Like & Comment interactions
 *  - Likers list modal and image lightbox
 *  - Skeletons with image placeholder + responsive progress bar
 *  - Toast notification system
 *
 * @param {object}   props
 * @param {object}   props.user      - Authenticated user object.
 * @param {Function} props.onLogout  - Callback to clear the session and show the auth screen.
 */

import React, { useState, useCallback } from "react";
import Navbar       from "../shared/Navbar.jsx";
import BottomNav    from "../shared/BottomNav.jsx";
import Avatar       from "../shared/Avatar.jsx";
import Spinner      from "../shared/Spinner.jsx";
import EmptyState   from "../shared/EmptyState.jsx";
import ErrorMessage from "../shared/ErrorMessage.jsx";
import Composer     from "./Composer.jsx";
import PostCard     from "./PostCard.jsx";
import { usePosts, PAGE_SIZE } from "../../hooks/usePosts.js";
import styles       from "./Feed.module.css";
import sharedStyles from "../shared/shared.module.css";

/** How many skeleton cards to show while the initial page loads. */
const SKELETON_COUNT = 3;

/* ─────────────────────────────────────────────────────────────────
   SkeletonCard — Shimmer placeholder while posts are loading.
   Rendered inside Feed (not exported) since it has no external use.
   aria-hidden="true" hides skeletons from screen readers.
   ──────────────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className={styles.skeletonCard} aria-hidden="true">
      {/* Author row: circle avatar + two text lines */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <div className={styles.skeletonCircle} style={{ width: 38, height: 38 }} />
        <div style={{ flex: 1, display: "grid", gap: 6 }}>
          <div className={styles.skeletonRow} style={{ width: "38%", height: 12 }} />
          <div className={styles.skeletonRow} style={{ width: "22%", height: 10 }} />
        </div>
      </div>
      {/* Body text lines */}
      <div style={{ display: "grid", gap: 8 }}>
        <div className={styles.skeletonRow} style={{ width: "100%", height: 14 }} />
        <div className={styles.skeletonRow} style={{ width: "88%",  height: 14 }} />
        <div className={styles.skeletonRow} style={{ width: "62%",  height: 14 }} />
      </div>
      {/* Image placeholder — gives the skeleton more visual weight */}
      <div className={styles.skeletonImage} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   PaginationFooter — Progress bar + "Showing X–Y of Z posts" label.
   Extracted as a local sub-component for readability; not reused
   elsewhere so it stays in this file rather than shared/.
   ──────────────────────────────────────────────────────────────── */
function PaginationFooter({ loaded, total }) {
  if (total === 0) return null;

  /** Percentage loaded (0–100), capped at 100 to handle edge cases. */
  const progressPct = Math.min(Math.round((loaded / total) * 100), 100);

  return (
    <>
      {/* Visual progress bar */}
      <div className={styles.feedProgress} role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
        <div className={styles.feedProgressBar} style={{ width: `${progressPct}%` }} />
      </div>

      {/* Textual status: "Showing 1–10 of 47 posts" */}
      <div className={styles.paginationInfo}>
        <span>
          Showing <strong>1–{loaded}</strong> of{" "}
          <strong>{total}</strong>{" "}
          post{total === 1 ? "" : "s"}
        </span>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Feed — Main export
   ──────────────────────────────────────────────────────────────── */
export default function Feed({ user, onLogout }) {
  // ── Data & Pagination ──────────────────────────────────────────
  const {
    posts,
    page,
    total,
    hasMore,
    loading,
    loadingMore,
    error,
    filter,
    sort,
    switchFilter,
    switchSort,
    loadMore,
    prependPost,
    toggleLike,
    addComment,
    deletePost,
  } = usePosts();

  // ── Local UI State ─────────────────────────────────────────────
  /** Active toast notification: { message, type } | null */
  const [toast, setToast] = useState(null);

  /**
   * ID of the most recently created post so PostCard can apply
   * the slide-in entrance animation only on that one card.
   */
  const [newestPostId, setNewestPostId] = useState(null);

  // ── Handlers ──────────────────────────────────────────────────

  /**
   * Display a floating toast notification for 3 seconds.
   *
   * @param {string} message - Text to display in the toast.
   * @param {"success"|"error"} [type="success"] - Controls toast colour.
   */
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /**
   * Prepend a newly published post at the top of the feed and
   * temporarily mark it as "new" so the slide-in animation fires once.
   *
   * @param {object} newPost - Post document returned by the API.
   */
  const handlePostCreated = useCallback((newPost) => {
    prependPost(newPost);
    setNewestPostId(newPost.id);
    // Clear the "new" marker after the animation completes (~350 ms)
    setTimeout(() => setNewestPostId(null), 600);
  }, [prependPost]);

  /**
   * Scroll the Composer card into view and focus its textarea.
   * Used by the sidebar, empty-state CTA, and mobile bottom nav.
   */
  const scrollToComposer = useCallback(() => {
    const el = document.getElementById("composer-card");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const textarea = el.querySelector("textarea");
      if (textarea) textarea.focus();
    }
  }, []);

  // ── Derived values ─────────────────────────────────────────────
  /** Determine the correct empty-state message based on the active tab. */
  const emptyTitle   = filter === "my" ? "You haven't posted anything yet!" : "No posts found";
  const emptyDesc    = filter === "my"
    ? "Share your first thought or image above to see it here."
    : "Be the first to share an update with the TaskPlanet community.";

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className={styles.pageShell}>

      {/* ── Desktop & Tablet Header ────────────────────────────── */}
      <Navbar user={user} onLogout={onLogout} />

      {/* ── Toast Notifications ────────────────────────────────── */}
      {toast && (
        <div className={sharedStyles.toastContainer}>
          <div
            className={`${sharedStyles.toast} ${
              toast.type === "success" ? sharedStyles.toastSuccess : sharedStyles.toastError
            }`}
            role="alert"
          >
            <span aria-hidden="true">{toast.type === "success" ? "✓" : "⚠"}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className={styles.layout}>

        {/* ── Left Sidebar: Profile & Community Navigation ─────── */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarCard}>
            {/* User greeting + avatar */}
            <div className={styles.sidebarUserHeader}>
              <Avatar name={user.username} size="lg" />
              <div>
                <span className={styles.sidebarGreeting}>Welcome,</span>
                <h2 className={styles.sidebarUsername}>{user.username}</h2>
              </div>
            </div>

            <p className={styles.sidebarDesc}>
              Connect, post moments, and explore community updates on TaskPlanet Social.
            </p>

            {/* Community stats strip */}
            <div className={styles.sidebarStats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{total}</span>
                <span className={styles.statLabel}>Total Posts</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>Public</span>
                <span className={styles.statLabel}>Community</span>
              </div>
            </div>

            {/* Quick-filter navigation links */}
            <nav className={styles.quickNav} aria-label="Feed filters">
              <button
                type="button"
                className={`${styles.quickNavBtn} ${filter === "all" ? styles.quickNavBtnActive : ""}`}
                onClick={() => switchFilter("all")}
              >
                <span aria-hidden="true">🌐</span>
                <span>All Community Feed</span>
              </button>

              <button
                type="button"
                className={`${styles.quickNavBtn} ${filter === "my" ? styles.quickNavBtnActive : ""}`}
                onClick={() => switchFilter("my")}
              >
                <span aria-hidden="true">👤</span>
                <span>My Posts</span>
              </button>

              <button
                type="button"
                className={styles.quickNavBtn}
                onClick={scrollToComposer}
              >
                <span aria-hidden="true">✍️</span>
                <span>Create New Post</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* ── Main Feed Column ───────────────────────────────────── */}
        <main className={styles.feed} aria-label="TaskPlanet Posts Feed">

          {/* ── Post Composer ───────────────────────────────────── */}
          <Composer
            user={user}
            onCreated={handlePostCreated}
            onToast={showToast}
          />

          {/* ── Tabs & Sorting Bar ──────────────────────────────── */}
          <div className={styles.feedTabsContainer}>
            <div className={styles.feedTabs} role="tablist" aria-label="Feed filters">

              {/* All Feed tab */}
              <button
                type="button"
                role="tab"
                aria-selected={filter === "all" && sort === "latest"}
                className={`${styles.tabBtn} ${filter === "all" && sort === "latest" ? styles.tabBtnActive : ""}`}
                onClick={() => { switchFilter("all"); switchSort("latest"); }}
              >
                <span>🌐 All Feed</span>
              </button>

              {/* My Posts tab */}
              <button
                type="button"
                role="tab"
                aria-selected={filter === "my"}
                className={`${styles.tabBtn} ${filter === "my" ? styles.tabBtnActive : ""}`}
                onClick={() => switchFilter("my")}
              >
                <span>👤 My Posts</span>
              </button>

              {/* Trending tab */}
              <button
                type="button"
                role="tab"
                aria-selected={sort === "trending"}
                className={`${styles.tabBtn} ${sort === "trending" ? styles.tabBtnActive : ""}`}
                onClick={() => { switchFilter("all"); switchSort("trending"); }}
              >
                <span>🔥 Trending</span>
              </button>
            </div>

            {/* Sort order dropdown — right side of the tab bar */}
            <div className={styles.sortGroup}>
              <label htmlFor="feed-sort" className={styles.sortLabel}>
                Sort:
              </label>
              <select
                id="feed-sort"
                className={styles.sortSelect}
                value={sort}
                onChange={(e) => switchSort(e.target.value)}
              >
                <option value="latest">Newest First</option>
                <option value="trending">Most Liked</option>
              </select>
            </div>
          </div>

          {/* ── Fetch Error Banner ──────────────────────────────── */}
          {error && <ErrorMessage message={error} />}

          {/* ── Posts List / Skeletons / Empty State ────────────── */}
          {loading ? (
            // Show shimmer skeleton cards while loading page 1
            Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <SkeletonCard key={i} />
            ))
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={user}
                onToggleLike={toggleLike}
                onAddComment={addComment}
                onDeletePost={deletePost}
                onToast={showToast}
                isNew={post.id === newestPostId}
              />
            ))
          ) : (
            // No results — show contextual empty state
            <EmptyState
              icon={filter === "my" ? "📝" : "📭"}
              title={emptyTitle}
              description={emptyDesc}
              ctaLabel="Create a Post"
              onCta={scrollToComposer}
            />
          )}

          {/* ── Load More Button ────────────────────────────────── */}
          {hasMore && (
            <button
              type="button"
              className={styles.loadMoreBtn}
              onClick={loadMore}
              disabled={loadingMore}
              aria-label={loadingMore ? "Loading posts…" : "Load more posts"}
            >
              {loadingMore ? (
                <>
                  <Spinner size={16} color="var(--color-primary)" />
                  <span>Loading more moments...</span>
                </>
              ) : (
                <span>Load more posts</span>
              )}
            </button>
          )}

          {/* ── Progress Bar + "Showing X–Y of Z" Info ─────────── */}
          {!loading && posts.length > 0 && (
            <PaginationFooter loaded={posts.length} total={total} />
          )}
        </main>
      </div>

      {/* ── Mobile Bottom Navigation Bar ───────────────────────── */}
      {/* Mirrors the TaskPlanet Android app bottom navigation     */}
      <BottomNav
        activeTab={filter}
        onSelectTab={(tab) => switchFilter(tab)}
        onCreateClick={scrollToComposer}
        onLogout={onLogout}
      />
    </div>
  );
}
