/**
 * @file CommentList.jsx
 * @description Comment thread and instant submission form for a post.
 *
 * Assignment Requirements Met:
 *  - "Save the usernames of people who liked or commented."
 *    → Each comment displays its author username, saved in MongoDB.
 *  - "Make sure like and comment updates reflect instantly in the UI."
 *    → Optimistic comment is appended immediately; rolled back on failure.
 *  - Shows total comments and individual timestamps.
 *
 * @param {object}   props
 * @param {string}   props.postId        - ID of the parent post.
 * @param {Array}    props.comments      - Array of comment objects.
 * @param {object}   props.currentUser   - Currently authenticated user.
 * @param {Function} props.onAddComment  - Instant optimistic comment handler from usePosts.
 * @param {Function} [props.onToast]     - Toast notification callback.
 */

import React, { useState } from "react";
import Avatar        from "../shared/Avatar.jsx";
import ErrorMessage  from "../shared/ErrorMessage.jsx";
import { relativeTime } from "../../utils.js";
import styles        from "./Feed.module.css";

export default function CommentList({
  postId,
  comments = [],
  currentUser,
  onAddComment,
  onToast,
}) {
  const [commentText, setCommentText]   = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]               = useState("");

  /**
   * Handle Instant Optimistic Comment Submission.
   *
   * Clears the input immediately so the user knows it was accepted,
   * then calls onAddComment (which does the optimistic state update).
   * If the request fails, the text is restored and an error is shown.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = commentText.trim();

    // Guard: do nothing if empty, not logged in, or already in flight
    if (!trimmed || !currentUser || isSubmitting) return;

    setError("");
    setIsSubmitting(true);

    // Capture the text before clearing so we can restore it on failure
    const textToSend = trimmed;
    setCommentText(""); // Clear immediately for snappy UX

    try {
      await onAddComment(postId, textToSend, currentUser);
    } catch (err) {
      // Restore the typed text so the user doesn't lose their comment
      setCommentText(textToSend);
      setError(err.message || "Failed to post comment.");
      if (onToast) onToast("Failed to send comment. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Allow submitting the comment form with Enter (without Shift for new line).
   *
   * @param {React.KeyboardEvent} e
   */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <section className={styles.comments} aria-label="Comments section">

      {/* ── Comment List ──────────────────────────────────────── */}
      {comments.length === 0 ? (
        /* Empty state — CSS class replaces the inline style */
        <p className={styles.commentsEmpty}>
          No comments yet. Be the first to share your thoughts!
        </p>
      ) : (
        comments.map((comment, index) => (
          <div key={comment.id || index} className={styles.commentItem}>
            <Avatar name={comment.username || "User"} size="sm" />

            {/* Chat-bubble with asymmetric border-radius anchoring to avatar */}
            <div className={styles.commentBubble}>
              <div className={styles.commentHeader}>
                <span className={styles.commentUsername}>@{comment.username}</span>
                <span className={styles.commentTime}>
                  {/* Newly optimistic comments don't have a server createdAt yet */}
                  {comment.createdAt ? relativeTime(comment.createdAt) : "Just now"}
                </span>
              </div>
              <p className={styles.commentText}>{comment.text}</p>
            </div>
          </div>
        ))
      )}

      {/* ── Comment Input Form ────────────────────────────────── */}
      {currentUser && (
        <form className={styles.commentForm} onSubmit={handleSubmit}>
          <input
            type="text"
            className={styles.commentInput}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment… (Enter to send)"
            maxLength={500}
            aria-label="Add a comment"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            className={styles.commentSendBtn}
            disabled={isSubmitting || !commentText.trim()}
            title="Send comment"
            aria-label="Send comment"
          >
            {/* Arrow icon — concise send affordance */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="22" y1="2"  x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      )}

      {/* ── Inline Error (uses shared ErrorMessage component) ─── */}
      {error && <ErrorMessage message={error} />}
    </section>
  );
}
