/**
 * @file App.jsx
 * @description Root application component.
 *
 * Responsibilities:
 *  - Manage user session via the `useAuth` hook.
 *  - Render the Auth page when the user is logged out.
 *  - Render the Feed view when the user is authenticated.
 *
 * All child components receive only what they need — session management
 * does not leak into feature components.
 */

import React from "react";
import { useAuth } from "./hooks/useAuth.js";
import Auth from "./components/Auth/Auth.jsx";
import Feed from "./components/Feed/Feed.jsx";

/**
 * Application root. Renders either the authentication page or the main feed
 * depending on whether a session exists in localStorage.
 */
export default function App() {
  const { session, login, logout } = useAuth();

  // If no session exists, show the Auth screen; otherwise show the Feed
  return session
    ? <Feed user={session} onLogout={logout} />
    : <Auth onAuth={login} />;
}
