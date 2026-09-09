/**
 * @file posts.js
 * @description Routes for the social post feed.
 *
 * Endpoints:
 *  GET  /api/posts             — Paginated list of posts with filtering & sorting
 *  POST /api/posts             — Create a new post (auth required)
 *  POST /api/posts/:id/like    — Toggle like on a post (auth required)
 *  POST /api/posts/:id/comments — Add a comment to a post (auth required)
 */

import { Router } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import fs from "node:fs/promises";
import path from "node:path";
import Post from "../models/Post.js";
import { requireAuth } from "../middleware/auth.js";
import { UPLOAD_DIRECTORY, uploadImages } from "../middleware/upload.js";

const router = Router();
const UPLOADED_FILENAME = /^[0-9a-f-]{36}\.(jpg|png|webp|gif)$/i;

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Extract a user ID and username from the Authorization header without rejecting.
 *
 * @param {import("express").Request} req
 * @returns {{ id: string, username: string } | null}
 */
const optionalUser = (req) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { id: decoded.id, username: decoded.username };
  } catch {
    return null;
  }
};

/** Remove only locally managed upload files; remote/legacy image URLs are never touched. */
const removeUploadedFiles = async (imageUrls) => {
  await Promise.all((imageUrls || []).map(async (imageUrl) => {
    try {
      const filename = path.basename(new URL(imageUrl).pathname);
      if (!UPLOADED_FILENAME.test(filename)) return;
      const target = path.resolve(UPLOAD_DIRECTORY, filename);
      if (path.dirname(target) !== path.resolve(UPLOAD_DIRECTORY)) return;
      await fs.unlink(target).catch((error) => {
        if (error.code !== "ENOENT") throw error;
      });
    } catch (error) {
      // The post is already deleted. Log unexpected cleanup failures for diagnosis.
      console.error("[Upload cleanup failed]", error);
    }
  }));
};
/**
 * @typedef {Object} SerializedComment
 * @property {string} id
 * @property {string} userId
 * @property {string} username   - Saved per the assignment requirement.
 * @property {string} text
 * @property {string} createdAt
 */

/**
 * @typedef {Object} SerializedPost
 * @property {string}            id
 * @property {string}            author       - Author user ID.
 * @property {string}            username     - Author display name.
 * @property {string}            text
 * @property {string}            imageUrl     - First image (legacy compat).
 * @property {string[]}          imageUrls    - All image URLs.
 * @property {string}            createdAt
 * @property {number}            likes        - Total like count.
 * @property {boolean}           likedByMe    - Whether the requesting user liked this.
 * @property {string[]}          likedUsers   - Usernames of all likers (assignment req).
 * @property {SerializedComment[]} comments
 */

/**
 * Serialize a Mongoose Post document into a clean, client-safe object.
 * Handles both the new embedded-like schema and legacy ObjectId-only likes.
 *
 * @param {import("mongoose").Document} post         - Raw Mongoose document.
 * @param {string | null}               currentUserId - ID of the requesting user.
 * @returns {SerializedPost}
 */
const serialize = (post, currentUserId) => {
  // Normalise image fields: prefer the `imageUrls` array; fall back to
  // the legacy single `imageUrl` string so old posts remain readable.
  const imageUrls = post.imageUrls?.length
    ? post.imageUrls
    : post.imageUrl
      ? [post.imageUrl]
      : [];

  // Normalise the likes array — handles both:
  //   • New schema: { user: ObjectId, username: string }
  //   • Legacy schema: plain ObjectId (username was not saved)
  const normalizedLikes = (post.likes || []).map((l) => {
    if (l && typeof l === "object" && l.user) {
      return {
        userId:   l.user.toString(),
        username: l.username || "Anonymous",
      };
    }
    return {
      userId:   l.toString(),
      username: "User", // Username unavailable in legacy documents
    };
  });

  // Determine whether the requesting user has liked this post
  const likedByMe = currentUserId
    ? normalizedLikes.some((l) => l.userId === currentUserId)
    : false;

  return {
    id:       post._id,
    author:   post.author,
    username: post.username,
    text:     post.text || "",
    imageUrl: imageUrls[0] || "",
    imageUrls,
    createdAt: post.createdAt,
    likes:     normalizedLikes.length,
    likedByMe,
    // likedUsers — fulfils assignment: "Save the usernames of people who liked"
    likedUsers: normalizedLikes.map((l) => l.username),
    comments: (post.comments || []).map((c) => ({
      id:        c._id,
      userId:    c.user,
      username:  c.username, // Saved per the assignment requirement
      text:      c.text,
      createdAt: c.createdAt,
    })),
  };
};

// ── GET /api/posts ────────────────────────────────────────────────
/**
 * Return a paginated list of posts sorted newest-first or by trending.
 *
 * Query params:
 *  - page   {number} 1-based page number (default: 1)
 *  - limit  {number} Results per page (default: 10, max: 30)
 *  - filter {string} "my" to only show logged-in user's posts, or "all"
 *  - sort   {string} "latest" (default) or "trending" (most likes)
 */
