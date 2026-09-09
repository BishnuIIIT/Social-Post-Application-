/**
 * @file User.js
 * @description Mongoose schema for user accounts.
 *
 * Stores credentials only — no sensitive profile information is included here.
 * Passwords are stored as bcrypt hashes (hashing happens at the route layer
 * before `User.create()` is called).
 *
 * Unique indexes are applied to both `email` and `username` to enforce
 * data integrity at the database level in addition to application-layer checks.
 */

import mongoose from "mongoose";

/**
 * @typedef {object} UserDoc
 * @property {string} username  - Display name (2–30 chars, unique).
 * @property {string} email     - Lowercased email address (unique).
 * @property {string} password  - bcrypt hash of the user's password.
 * @property {Date}   createdAt - Auto-set by timestamps option.
 * @property {Date}   updatedAt - Auto-set by timestamps option.
 */
const userSchema = new mongoose.Schema(
  {
    /** Unique display name shown across the app */
    username: {
      type:      String,
      required:  true,
      trim:      true,
      unique:    true,
      minlength: 2,
      maxlength: 30,
    },

    /**
     * Email stored as lowercase to make lookups case-insensitive.
     * The `lowercase: true` option transforms the value before saving.
     */
    email: {
      type:      String,
      required:  true,
      trim:      true,
      lowercase: true,
      unique:    true,
    },

    /** bcrypt hash — never the raw password */
    password: {
      type:     String,
      required: true,
    },

    /** Temporary 6-digit reset code for Forgot/Reset Password (15-min expiry) */
    resetCode: {
      type:    String,
      default: null,
    },

    /** Expiration date for the reset code */
    resetCodeExpires: {
      type:    Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
