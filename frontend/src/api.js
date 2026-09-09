/**
 * @file api.js
 * @description Centralised API client for the Pulse / TaskPlanet Social frontend.
 *
 * Resilient features:
 *  - Automatically strips duplicate or trailing slashes from VITE_API_URL
 *  - Sets Content-Type to application/json for regular JSON bodies
 *  - Automatically lets browser handle multipart/form-data boundary for file uploads
 *  - Attaches Bearer JWT token when present in localStorage
 *  - Provides human-readable error messages for 404, 401, and 500 statuses
 */

/** Normalise Base API URL from environment */
const rawUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").trim();
// Strip any trailing slashes e.g. "https://api.example.com/" -> "https://api.example.com"
const cleanUrl = rawUrl.replace(/\/+$/, "");
// If the configured URL ends with /api, use it as is; otherwise keep cleanUrl
export const API_URL = cleanUrl;

/**
 * Make an authenticated request to the backend API.
 *
 * @param {string}      path       - API path, e.g. `"/auth/login"` or `"/posts"`.
 * @param {RequestInit} [options]  - Fetch options (method, body, headers...).
 * @returns {Promise<any>}         Parsed JSON response.
 */
export async function api(path, options = {}) {
  const token = localStorage.getItem("pulse_token");
  const isFormData = options.body instanceof FormData;

  // Build safe URL without double slashes
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const targetUrl = `${API_URL}${normalizedPath}`;

  let response;
  try {
    response = await fetch(targetUrl, {
      ...options,
      headers: {
        // Only set Content-Type for JSON (fetch must set multipart boundary for FormData)
        ...(!isFormData ? { "Content-Type": "application/json" } : {}),
        // Attach JWT token if authenticated
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (networkError) {
    throw new Error(
      "Unable to connect to the backend server. Please check your internet connection and ensure the backend is running."
    );
  }

  // Parse JSON response safely
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMsg = data.message;
    if (!errorMsg) {
      if (response.status === 404) {
        errorMsg = "API endpoint not found (404). Please ensure the backend server is running and your API URL is correct.";
      } else if (response.status === 401) {
        errorMsg = "Incorrect email or password. If you don't have an account yet, please sign up.";
      } else if (response.status >= 500) {
        errorMsg = `Server error (${response.status}). Please try again shortly.`;
      } else {
        errorMsg = `Request failed with status ${response.status}.`;
      }
    }
    throw new Error(errorMsg);
  }

  return data;
}
