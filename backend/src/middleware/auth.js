/**
 * @file auth.js (middleware)
 * @description Express middleware that enforces JWT authentication.
 *
 * Attaches the decoded token payload to `req.user` so downstream route
 * handlers can access `req.user.id` and `req.user.username` without
 * decoding the token again.
 *
 * Usage:
 *  import { requireAuth } from "../middleware/auth.js";
 *  router.post("/posts", requireAuth, createPostHandler);
 */

import jwt from "jsonwebtoken";

/**
 * Middleware — requires a valid Bearer JWT in the Authorization header.
 *
 * On success: calls `next()` and attaches `{ id, username }` to `req.user`.
 * On missing token: responds 401 "Authentication required."
 * On invalid/expired token: responds 401 "Session expired."
 *
 * @param {import("express").Request}  req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export function requireAuth(req, res, next) {
  // Extract token from "Authorization: Bearer <token>" header
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Authentication required." });
  }

  try {
    // jwt.verify throws if the token is expired or has an invalid signature
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Your session has expired. Please log in again." });
  }
}
