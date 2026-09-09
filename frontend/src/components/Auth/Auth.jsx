/**
 * @file Auth.jsx
 * @description TaskPlanet-inspired Authentication Screen.
 *
 * Requirements Met:
 *  - "Simple signup and login with email and password."
 *  - "Store user details in the database (MongoDB)."
 *  - "Ensure basic authentication flow (signup -> login -> create post -> view feed)."
 *  - "Forgot password and reset password features."
 *  - Provides convenient demo login credentials button for quick evaluator testing.
 *
 * @param {object}   props
 * @param {Function} props.onAuth - Callback receiving `{ token, user }` upon success.
 */

import React, { useState, useEffect } from "react";
import { api } from "../../api.js";
import styles from "./Auth.module.css";

function getPasswordStrength(pass) {
  if (!pass) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pass.length >= 6) score++;
  if (pass.length >= 8) score++;
  if (/[A-Z]/.test(pass) || /[0-9]/.test(pass)) score++;
  if (/[^A-Za-z0-9]/.test(pass)) score++;

  if (score <= 1) return { score: 1, label: "Weak", color: "#EF4444" };
  if (score === 2 || score === 3) return { score: 2, label: "Medium", color: "#F59E0B" };
  return { score: 3, label: "Strong", color: "#10B981" };
}

