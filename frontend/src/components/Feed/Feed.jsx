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

import React, { useState, useCallback, useMemo } from "react";
import Navbar       from "../shared/Navbar.jsx";
import BottomNav    from "../shared/BottomNav.jsx";
import Avatar       from "../shared/Avatar.jsx";
import Spinner      from "../shared/Spinner.jsx";
import EmptyState   from "../shared/EmptyState.jsx";
import ErrorMessage from "../shared/ErrorMessage.jsx";
import PaginationControls from "../shared/PaginationControls.jsx";
import Composer     from "./Composer.jsx";
import PostCard     from "./PostCard.jsx";
import RightSidebar from "./RightSidebar.jsx";
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
  const [toast, setToast] = useState(null);
  const [newestPostId, setNewestPostId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  /** Saved/Bookmarked post IDs persisted in localStorage */
  const [savedPostIds, setSavedPostIds] = useState(() => {
    try {
      const saved = localStorage.getItem("tp_saved_posts");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ── Handlers ──────────────────────────────────────────────────

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handlePostCreated = useCallback((newPost) => {
    prependPost(newPost);
    setNewestPostId(newPost.id);
    setTimeout(() => setNewestPostId(null), 600);
  }, [prependPost]);

  const scrollToComposer = useCallback(() => {
    const el = document.getElementById("composer-card");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const textarea = el.querySelector("textarea");
      if (textarea) textarea.focus();
    }
  }, []);

  const toggleSavePost = useCallback((postId) => {
    setSavedPostIds((prev) => {
      const isSaved = prev.includes(postId);
      const next = isSaved ? prev.filter((id) => id !== postId) : [...prev, postId];
      try {
        localStorage.setItem("tp_saved_posts", JSON.stringify(next));
      } catch {}
      showToast(isSaved ? "Post removed from saved bookmarks." : "Post saved to bookmarks! 🔖", "success");
      return next;
    });
  }, [showToast]);

  const handleHashtagClick = useCallback((tag) => {
    setSearchQuery(`#${tag}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ── Derived filtered posts ─────────────────────────────────────
  const displayPosts = useMemo(() => {
    let list = posts;

    // Filter by saved tab
    if (filter === "saved") {
      list = list.filter((p) => savedPostIds.includes(p.id));
    }

    // Filter by search query (text or author)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((p) => {
        const matchText = p.text?.toLowerCase().includes(q);
        const matchUser = p.username?.toLowerCase().includes(q);
        return matchText || matchUser;
      });
    }

    return list;
  }, [posts, filter, savedPostIds, searchQuery]);

  const emptyTitle = filter === "my"
    ? "You haven't posted anything yet!"
    : filter === "saved"
      ? "No saved posts yet"
      : searchQuery.trim()
        ? `No posts matching "${searchQuery}"`
        : "No posts found";

  const emptyDesc = filter === "my"
    ? "Share your first thought or image above to see it here."
    : filter === "saved"
      ? "Click the 📑 Save button on any post to bookmark it for later."
      : searchQuery.trim()
        ? "Try searching for a different keyword or #hashtag."
        : "Be the first to share an update with the TaskPlanet community.";

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className={styles.pageShell}>

      {/* ── Desktop & Tablet Header with Search & Theme Toggle ── */}
      <Navbar
        user={user}
        onLogout={onLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

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

            <div className={styles.sidebarStats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{total}</span>
                <span className={styles.statLabel}>Total Posts</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{savedPostIds.length}</span>
                <span className={styles.statLabel}>Saved</span>
              </div>
            </div>

            <nav className={styles.quickNav} aria-label="Feed filters">
              <button
                type="button"
                className={`${styles.quickNavBtn} ${filter === "all" ? styles.quickNavBtnActive : ""}`}
                onClick={() => { switchFilter("all"); setSearchQuery(""); }}
              >
                <span aria-hidden="true">🌐</span>
                <span>All Community Feed</span>
              </button>

              <button
                type="button"
                className={`${styles.quickNavBtn} ${filter === "my" ? styles.quickNavBtnActive : ""}`}
                onClick={() => { switchFilter("my"); setSearchQuery(""); }}
              >
                <span aria-hidden="true">👤</span>
                <span>My Posts</span>
              </button>

              <button
                type="button"
                className={`${styles.quickNavBtn} ${filter === "saved" ? styles.quickNavBtnActive : ""}`}
                onClick={() => { switchFilter("saved"); setSearchQuery(""); }}
              >
                <span aria-hidden="true">🔖</span>
                <span>Saved Bookmarks ({savedPostIds.length})</span>
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

              {/* Saved Posts tab */}
              <button
                type="button"
                role="tab"
                aria-selected={filter === "saved"}
                className={`${styles.tabBtn} ${filter === "saved" ? styles.tabBtnActive : ""}`}
                onClick={() => switchFilter("saved")}
              >
                <span>🔖 Saved ({savedPostIds.length})</span>
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

          {/* ── Active Search Filter Notice ─────────────────────── */}
          {searchQuery.trim() && (
            <div className={styles.filterNotice}>
              <span>Filtering posts by: <strong>"{searchQuery}"</strong></span>
              <button
                type="button"
                className={styles.filterNoticeClear}
                onClick={() => setSearchQuery("")}
                aria-label="Clear filter"
              >
                ✕ Clear
              </button>
            </div>
          )}

          {/* ── Fetch Error Banner ──────────────────────────────── */}
          {error && <ErrorMessage message={error} />}

          {/* ── Posts List / Skeletons / Empty State ────────────── */}
          {loading ? (
            Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <SkeletonCard key={i} />
            ))
          ) : displayPosts.length > 0 ? (
            displayPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={user}
                onToggleLike={toggleLike}
                onAddComment={addComment}
                onDeletePost={deletePost}
                onToast={showToast}
                onHashtagClick={handleHashtagClick}
                isSaved={savedPostIds.includes(post.id)}
                onToggleSave={toggleSavePost}
                isNew={post.id === newestPostId}
              />
            ))
          ) : (
            <EmptyState
              icon={filter === "saved" ? "🔖" : filter === "my" ? "📝" : "📭"}
              title={emptyTitle}
              description={emptyDesc}
              ctaLabel={filter === "saved" ? null : "Create a Post"}
              onCta={filter === "saved" ? null : scrollToComposer}
            />
          )}

          {/* ── Reusable Pagination Controls ─────────────────────── */}
          {!loading && displayPosts.length > 0 && (
            <PaginationControls
              loadedCount={displayPosts.length}
              totalCount={Boolean(searchQuery.trim()) || filter === "saved" ? displayPosts.length : total}
              hasMore={hasMore && filter !== "saved" && !searchQuery.trim()}
              loadingMore={loadingMore}
              onLoadMore={loadMore}
            />
          )}
        </main>

        {/* ── Right Sidebar: Who to Connect & Community Tips ── */}
        <RightSidebar />
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
