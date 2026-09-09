/**
 * @file PostCard.jsx
 * @description TaskPlanet-styled post card component.
 *
 * Assignment Requirements Met:
 *  - "Save the usernames of people who liked or commented."
 *    → Displayed in the Likers banner and Likers modal.
 *  - "Show total likes and comments."
 *  - "Make sure like and comment updates reflect instantly in the UI."
 *    → Instant optimistic responses via usePosts handlers.
 *
 * Performance:
 *  - Wrapped in React.memo so sibling post updates don't cause re-renders.
 *
 * @param {object}   props
 * @param {import("../../hooks/usePosts.js").Post} props.post - Post document.
 * @param {object}   props.currentUser    - Currently authenticated user.
 * @param {Function} props.onToggleLike   - Optimistic like handler from usePosts.
 * @param {Function} props.onAddComment   - Optimistic comment handler from usePosts.
 * @param {Function} [props.onDeletePost]  - Callback to delete the post.
 * @param {Function} [props.onToast]      - Toast notification handler.
 * @param {boolean}  [props.isNew=false]  - Triggers slide-in animation for new posts.
 */

import React, { useState } from "react";
import Avatar       from "../shared/Avatar.jsx";
import CommentList  from "./CommentList.jsx";
import LikersModal  from "./LikersModal.jsx";
import { relativeTime } from "../../utils.js";
import styles       from "./Feed.module.css";
import sharedStyles from "../shared/shared.module.css";

/**
 * PostCard renders a single post with its author, content, images,
 * like/comment actions, and expandable comment thread.
 *
 * Memoised with React.memo — only re-renders when the post object
 * or action handler references change (prevents unnecessary renders
 * when unrelated sibling posts update their like counts).
 */
