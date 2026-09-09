/**
 * @file Post.js
 * @description Mongoose schema for social posts, embedded likes, and embedded comments.
 *
 * Strict Architecture Constraint:
 *  - Only TWO MongoDB collections are used in the entire app: `users` and `posts`.
 *  - Likes and comments are embedded sub-documents inside each post document.
 *  - Usernames of people who liked or commented are denormalized and saved directly,
 *    satisfying the requirement: "Save the usernames of people who liked or commented."
 */

import mongoose from "mongoose";

// ── Like sub-document schema ──────────────────────────────────────
/**
 * @typedef {object} LikeDoc
 * @property {mongoose.Types.ObjectId} user      - Reference to the User who liked.
 * @property {string}                  username  - Username of the user who liked.
 * @property {Date}                    createdAt - Timestamp when liked.
 */
const likeSchema = new mongoose.Schema(
  {
    /** Reference to the User who liked this post */
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    /** Denormalized username to save who liked without extra database queries */
    username: { type: String, required: true },
  },
  { timestamps: true }
);

// ── Comment sub-document schema ───────────────────────────────────
/**
 * @typedef {object} CommentDoc
 * @property {mongoose.Types.ObjectId} user      - Reference to the author User.
 * @property {string}                  username  - Denormalized username for display.
 * @property {string}                  text      - Comment body (max 500 chars).
 * @property {Date}                    createdAt - Auto-set by timestamps option.
 * @property {Date}                    updatedAt - Auto-set by timestamps option.
 */
const commentSchema = new mongoose.Schema(
  {
    /** Reference to the User who wrote this comment */
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    /** Denormalised for read performance — avoids a join on every feed fetch */
    username: { type: String, required: true },

    /** The comment text, trimmed and capped at 500 characters */
    text: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

// ── Post schema ───────────────────────────────────────────────────
/**
 * @typedef {object} PostDoc
 * @property {mongoose.Types.ObjectId} author    - Reference to the author User.
 * @property {string}                  username  - Denormalized username for display.
 * @property {string}                  text      - Post body (optional, max 2000 chars).
 * @property {string}                  imageUrl  - Optional first image URL for legacy clients.
 * @property {string[]}                imageUrls - Uploaded image URLs.
 * @property {LikeDoc[]}               likes     - Embedded array of likes with user & username.
 * @property {CommentDoc[]}            comments  - Embedded comment sub-documents.
 * @property {Date}                    createdAt - Auto-set by timestamps option.
 * @property {Date}                    updatedAt - Auto-set by timestamps option.
 */
const postSchema = new mongoose.Schema(
  {
    /** Reference to the User who created this post */
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    /** Denormalised author username */
    username: { type: String, required: true },

    /** Post body text — optional if an imageUrl is provided */
    text: { type: String, trim: true, maxlength: 2000, default: "" },

    /** Optional image URL — validated at the route layer */
    imageUrl: { type: String, trim: true, default: "" },

    /** Uploaded image URLs. Kept in the post document to preserve the two-collection design. */
    imageUrls: [{ type: String, trim: true }],

    /**
     * Embedded array of likes. Each entry saves both the user ObjectId and their username.
     * This directly satisfies the requirement: "Save the usernames of people who liked or commented".
     */
    likes: [likeSchema],

    /** Embedded comments */
    comments: [commentSchema],
  },
  { timestamps: true }
);

// Index for fast feed ordering
postSchema.index({ createdAt: -1 });
// Index for author lookups (e.g. My Posts tab)
postSchema.index({ author: 1, createdAt: -1 });

export default mongoose.model("Post", postSchema);
