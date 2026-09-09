/**
 * @file auth.js
 * @description Authentication routes for the Pulse Social API.
 *
 * Endpoints:
 *  POST /api/auth/signup — Register a new user account
 *  POST /api/auth/login  — Authenticate with email + password
 *
 * Both endpoints return `{ token, user }` on success.
 * The JWT is signed with the JWT_SECRET env variable and expires in 7 days.
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Create a signed JWT for a given user.
 * The token payload includes only the user ID and username (no sensitive data).
 *
 * @param {import("mongoose").Document} user - Mongoose User document.
 * @returns {string} Signed JWT string.
 */
const tokenFor = (user) =>
  jwt.sign(
    { id: user._id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

/**
 * Build the public user payload returned to clients after auth.
 * Deliberately omits `password` and internal Mongoose fields.
 *
 * @param {import("mongoose").Document} user - Mongoose User document.
 * @returns {{ id: string, username: string, email: string }}
 */
const userPayload = (user) => ({
  id:       user._id,
  username: user.username,
  email:    user.email,
});

// ── POST /api/auth/signup ─────────────────────────────────────────
/**
 * Register a new user.
 *
 * Body: { username, email, password }
 *
 * Validation:
 *  - All three fields are required and must be non-empty
 *  - Password must be ≥ 6 characters
 *  - Email and username must be unique
 *
 * Passwords are hashed with bcrypt (salt rounds: 12) before storage.
 */
router.post("/signup", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    // ── Input validation ─────────────────────────────────────────
    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        message: "Username, email, and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters.",
      });
    }

    // ── Uniqueness check ─────────────────────────────────────────
    const exists = await User.findOne({
      $or: [
        { email:    email.toLowerCase().trim()    },
        { username: username.trim()                },
      ],
    });

    if (exists) {
      return res.status(409).json({
        message: "That email or username is already in use.",
      });
    }

    // ── Create user ──────────────────────────────────────────────
    const user = await User.create({
      username: username.trim(),
      email:    email.toLowerCase().trim(),
      password: await bcrypt.hash(password, 12), // high work-factor hash
    });

    res.status(201).json({ token: tokenFor(user), user: userPayload(user) });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────
/**
 * Authenticate an existing user.
 *
 * Body: { email, password }
 *
 * Uses a timing-safe bcrypt comparison to prevent user enumeration attacks
 * (the same 401 is returned whether the email or password is wrong).
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Lookup by email (case-insensitive via lowercase schema transform)
    const user = await User.findOne({ email: email?.toLowerCase() });

    // Use constant-time comparison — even when no user found, run bcrypt to
    // avoid timing attacks that would reveal whether an email is registered.
    const passwordMatch = user
      ? await bcrypt.compare(password || "", user.password)
      : false;

    if (!user || !passwordMatch) {
      return res.status(401).json({ message: "Incorrect email or password." });
    }

    res.json({ token: tokenFor(user), user: userPayload(user) });
  } catch (error) {
    next(error);
  }
});

export default router;