router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 30);
    const filter = req.query.filter || "all";
    const sort = req.query.sort || "latest";

    const user = optionalUser(req);
    const query = {};

    // Support "My Posts" tab
    if (filter === "my") {
      if (!user) {
        return res.status(401).json({ message: "Log in to view your posts." });
      }
      query.author = user.id;
    }

    // For "latest" we use a simple sort on createdAt.
    // For "trending" we use an aggregation pipeline so we can sort by the
    // array length of `likes` (MongoDB does not support sorting by
    // `"likes.length"` with a regular sort — only $size works).
    let posts, total;

    if (sort === "trending") {
      // When the "my" filter is applied, author is a string from the JWT —
      // aggregation $match needs an ObjectId, so convert it.
      const aggMatch = query.author
        ? { ...query, author: new mongoose.Types.ObjectId(query.author) }
        : query;

      [posts, total] = await Promise.all([
        Post.aggregate([
          { $match: aggMatch },
          { $addFields: { likesCount: { $size: "$likes" } } },
          { $sort: { likesCount: -1, createdAt: -1 } },
          { $skip: (page - 1) * limit },
          { $limit: limit },
        ]),
        Post.countDocuments(query),
      ]);
    } else {
      [posts, total] = await Promise.all([
        Post.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        Post.countDocuments(query),
      ]);
    }

    res.json({
      posts: posts.map((post) => serialize(post, user?.id || null)),
      page,
      limit,
      total,
      hasMore: page * limit < total,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/posts ───────────────────────────────────────────────
/**
 * Create a new post.
 * Requirement: "A user can post text, image, or both. Both fields should not be mandatory (either one is enough)."
 */
router.post("/", requireAuth, uploadImages.array("images", 12), async (req, res, next) => {
  try {
    const text = req.body.text?.trim() || "";
    // Retain API support for legacy JSON clients that submit one remote image URL.
    const legacyImageUrl = req.body.imageUrl?.trim() || "";
    const uploadedImageUrls = (req.files || []).map((file) =>
      `${req.protocol}://${req.get("host")}/uploads/${encodeURIComponent(file.filename)}`
    );

    if (!text && !legacyImageUrl && !uploadedImageUrls.length) {
      return res.status(400).json({ message: "Please provide post text or at least one image." });
    }

    if (legacyImageUrl && !/^https?:\/\/.+/i.test(legacyImageUrl) && !legacyImageUrl.startsWith("data:image/")) {
      return res.status(400).json({ message: "Please enter a valid image URL starting with http:// or https://." });
    }

    const imageUrls = uploadedImageUrls.length ? uploadedImageUrls : legacyImageUrl ? [legacyImageUrl] : [];

    const post = await Post.create({
      author: req.user.id,
      username: req.user.username,
      text,
      imageUrl: imageUrls[0] || "",
      imageUrls,
      likes: [],
      comments: [],
    });

    res.status(201).json({ post: serialize(post, req.user.id) });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/posts/:id/like ──────────────────────────────────────
/**
 * Toggle like on a post.
 * Requirement: "Save the usernames of people who liked or commented."
 */
router.post("/:id/like", requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    const existingIndex = post.likes.findIndex((l) => {
      const likeUserId = l?.user ? l.user.toString() : l?.toString();
      return likeUserId === req.user.id;
    });

    if (existingIndex >= 0) {
      // Unlike
      post.likes.splice(existingIndex, 1);
    } else {
      // Like — saves both the user ID and username of the person who liked
      post.likes.push({
        user: req.user.id,
        username: req.user.username,
      });
    }

    await post.save();
    res.json({ post: serialize(post, req.user.id) });
  } catch (error) {
    next(error);
  }
});

// ── POST /api/posts/:id/comments ─────────────────────────────────
/**
 * Add a comment to a post.
 * Requirement: "Save the usernames of people who liked or commented."
 */
router.post("/:id/comments", requireAuth, async (req, res, next) => {
  try {
    const text = req.body.text?.trim();
    if (!text) {
      return res.status(400).json({ message: "Comment cannot be empty." });
    }

    if (text.length > 500) {
      return res.status(400).json({ message: "Comment cannot exceed 500 characters." });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });

    post.comments.push({
      user: req.user.id,
      username: req.user.username,
      text,
    });

    await post.save();
    res.status(201).json({ post: serialize(post, req.user.id) });
  } catch (error) {
    next(error);
  }
});

// ── DELETE /api/posts/:id ───────────────────────────────────────
/** Delete a post owned by the authenticated user, including its local upload files. */
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found." });
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own posts." });
    }

    const imageUrls = post.imageUrls?.length ? post.imageUrls : [post.imageUrl].filter(Boolean);
    await post.deleteOne();
    await removeUploadedFiles(imageUrls);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
