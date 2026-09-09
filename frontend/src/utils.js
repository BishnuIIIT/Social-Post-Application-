/**
 * @file utils.js
 * @description Shared pure utility functions for the Pulse Social frontend.
 */

// ── Avatar colour palette ─────────────────────────────────────────
// Each user gets a deterministic background/foreground pair based on
// a simple hash of their username — so the same user always gets the
// same colour across sessions.
const AVATAR_PALETTE = [
  { bg: "#e5e3ff", fg: "#433db3" }, // lavender
  { bg: "#fde8ec", fg: "#b52545" }, // rose
  { bg: "#e6f7ef", fg: "#1a7a44" }, // sage
  { bg: "#fff3e0", fg: "#c05a00" }, // amber
  { bg: "#e2f0fd", fg: "#1057a8" }, // sky
  { bg: "#f3e5f5", fg: "#7b1fa2" }, // violet
  { bg: "#e8fdf1", fg: "#1a6640" }, // emerald
  { bg: "#fef3e2", fg: "#a16200" }, // gold
];

/**
 * Derive a stable integer hash from an arbitrary string.
 * Used to pick a consistent avatar colour for a given username.
 *
 * @param {string} str
 * @returns {number} Non-negative integer hash.
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

/**
 * Return one entry from AVATAR_PALETTE deterministically for a given name.
 *
 * @param {string} [name="?"]
 * @returns {{ bg: string, fg: string }}
 */
export function avatarColors(name = "?") {
  return AVATAR_PALETTE[hashString(name) % AVATAR_PALETTE.length];
}

/**
 * Extract the first character of a name, uppercased — used as the
 * avatar letter inside the coloured circle.
 *
 * @param {string} [name="?"]
 * @returns {string} Single uppercase character.
 */
export function initials(name = "?") {
  return name.trim().charAt(0).toUpperCase();
}

/**
 * Convert an ISO timestamp to a human-readable relative string.
 * Returns "Just now", "Xm ago", "Xh ago", or a locale date string.
 *
 * @param {string | Date} value - ISO date string or Date object.
 * @returns {string} Human-friendly time label.
 *
 * @example
 * relativeTime("2024-01-01T10:00:00Z") // "2h ago" (if 2 hours have passed)
 */
export function relativeTime(value) {
  const mins = Math.floor((Date.now() - new Date(value)) / 60_000);
  if (mins < 1)    return "Just now";
  if (mins < 60)   return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
