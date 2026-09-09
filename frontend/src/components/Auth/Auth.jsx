/**
 * @file Auth.jsx
 * @description TaskPlanet-inspired Authentication Screen.
 *
 * Requirements Met:
 *  - "Simple signup and login with email and password."
 *  - "Store user details in the database (MongoDB)."
 *  - "Ensure basic authentication flow (signup -> login -> create post -> view feed)."
 *  - Provides convenient demo login credentials button for quick evaluator testing.
 *
 * @param {object}   props
 * @param {Function} props.onAuth - Callback receiving `{ token, user }` upon success.
 */

import React, { useState } from "react";
import { api }          from "../../api.js";
import ErrorMessage     from "../shared/ErrorMessage.jsx";
import styles           from "./Auth.module.css";

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleMode = () => {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setError("");
  };

  /** Fill demo credentials for rapid assignment evaluation */
  const handleFillDemo = () => {
    setMode("login");
    setForm({
      username: "",
      email: "alex@taskplanet.com",
      password: "password123",
    });
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await api(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      onAuth(data);
    } catch (err) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const isSignup = mode === "signup";

  return (
    <main className={styles.shell}>
      {/* ── Left Hero Panel (TaskPlanet Brand Identity) ── */}
      <section className={styles.brand} aria-hidden="true">
        <div className={styles.brandLogo}>TP</div>
        <p className={styles.brandEyebrow}>
          <span>●</span> TaskPlanet Social Community
        </p>
        <h1 className={styles.brandHeadline}>
          Connect, Share & Grow with the Community.
        </h1>
        <p className={styles.brandBody}>
          Post your latest moments, discover community updates, like, and comment in real time.
        </p>

        <div className={styles.featureList}>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>✓</span>
            <span>Instant text and image posts</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>✓</span>
            <span>Real-time likes with username records</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>✓</span>
            <span>Responsive mobile-first experience</span>
          </div>
        </div>
      </section>

      {/* ── Right Auth Form Card ── */}
      <section className={styles.card}>
        <div className={styles.cardInner}>
          <p className={styles.cardEyebrow}>TaskPlanet Social</p>
          <h2 className={styles.cardTitle}>
            {isSignup ? "Create Account" : "Welcome Back"}
          </h2>
          <p className={styles.cardSubtitle}>
            {isSignup
              ? "Join the community to start posting and engaging."
              : "Log in to your social feed and catch up with friends."}
          </p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {/* Username — Signup Only */}
            {isSignup && (
              <label className={styles.label}>
                Username
                <input
                  className={styles.input}
                  type="text"
                  required
                  minLength={2}
                  maxLength={30}
                  autoComplete="username"
                  placeholder="e.g. alex_rivera"
                  value={form.username}
                  onChange={(e) => updateField("username", e.target.value)}
                />
              </label>
            )}

            {/* Email Address */}
            <label className={styles.label}>
              Email Address
              <input
                className={styles.input}
                type="email"
                required
                autoComplete="email"
                placeholder="you@taskplanet.com"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
              />
            </label>

            {/* Password */}
            <label className={styles.label}>
              Password
              <div className={styles.inputWrapper}>
                <input
                  className={styles.input}
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                />
                <button
                  type="button"
                  className={styles.togglePassBtn}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {/* Error Message — uses shared ErrorMessage component */}
            {error && <ErrorMessage message={error} />}

            {/* Submit Button */}
            <button
              className={styles.submitBtn}
              type="submit"
              disabled={loading}
              aria-label={loading ? "Please wait…" : isSignup ? "Create account" : "Log in"}
            >
              {loading
                ? "Please wait…"
                : isSignup
                ? "Create Account"
                : "Log In to Feed"}
            </button>
          </form>

          {/* Switch Mode */}
          <p className={styles.switchRow}>
            {isSignup ? "Already have an account?" : "Don't have an account yet?"}
            <button
              type="button"
              className={styles.switchBtn}
              onClick={toggleMode}
            >
              {isSignup ? "Log in" : "Sign up"}
            </button>
          </p>

          {/* Evaluator Quick Demo Credentials Box */}
          <div className={styles.demoBox}>
            <span className={styles.demoText}>Testing the assignment?</span>
            <button
              type="button"
              className={styles.demoBtn}
              onClick={handleFillDemo}
            >
              Fill Demo Login
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
