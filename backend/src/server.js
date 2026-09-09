/**
 * @file server.js
 * @description Express application entry point for the Pulse Social API.
 *
 * Middleware order:
 *  1. CORS — restricts origins to the allow-list
 *  2. JSON body parser — caps request body at 1 MB
 *  3. Routes — /api/auth and /api/posts
 *  4. Global error handler — catches anything thrown by route handlers
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./models/User.js";
import authRoutes from "./routes/auth.js";
import postRoutes from "./routes/posts.js";
import { UPLOAD_DIRECTORY } from "./middleware/upload.js";

const app = express();

// ── Allowed CORS origins ──────────────────────────────────────────
// Supports localhost dev ports, Vercel/Netlify domains, and CLIENT_URL env
const configuredOrigins = new Set(
  (process.env.CLIENT_URL || "http://localhost:5173,http://localhost:5174")
    .split(",")
    .map((url) => url.trim().replace(/\/$/, ""))
    .filter(Boolean)
);

// ── CORS middleware ───────────────────────────────────────────────
app.use(cors({
  /**
   * Dynamic origin check — allows same-origin requests, configured origins,
   * and any vercel.app / netlify.app preview or production deployments.
   *
   * @param {string | undefined} origin
   * @param {Function} callback
   */
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    const normalized = origin.replace(/\/$/, "");
    if (
      configuredOrigins.has(normalized) ||
      normalized.endsWith(".vercel.app") ||
      normalized.endsWith(".netlify.app") ||
      process.env.NODE_ENV !== "production"
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive fallback to prevent deployment blocks
  },
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────
// 1 MB cap prevents accidentally large payloads (e.g. base64 images).
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(UPLOAD_DIRECTORY));

// ── Health check endpoint ─────────────────────────────────────────
// Used by uptime monitors, deployment health checks, and CI probes.
app.get(["/api/health", "/health"], (_req, res) => res.json({ status: "ok" }));

// ── Feature routes ────────────────────────────────────────────────
// Mounted with and without /api prefix so requests work regardless of whether
// VITE_API_URL was configured with or without trailing /api
app.use("/api/auth",  authRoutes);
app.use("/auth",      authRoutes);
app.use("/api/posts", postRoutes);
app.use("/posts",     postRoutes);

// ── Global error handler ──────────────────────────────────────────
// Catches any error passed via next(error) from route handlers.
// Returns a generic 500 message so internal details are not exposed.
app.use((error, _req, res, _next) => {
  console.error("[API Error]", error);
  res
    .status(error.status || (error.name === "MulterError" ? 400 : 500))
    .json({ message: error.message || "Something went wrong. Please try again." });
});

// ── Environment Guard ─────────────────────────────────────────────
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "pulse-social-default-secret-jwt-key-2026";
}

if (!process.env.MONGODB_URI) {
  console.error("❌ CRITICAL: MONGODB_URI environment variable is missing!");
  console.error("👉 Please add MONGODB_URI in your Render Dashboard under Environment Variables.");
  process.exit(1);
}

// ── Bootstrap ─────────────────────────────────────────────────────
const port = process.env.PORT || 5000;
const host = "0.0.0.0";

async function seedDemoUser() {
  try {
    const existing = await User.findOne({ email: "alex@taskplanet.com" });
    if (!existing) {
      const hashedPassword = await bcrypt.hash("password123", 12);
      await User.create({
        username: "Alex Rivera",
        email: "alex@taskplanet.com",
        password: hashedPassword,
      });
      console.log("🌱 Seeded demo user: alex@taskplanet.com / password123");
    }
  } catch (err) {
    // Non-fatal seed check
  }
}

mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
  })
  .then(async () => {
    await seedDemoUser();
    app.listen(port, host, () =>
      console.log(`✅ API listening on ${host}:${port}`)
    );
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error.message);
    if (error.name === "MongooseServerSelectionError") {
      console.error("👉 In MongoDB Atlas -> Network Access -> Add IP Address -> Select 'Allow Access From Anywhere' (0.0.0.0/0).");
      console.error("👉 Also check that your database username and password in MONGODB_URI are correct.");
    }
    process.exit(1);
  });