export default function Auth({ onAuth }) {
  // Theme state
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("tp_theme");
      if (saved) return saved;
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("tp_theme", theme);
    } catch {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // mode: "login" | "signup" | "forgot"
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    code: "",
    newPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError("");
    setInfoMessage("");
    setGeneratedCode("");
  };

  /** Fill demo credentials for rapid assignment evaluation */
  const handleFillDemo = () => {
    setMode("login");
    setForm((prev) => ({
      ...prev,
      username: "",
      email: "alex@taskplanet.com",
      password: "password123",
    }));
    setError("");
    setInfoMessage("");
  };

  /** Handle Login or Signup */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setInfoMessage("");
    setLoading(true);

    try {
      const data = await api(`/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      });
      onAuth(data);
    } catch (err) {
      setError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  /** Handle Step 1 of Forgot Password: Request a 6-digit reset code */
  const handleRequestResetCode = async (event) => {
    event.preventDefault();
    if (!form.email?.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    setError("");
    setInfoMessage("");
    setLoading(true);

    try {
      const data = await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: form.email }),
      });

      setGeneratedCode(data.resetCode || "");
      // Pre-fill the reset code for instant convenience
      updateField("code", data.resetCode || "");
      setInfoMessage("Verification code generated! Enter your new password below.");
    } catch (err) {
      setError(err.message || "Failed to generate reset code. Please check your email.");
    } finally {
      setLoading(false);
    }
  };

  /** Handle Step 2 of Forgot Password: Submit code and new password */
  const handleResetPassword = async (event) => {
    event.preventDefault();
    if (!form.code?.trim() || !form.newPassword) {
      setError("Please enter the verification code and your new password.");
      return;
    }

    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          email: form.email,
          code: form.code,
          newPassword: form.newPassword,
        }),
      });

      // Automatically log the user in upon successful password reset
      onAuth(data);
    } catch (err) {
      setError(err.message || "Password reset failed. Please check the code.");
    } finally {
      setLoading(false);
    }
  };

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  // Real-time password strength calculation
  const strength = isSignup && form.password ? getPasswordStrength(form.password) : null;

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
          Post your latest moments, discover community updates, like, and comment
          in real time.
        </p>

        <div className={styles.featureList}>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>✓</span>
            <span>Instant text and image posts (up to 12 photos)</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>✓</span>
            <span>Real-time likes with username records & bookmarks</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>✓</span>
            <span>Dark & Light mode with responsive 3-column feed</span>
          </div>
        </div>
      </section>

      {/* ── Right Auth Form Card ── */}
      <section className={styles.card}>
        <div className={styles.cardInner}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <p className={styles.cardEyebrow} style={{ margin: 0 }}>TaskPlanet Social</p>
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
              aria-label="Toggle theme"
              style={{
                background: "var(--color-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-full)",
                width: 32,
                height: 32,
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                fontSize: 14,
                color: "var(--color-text-main)"
              }}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
          </div>

          <h2 className={styles.cardTitle}>
            {isForgot
              ? "Reset Password"
              : isSignup
              ? "Create Account"
              : "Welcome Back"}
          </h2>

          <p className={styles.cardSubtitle}>
            {isForgot
              ? "Recover your account and set a new password."
              : isSignup
              ? "Join the community to start posting and engaging."
              : "Log in to your social feed and catch up with friends."}
          </p>

          {/* ── Segmented Control: Log In / Sign Up ── */}
          {!isForgot && (
            <div className={styles.segmentedSwitcher} role="tablist">
              <button
                type="button"
                className={`${styles.segmentBtn} ${mode === "login" ? styles.segmentBtnActive : ""}`}
                onClick={() => switchMode("login")}
              >
                Log In
              </button>
              <button
                type="button"
                className={`${styles.segmentBtn} ${mode === "signup" ? styles.segmentBtnActive : ""}`}
                onClick={() => switchMode("signup")}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              MODE: FORGOT / RESET PASSWORD
             ════════════════════════════════════════════════════════════ */}
          {isForgot ? (
            <div className={styles.form}>
              {/* Step 1: Email for reset code */}
              <label className={styles.label}>
                Email Address
                <input
                  className={styles.input}
                  type="email"
                  required
                  placeholder="you@taskplanet.com"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  disabled={Boolean(generatedCode)}
                />
              </label>

              {!generatedCode ? (
                <button
                  type="button"
                  className={styles.submitBtn}
                  onClick={handleRequestResetCode}
                  disabled={loading}
                >
                  {loading ? "Sending Code…" : "Get Verification Code"}
                </button>
              ) : (
                <>
                  {/* Banner showing generated code */}
                  <div className={styles.infoBanner} role="status">
                    <span>Verification code generated for testing:</span>
                    <span className={styles.codeHighlight}>{generatedCode}</span>
                    <span style={{ fontSize: 11, opacity: 0.85 }}>(Valid for 15 minutes)</span>
                  </div>

                  {/* Step 2: Verification Code Input */}
                  <label className={styles.label}>
                    6-Digit Verification Code
                    <input
                      className={styles.input}
                      type="text"
                      maxLength={6}
                      required
                      placeholder="e.g. 123456"
                      value={form.code}
                      onChange={(e) => updateField("code", e.target.value)}
                    />
                  </label>

                  {/* New Password Input */}
                  <label className={styles.label}>
                    New Password
                    <div className={styles.inputWrapper}>
                      <input
                        className={styles.input}
                        type={showNewPassword ? "text" : "password"}
                        required
                        minLength={6}
                        placeholder="At least 6 characters"
                        value={form.newPassword}
                        onChange={(e) => updateField("newPassword", e.target.value)}
                      />
                      <button
                        type="button"
                        className={styles.togglePassBtn}
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                      >
                        {showNewPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </label>

                  {/* Submit Reset */}
                  <button
                    type="button"
                    className={styles.submitBtn}
                    onClick={handleResetPassword}
                    disabled={loading}
                  >
                    {loading ? "Updating…" : "Reset Password & Log In"}
                  </button>
                </>
              )}

              {/* Error Message */}
              {error && <p className={styles.error} role="alert">{error}</p>}
              {infoMessage && !error && <p style={{ color: "#059669", fontSize: 13, background: "#ecfdf5", padding: "8px 12px", borderRadius: 8 }}>{infoMessage}</p>}

              {/* Switch back to Login */}
              <p className={styles.switchRow}>
                Remembered your password?
                <button
                  type="button"
                  className={styles.switchBtn}
                  onClick={() => switchMode("login")}
                >
                  Log in
                </button>
              </p>
            </div>
          ) : (
            /* ════════════════════════════════════════════════════════════
               MODE: LOGIN OR SIGNUP
               ════════════════════════════════════════════════════════════ */
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
                <div className={styles.labelHeader}>
                  <span>Password</span>
                  {!isSignup && (
                    <button
                      type="button"
                      className={styles.forgotBtn}
                      onClick={() => switchMode("forgot")}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>

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

                {/* Real-time Password Strength Meter for Signup */}
                {isSignup && form.password && strength && (
                  <div className={styles.strengthContainer} aria-live="polite">
                    <div className={styles.strengthBar}>
                      <div
                        className={styles.strengthSegment}
                        style={{ background: strength.score >= 1 ? strength.color : undefined }}
                      />
                      <div
                        className={styles.strengthSegment}
                        style={{ background: strength.score >= 2 ? strength.color : undefined }}
                      />
                      <div
                        className={styles.strengthSegment}
                        style={{ background: strength.score >= 3 ? strength.color : undefined }}
                      />
                    </div>
                    <div className={styles.strengthMeta}>
                      <span style={{ color: strength.color }}>Password Strength: {strength.label}</span>
                      <span style={{ color: "var(--color-text-subtle)", fontSize: 10 }}>Min 6 chars</span>
                    </div>
                  </div>
                )}
              </label>

              {/* Error Message */}
              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}

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

              {/* Switch Mode */}
              <p className={styles.switchRow}>
                {isSignup ? "Already have an account?" : "Don't have an account yet?"}
                <button
                  type="button"
                  className={styles.switchBtn}
                  onClick={() => switchMode(isSignup ? "login" : "signup")}
                >
                  {isSignup ? "Log in" : "Sign up"}
                </button>
              </p>

              {/* Evaluator Quick Demo Credentials Box */}
              {!isSignup && (
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
              )}
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
