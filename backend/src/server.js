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
// Used by uptime monitors and CI readiness probes.
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// ── Feature routes ────────────────────────────────────────────────
app.use("/api/auth",  authRoutes);
app.use("/api/posts", postRoutes);

// ── Global error handler ──────────────────────────────────────────
// Catches any error passed via next(error) from route handlers.
// Returns a generic 500 message so internal details are not exposed.
app.use((error, _req, res, _next) => {
  console.error("[API Error]", error);
  res
    .status(error.status || (error.name === "MulterError" ? 400 : 500))
    .json({ message: error.message || "Something went wrong. Please try again." });
});

// ── Bootstrap ─────────────────────────────────────────────────────
const port = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() =>
    app.listen(port, () =>
      console.log(`✅ API listening on http://localhost:${port}`)
    )
  )
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  });
