/**
 * @file useAuth.js
 * @description Custom React hook for managing user session state.
 *
 * Reads the persisted user from localStorage on first render, and exposes
 * `login` / `logout` actions that keep localStorage in sync.
 */

import { useState, useCallback } from "react";

/** localStorage keys used across the app. */
const TOKEN_KEY = "pulse_token";
const USER_KEY  = "pulse_user";

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} username
 * @property {string} email
 */

/**
 * @typedef {Object} AuthPayload
 * @property {string} token - JWT returned by the auth API.
 * @property {User}   user  - Authenticated user object.
 */

/**
 * @typedef {Object} UseAuthReturn
 * @property {User | null} session  - Current user, or null when logged out.
 * @property {Function}    login    - Persist token + user, update session.
 * @property {Function}    logout   - Clear storage, reset session.
 */

/**
 * Manage authentication session state with localStorage persistence.
 *
 * @returns {UseAuthReturn}
 *
 * @example
 * const { session, login, logout } = useAuth();
 * if (!session) return <Auth onAuth={login} />;
 */
export function useAuth() {
  // Lazily hydrate from localStorage — avoids a second render on load
  const [session, setSession] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  /**
   * Called on successful signup or login.
   * Persists the JWT + user payload, then updates in-memory session.
   *
   * @param {AuthPayload} payload
   */
  const login = useCallback(({ token, user }) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setSession(user);
  }, []);

  /**
   * Clear persisted credentials and reset the session to null.
   */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setSession(null);
  }, []);

  return { session, login, logout };
}
