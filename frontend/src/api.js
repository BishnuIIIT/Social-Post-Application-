/**
 * @file api.js
 * @description Centralised API client for the Pulse Social frontend.
 *
 * Every request automatically:
 *  - Sets Content-Type to application/json for JSON requests
 *  - Leaves multipart FormData headers to the browser so it can add a boundary
 *  - Attaches the stored JWT as a Bearer token (when present)
 *  - Throws a descriptive Error for non-2xx responses
 */

/** Base URL — override via VITE_API_URL in .env */
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Make an authenticated JSON request to the Pulse API.
 *
 * @param {string}      path       - API path, e.g. `"/posts?page=1"`.
 * @param {RequestInit} [options]  - Standard Fetch options (method, body, …).
 * @returns {Promise<any>}         Parsed JSON response body.
 * @throws  {Error}                When the network fails or status is non-2xx.
 *
 * @example
 * // GET posts
 * const { posts, hasMore } = await api("/posts?page=1");
 *
 * // POST a new post
 * const { post } = await api("/posts", {
 *   method: "POST",
 *   body: JSON.stringify({ text: "Hello world!" }),
 * });
 */
export async function api(path, options = {}) {
  const token = localStorage.getItem("pulse_token");
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      // Never set multipart Content-Type manually; fetch adds the required boundary.
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      // Attach JWT only when a token exists (unauthenticated feed reads are allowed)
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // Allow callers to override individual headers
      ...options.headers,
    },
  });

  // Attempt JSON parse; fall back gracefully for empty bodies (e.g. 204)
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}.`);
  }

  return data;
}