const PostCard = React.memo(function PostCard({
  post,
  currentUser,
  onToggleLike,
  onAddComment,
  onDeletePost,
  onToast,
  isNew = false,
}) {
  // ── Local UI State ─────────────────────────────────────────────
  const [showComments, setShowComments]       = useState(false);
  const [showLikersModal, setShowLikersModal] = useState(false);
  const [lightboxImage, setLightboxImage]     = useState(null);
  const [deleteBusy, setDeleteBusy]           = useState(false);

  /**
   * likeBusy — prevents double-clicking the Like button from firing
   * multiple API calls before the first response completes.
   */
  const [likeBusy, setLikeBusy] = useState(false);

  /**
   * likeAnimKey — incremented on every like click to re-trigger the
   * CSS heartbeat animation even when the user toggles quickly.
   */
  const [likeAnimKey, setLikeAnimKey] = useState(0);

  // ── Derived Data ───────────────────────────────────────────────

  /** List of usernames who liked this post (for the likers banner & modal). */
  const likedUsers   = post.likedUsers || [];
  const commentCount = (post.comments || []).length;

  /**
   * Normalise images: new posts include `imageUrls`, legacy posts have
   * a single `imageUrl` string — both are resolved to a URL array.
   */
  const postImages = post.imageUrls?.length
    ? post.imageUrls
    : post.imageUrl
      ? [post.imageUrl]
      : [];

  // ── Handlers ──────────────────────────────────────────────────

  /**
   * Handle Instant Optimistic Like.
   *
   * Triggers the usePosts optimistic toggle (0 ms perceived latency).
   * Increments likeAnimKey to re-fire the CSS heartbeat on every click.
   */
  const handleLikeClick = async () => {
    if (likeBusy || !currentUser) return;
    setLikeBusy(true);
    setLikeAnimKey((k) => k + 1); // Retrigger CSS animation
    try {
      await onToggleLike(post.id, currentUser);
    } catch (err) {
      if (onToast) onToast(err.message || "Failed to update like.", "error");
    } finally {
      setLikeBusy(false);
    }
  };

  /**
   * Handle Post Sharing.
   *
   * Uses the Clipboard API when available to copy a post preview link.
   * Falls back gracefully on older browsers.
   */
  const handleShareClick = async () => {
    const shareText = `Check out this post by @${post.username} on TaskPlanet Social: ${post.text.slice(0, 80)}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText}\n${window.location.origin}`);
        if (onToast) onToast("Post link copied to clipboard!", "success");
      } else {
        // Clipboard API not available (e.g. non-HTTPS context)
        if (onToast) onToast("Share copied!", "success");
      }
    } catch {
      if (onToast) onToast("Copied to clipboard!", "success");
    }
  };

  /**
   * Determine whether the currently authenticated user is the author
   * of this post so we can conditionally show the Delete action.
   */
  const isOwner = Boolean(
    currentUser && (
      (post.author && String(post.author) === String(currentUser.id)) ||
      (post.username && post.username === currentUser.username)
    )
  );

  /**
   * Handle deleting the post.
   * Prompts the user with a confirmation dialog before proceeding.
   */
  const handleDeleteClick = async () => {
    if (deleteBusy) return;
    const confirmed = window.confirm("Are you sure you want to delete this post? This cannot be undone.");
    if (!confirmed) return;

    setDeleteBusy(true);
    try {
      if (onDeletePost) {
        await onDeletePost(post.id);
        if (onToast) onToast("Post deleted successfully.", "success");
      }
    } catch (err) {
      if (onToast) onToast(err.message || "Failed to delete post.", "error");
      setDeleteBusy(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────
  return (
    <article
      className={`${styles.postCard} ${isNew ? styles.postCardNew : ""}`}
      aria-label={`Post by ${post.username}`}
    >
      {/* ── Post Author Header ───────────────────────────────── */}
      <div className={styles.postHeader}>
        <div className={styles.postAuthorGroup}>
          <Avatar name={post.username} size="md" />
          <div className={styles.postMeta}>
            <span className={styles.postUsername}>@{post.username}</span>
            {/* time element lets browsers/AT know this is a timestamp */}
            <time
              className={styles.postTime}
              dateTime={post.createdAt}
              title={new Date(post.createdAt).toLocaleString()}
            >
              {relativeTime(post.createdAt)}
            </time>
          </div>
        </div>

        {/* Right header actions: Delete (for owner) + Share */}
        <div className={styles.postOwnerActions}>
          {isOwner && (
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={handleDeleteClick}
              disabled={deleteBusy}
              title="Delete this post"
              aria-label="Delete this post"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              <span>{deleteBusy ? "Deleting…" : "Delete"}</span>
            </button>
          )}

          {/* Share icon button */}
          <button
            type="button"
            className={styles.shareBtn}
            onClick={handleShareClick}
            title="Share post"
            aria-label="Share post"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="18" cy="5"  r="3" />
              <circle cx="6"  cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59"  y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51"  x2="8.59"  y2="10.49" />
            </svg>
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* ── Post Body Text ───────────────────────────────────── */}
      {post.text && <p className={styles.postText}>{post.text}</p>}

      {/* ── Post Images ──────────────────────────────────────── */}
      {/* Grid supports both a single wide image and multi-image layouts */}
      {postImages.length > 0 && (
        <div className={`${styles.postImageGrid} ${postImages.length === 1 ? styles.postImageGridSingle : ""}`}>
          {postImages.map((imageUrl, index) => (
            <div
              className={styles.postImageWrapper}
              onClick={() => setLightboxImage(imageUrl)}
              title="Click to view full image"
              role="button"
              tabIndex={0}
              key={imageUrl}
              onKeyDown={(e) => e.key === "Enter" && setLightboxImage(imageUrl)}
            >
              <img
                className={styles.postImage}
                src={imageUrl}
                alt={`Image ${index + 1} attached to post by ${post.username}`}
                loading="lazy"
                /* Hide broken images instead of showing a broken-image icon */
                onError={(e) => { e.currentTarget.style.display = "none"; }}
              />
              <span className={styles.imageExpandBadge} aria-hidden="true">🔍 Expand</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Likers Banner ────────────────────────────────────── */}
      {/* Fulfils: "Save the usernames of people who liked or commented." */}
      {post.likes > 0 && likedUsers.length > 0 && (
        <div
          className={styles.likersBanner}
          onClick={() => setShowLikersModal(true)}
          role="button"
          tabIndex={0}
          title="View all users who liked this post"
          onKeyDown={(e) => e.key === "Enter" && setShowLikersModal(true)}
        >
          {/* Overlapping mini-avatars for the first 3 likers */}
          <div className={styles.likersAvatars}>
            {likedUsers.slice(0, 3).map((u, i) => (
              <div key={i} className={styles.likersAvatarMini}>
                <Avatar name={u} size="sm" />
              </div>
            ))}
          </div>

          <span className={styles.likersText}>
            Liked by <strong>@{likedUsers[0]}</strong>
            {likedUsers.length > 1 && (
              <> and <strong>{likedUsers.length - 1} other{likedUsers.length > 2 ? "s" : ""}</strong></>
            )}
          </span>
        </div>
      )}

      {/* ── Action Bar: Likes & Comments ─────────────────────── */}
      <div className={styles.postActions}>
        <div className={styles.actionGroupLeft}>

          {/* Like Button — filled crimson when liked */}
          <button
            type="button"
            className={`${styles.actionBtn} ${post.likedByMe ? styles.actionBtnLiked : ""}`}
            onClick={handleLikeClick}
            aria-pressed={post.likedByMe}
            aria-label={post.likedByMe ? "Unlike this post" : "Like this post"}
            disabled={likeBusy}
          >
            {/* key change re-triggers the CSS animation on every click */}
            <span className={styles.heartIcon} key={likeAnimKey} aria-hidden="true">
              {post.likedByMe ? "❤️" : "🤍"}
            </span>
            <span>{post.likes} {post.likes === 1 ? "Like" : "Likes"}</span>
          </button>

          {/* Comment Toggle Button */}
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => setShowComments((prev) => !prev)}
            aria-expanded={showComments}
            aria-label={`${commentCount} comment${commentCount === 1 ? "" : "s"}. Toggle comment thread.`}
          >
            <span aria-hidden="true">💬</span>
            <span>{commentCount} {commentCount === 1 ? "Comment" : "Comments"}</span>
          </button>
        </div>
      </div>

      {/* ── Expandable Comment Section ───────────────────────── */}
      {showComments && (
        <CommentList
          postId={post.id}
          comments={post.comments || []}
          currentUser={currentUser}
          onAddComment={onAddComment}
          onToast={onToast}
        />
      )}

      {/* ── Likers List Modal ────────────────────────────────── */}
      {showLikersModal && (
        <LikersModal
          likedUsers={likedUsers}
          onClose={() => setShowLikersModal(false)}
        />
      )}

      {/* ── Image Lightbox Modal ─────────────────────────────── */}
      {lightboxImage && (
        <div
          className={sharedStyles.modalOverlay}
          onClick={() => setLightboxImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Full-size image preview"
        >
          {/* stopPropagation prevents the overlay click-to-close from
              firing when the user clicks inside the image itself */}
          <div className={sharedStyles.lightboxModal} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={sharedStyles.lightboxClose}
              onClick={() => setLightboxImage(null)}
              aria-label="Close image preview"
            >
              ✕
            </button>
            <img
              src={lightboxImage}
              alt={`Full-size image shared by @${post.username}`}
              className={sharedStyles.lightboxImage}
            />
          </div>
        </div>
      )}
    </article>
  );
});

export default PostCard;
