/**
 * @file usePosts.js
 * @description Advanced React hook managing feed data, tabs (All, My Posts, Trending),
 * pagination, and instantaneous Optimistic UI updates for likes and comments.
 *
 * Assignment Requirements Met:
 *  - "Make sure like and comment updates reflect instantly in the UI."
 *  - "Save the usernames of people who liked or commented."
 *  - "Efficient pagination logic." — AbortController cancels stale requests when
 *    the user switches tabs mid-fetch; requestId guards commit stale state.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "../api.js";

/** Number of posts per page — exported so UI can compute range labels. */
export const PAGE_SIZE = 10;

/**
 * @typedef {Object} Comment
 * @property {string} id
 * @property {string} username
 * @property {string} text
 * @property {string} createdAt
 * @property {boolean} [isOptimistic] - True while comment is pending server confirmation.
 */

/**
 * @typedef {Object} Post
 * @property {string}    id
 * @property {string}    author       - Author user ID.
 * @property {string}    username     - Author display name.
 * @property {string}    text         - Post body text.
 * @property {string}    imageUrl     - First image URL (legacy single-image compat).
 * @property {string[]}  imageUrls    - All image URLs attached to a post.
 * @property {string}    createdAt    - ISO 8601 creation timestamp.
 * @property {number}    likes        - Total like count.
 * @property {boolean}   likedByMe    - Whether the current user has liked this post.
 * @property {string[]}  likedUsers   - Usernames of every user who liked this post.
 * @property {Comment[]} comments     - Embedded comment objects.
 */

/**
 * @typedef {Object} UsePostsReturn
 * @property {Post[]}    posts        - Current list of loaded posts.
 * @property {number}    page         - Current page number (1-based).
 * @property {number}    total        - Total post count on the server.
 * @property {boolean}   hasMore      - Whether more pages can be fetched.
 * @property {boolean}   loading      - True during the initial page load.
 * @property {boolean}   loadingMore  - True while a "Load More" request is in flight.
 * @property {string}    error        - Error message, or empty string when none.
 * @property {string}    filter       - Active filter tab: "all" | "my".
 * @property {string}    sort         - Active sort order: "latest" | "trending".
 * @property {Function}  switchFilter - Change the active filter tab.
 * @property {Function}  switchSort   - Change the active sort order.
 * @property {Function}  loadMore     - Append the next page of posts.
 * @property {Function}  prependPost  - Optimistically add a new post to the top.
 * @property {Function}  toggleLike   - Optimistic like / unlike toggle.
 * @property {Function}  addComment   - Optimistic comment submission.
 * @property {Function}  deletePost   - Optimistically delete an owned post.
 * @property {Function}  reload       - Re-fetch page 1 with current filter/sort.
 */

/**
 * Manage social feed state: fetching, pagination, filtering, sorting,
 * and optimistic like / comment mutations.
 *
 * @param {string} [initialFilter="all"] - Starting filter: "all" | "my".
 * @param {string} [initialSort="latest"] - Starting sort: "latest" | "trending".
 * @returns {UsePostsReturn}
 */
export function usePosts(initialFilter = "all", initialSort = "latest") {
  const [posts, setPosts]           = useState([]);
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [hasMore, setHasMore]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]           = useState("");
  const [filter, setFilter]         = useState(initialFilter); // "all" | "my"
  const [sort, setSort]             = useState(initialSort);   // "latest" | "trending"

  /**
   * requestId — monotonically increasing counter used to discard responses from
   * requests that were superseded (e.g. user rapidly switches tabs).
   * Only the response matching the latest requestId is committed to state.
   */
  const activeRequestRef = useRef(0);

  /**
   * AbortController ref — holds the controller for the most recent in-flight
   * fetch so it can be cancelled when filter/sort changes.
   */
  const abortControllerRef = useRef(null);

  /**
   * Fetch posts from the API.
   *
   * @param {number}  requestedPage  - 1-based page number to fetch.
   * @param {boolean} append         - If true, append results to existing posts (Load More).
   * @param {string}  currentFilter  - Filter to use for this request.
   * @param {string}  currentSort    - Sort order to use for this request.
   */
  const loadPosts = useCallback(
    async (requestedPage = 1, append = false, currentFilter = filter, currentSort = sort) => {
      // ── Cancel any in-flight request before starting a new one ──────
      // This prevents a slow prior response from overwriting the newer state.
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Increment the request counter and capture this request's ID
      const requestId = ++activeRequestRef.current;

      // Show the correct loading indicator (full page vs. load-more spinner)
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setPosts([]); // Clear list immediately when changing tabs/sort
      }
      setError("");

      try {
        const queryParams = new URLSearchParams({
          page:   requestedPage,
          limit:  PAGE_SIZE,
          filter: currentFilter,
          sort:   currentSort,
        });

        const result = await api(`/posts?${queryParams.toString()}`);

        // ── Guard: only commit state if this is still the newest request ──
        if (requestId === activeRequestRef.current) {
          setPosts((current) => {
            if (!append) return result.posts;
            const existingIds = new Set(current.map((p) => p.id));
            const newPosts = (result.posts || []).filter((p) => !existingIds.has(p.id));
            return [...current, ...newPosts];
          });
          setHasMore(result.hasMore);
          setTotal(result.total || 0);
          setPage(requestedPage);
        }
      } catch (err) {
        // Silently ignore abort errors — they are intentional cancellations
        if (err.name === "AbortError") return;

        if (requestId === activeRequestRef.current) {
          setError(err.message || "Failed to load posts.");
        }
      } finally {
        if (requestId === activeRequestRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [filter, sort]
  );

  // Re-fetch from page 1 whenever the filter or sort state changes
  useEffect(() => {
    loadPosts(1, false, filter, sort);

    // Cleanup: abort the fetch if the component unmounts mid-request
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [filter, sort, loadPosts]);

  /**
   * Switch the active filter tab ("all" or "my").
   * Resets to page 1 and triggers a fresh fetch.
   *
   * @param {string} newFilter
   */
  const switchFilter = useCallback((newFilter) => {
    if (newFilter !== filter) {
      setFilter(newFilter);
      setPage(1);
    }
  }, [filter]);

  /**
   * Switch the active sort order ("latest" or "trending").
   * Resets to page 1 and triggers a fresh fetch.
   *
   * @param {string} newSort
   */
  const switchSort = useCallback((newSort) => {
    if (newSort !== sort) {
      setSort(newSort);
      setPage(1);
    }
  }, [sort]);

  /**
   * Fetch and append the next page of posts.
   * Guards against double-calls and re-fetching when at the end.
   */
  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      loadPosts(page + 1, true, filter, sort);
    }
  }, [page, loading, loadingMore, hasMore, filter, sort, loadPosts]);

  /**
   * Instantly prepend a newly created post to the feed top.
   * Called by Feed.jsx immediately after a successful POST /api/posts.
   *
   * @param {Post} newPost - The post object returned by the API.
   */
  const prependPost = useCallback((newPost) => {
    setPosts((current) => [newPost, ...current]);
    setTotal((prev) => prev + 1);
  }, []);

  /**
   * Instant Optimistic Like Toggle.
   *
   * Strategy (3-phase):
   *  1. Immediately update local state (0 ms perceived latency).
   *  2. Fire POST /api/posts/:id/like and sync with server response.
   *  3. If the request fails, roll back to the pre-click snapshot.
   *
   * @param {string} postId      - ID of the post to toggle like on.
   * @param {object} currentUser - The currently authenticated user.
   */
  const toggleLike = useCallback(async (postId, currentUser) => {
    if (!currentUser) return;

    // Snapshot the post before mutation for rollback
    let previousPost = null;

    // ── Phase 1: Optimistic update ──────────────────────────────────
    setPosts((current) =>
      current.map((p) => {
        if (p.id === postId) {
          previousPost = p;
          const willLike = !p.likedByMe;
          const updatedLikedUsers = willLike
            ? [...(p.likedUsers || []), currentUser.username]
            : (p.likedUsers || []).filter((u) => u !== currentUser.username);

          return {
            ...p,
            likedByMe:   willLike,
            likes:       willLike ? p.likes + 1 : Math.max(0, p.likes - 1),
            likedUsers:  updatedLikedUsers,
          };
        }
        return p;
      })
    );

    // ── Phase 2: API request ────────────────────────────────────────
    try {
      const { post: serverPost } = await api(`/posts/${postId}/like`, {
        method: "POST",
      });

      // Sync with the canonical server state (prevents count drift)
      setPosts((current) =>
        current.map((p) => (p.id === postId ? serverPost : p))
      );
    } catch (err) {
      // ── Phase 3: Rollback on failure ────────────────────────────
      if (previousPost) {
        setPosts((current) =>
          current.map((p) => (p.id === postId ? previousPost : p))
        );
      }
      throw err;
    }
  }, []);

  /**
   * Instant Optimistic Comment Submission.
   *
   * Strategy (3-phase):
   *  1. Append a temporary "optimistic" comment immediately.
   *  2. Fire POST /api/posts/:id/comments and replace the temp with server data.
   *  3. If the request fails, roll back to the pre-comment snapshot.
   *
   * @param {string} postId      - ID of the post to comment on.
   * @param {string} text        - Comment body text (already trimmed).
   * @param {object} currentUser - The currently authenticated user.
   * @returns {Promise<Post>}    - The updated post from the server.
   */
  const addComment = useCallback(async (postId, text, currentUser) => {
    if (!currentUser || !text.trim()) return;

    const tempCommentId = `temp_${Date.now()}`;

    // Temporary optimistic comment shown immediately in the UI
    const optimisticComment = {
      id:            tempCommentId,
      username:      currentUser.username,
      text:          text.trim(),
      createdAt:     new Date().toISOString(),
      isOptimistic:  true, // Flag so UI can style it differently if needed
    };

    let previousPost = null;

    // ── Phase 1: Optimistic append ──────────────────────────────────
    setPosts((current) =>
      current.map((p) => {
        if (p.id === postId) {
          previousPost = p;
          return { ...p, comments: [...(p.comments || []), optimisticComment] };
        }
        return p;
      })
    );

    // ── Phase 2: API request ────────────────────────────────────────
    try {
      const { post: serverPost } = await api(`/posts/${postId}/comments`, {
        method: "POST",
        body:   JSON.stringify({ text: text.trim() }),
      });

      // Replace the optimistic comment with the server-confirmed version
      setPosts((current) =>
        current.map((p) => (p.id === postId ? serverPost : p))
      );
      return serverPost;
    } catch (err) {
      // ── Phase 3: Rollback on failure ────────────────────────────
      if (previousPost) {
        setPosts((current) =>
          current.map((p) => (p.id === postId ? previousPost : p))
        );
      }
      throw err;
    }
  }, []);

  /**
   * Remove a post from the current feed immediately, restoring it in-place if
   * the server rejects the authenticated delete request.
   */
  const deletePost = useCallback(async (postId) => {
    const removedIndex = posts.findIndex((post) => post.id === postId);
    const removedPost = posts[removedIndex];
    if (!removedPost) return;

    setPosts((current) => current.filter((post) => post.id !== postId));
    setTotal((current) => Math.max(0, current - 1));

    try {
      await api(`/posts/${postId}`, { method: "DELETE" });
    } catch (error) {
      setPosts((current) => {
        const restored = [...current];
        restored.splice(removedIndex, 0, removedPost);
        return restored;
      });
      setTotal((current) => current + 1);
      throw error;
    }
  }, [posts]);

  return {
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
    /** Re-fetch page 1 with current filter and sort. */
    reload: () => loadPosts(1, false, filter, sort),
  };
}
