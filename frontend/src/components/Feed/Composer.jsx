/**
 * @file Composer.jsx
 * @description TaskPlanet-inspired post creation composer.
 *
 * Requirements Met:
 *  - "A user can post text, image, or both. Both fields should not be mandatory (either one is enough)."
 *  - Dynamic auto-expanding textarea
 *  - Multi-file image picker with append-only selection and per-image removal
 *  - Character count validation (up to 2000 chars)
 *
 * @param {object}   props
 * @param {object}   props.user       - Current user session object
 * @param {Function} props.onCreated  - Callback with new Post on success
 * @param {Function} [props.onToast]  - Optional toast trigger
 */

import React, { useEffect, useRef, useState } from "react";
import { api } from "../../api.js";
import Avatar from "../shared/Avatar.jsx";
import styles from "./Feed.module.css";

const MAX_CHARS = 2000;

const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const MAX_IMAGES = 12;

const fileKey = (file) => `${file.name}:${file.size}:${file.lastModified}:${file.type}`;

const QUICK_EMOJIS = ["🔥", "❤️", "👏", "🎉", "🚀", "💡", "💯", "✨"];

export default function Composer({ user, onCreated, onToast }) {
  const [text, setText] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const selectedImagesRef = useRef([]);

  // Keep URLs alive while selected, then release them on removal or unmount.
  useEffect(() => {
    selectedImagesRef.current = selectedImages;
  }, [selectedImages]);

  useEffect(() => () => {
    selectedImagesRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
  }, []);

  /** Auto-grow textarea up to 320px */
  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    autoGrow();
  };

  /** Process files from file input or drag-and-drop */
  const processFiles = (files) => {
    const unsupportedFiles = files.filter((file) => !ACCEPTED_IMAGE_TYPES.has(file.type));
    const existingKeys = new Set(selectedImagesRef.current.map(({ key }) => key));
    const availableSlots = MAX_IMAGES - selectedImagesRef.current.length;
    const additions = files
      .filter((file) => ACCEPTED_IMAGE_TYPES.has(file.type))
      .filter((file) => !existingKeys.has(fileKey(file)))
      .slice(0, Math.max(availableSlots, 0))
      .map((file) => ({ file, key: fileKey(file), previewUrl: URL.createObjectURL(file) }));

    if (additions.length) {
      setSelectedImages((current) => [...current, ...additions]);
      setError("");
    }
    if (unsupportedFiles.length) {
      setError("Please choose JPG, PNG, WEBP, or GIF images only.");
    } else if (files.length && !additions.length && availableSlots <= 0) {
      setError(`You can attach up to ${MAX_IMAGES} images to one post.`);
    }
  };

  const handleImageSelection = (event) => {
    const files = Array.from(event.target.files || []);
    processFiles(files);
    event.target.value = "";
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  /** Insert emoji at cursor position or append to text */
  const handleInsertEmoji = (emoji) => {
    const el = textareaRef.current;
    if (!el) {
      setText((prev) => prev + emoji);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const newText = text.slice(0, start) + emoji + text.slice(end);
    setText(newText);
    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + emoji.length;
      autoGrow();
    }, 0);
  };

  const removeSelectedImage = (key) => {
    setSelectedImages((current) => {
      const image = current.find((item) => item.key === key);
      if (image) URL.revokeObjectURL(image.previewUrl);
      return current.filter((item) => item.key !== key);
    });
  };

  const clearSelectedImages = () => {
    selectedImagesRef.current.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
    selectedImagesRef.current = [];
    setSelectedImages([]);
  };

  /**
   * Submit post.
   * Requirement: User can post text, image, or both. Neither is individually mandatory.
   */
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    const trimmedText = text.trim();
    if (!trimmedText && !selectedImages.length) {
      setError("Please add some text or choose an image before posting.");
      return;
    }

    setSending(true);

    try {
      const payload = new FormData();
      payload.append("text", trimmedText);
      selectedImages.forEach(({ file }) => payload.append("images", file));

      const { post } = await api("/posts", {
        method: "POST",
        body: payload,
      });

      // Notify parent to prepend
      onCreated(post);

      // Reset composer
      setText("");
      clearSelectedImages();
      if (textareaRef.current) textareaRef.current.style.height = "auto";

      if (onToast) {
        onToast("Your post has been published!", "success");
      }
    } catch (err) {
      setError(err.message || "Failed to publish post.");
    } finally {
      setSending(false);
    }
  };

  // Submit button is enabled when there is text or at least one selected image.
  const hasContent = text.trim().length > 0 || selectedImages.length > 0;

  /** Ctrl + Enter or Cmd + Enter shortcut */
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!sending && hasContent) {
        handleSubmit();
      }
    }
  };

  // Char count status classes
  let charCountClass = styles.charCount;
  if (text.length > 1950) {
    charCountClass = `${styles.charCount} ${styles.charCountDanger}`;
  } else if (text.length > 1800) {
    charCountClass = `${styles.charCount} ${styles.charCountWarn}`;
  }

  return (
    <section
      className={`${styles.composer} ${isDragging ? styles.composerDragOver : ""}`}
      aria-label="Create a post"
      id="composer-card"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <form onSubmit={handleSubmit}>
        {/* Header with user avatar */}
        <div className={styles.composerHeader}>
          <Avatar name={user?.username || "You"} size="md" />
          <span className={styles.composerPrompt}>
            What's happening in your world, {user?.username || "there"}?
          </span>
        </div>

        {/* Post Textarea with shortcut listener */}
        <textarea
          ref={textareaRef}
          className={styles.composerTextarea}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Share an update, moment, or question with the TaskPlanet community... (Drag images here or use #hashtags)"
          maxLength={MAX_CHARS}
          aria-label="Post text"
          rows={3}
        />

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className={styles.visuallyHidden}
          onChange={handleImageSelection}
          aria-label="Choose images to attach"
        />

        {selectedImages.length > 0 && (
          <div className={styles.selectedImageSection} aria-live="polite">
            <p className={styles.selectedImageLabel}>
              {selectedImages.length} {selectedImages.length === 1 ? "image" : "images"} selected
            </p>
            <div className={styles.selectedImageGrid}>
              {selectedImages.map((image, index) => (
                <div className={styles.selectedImagePreview} key={image.key}>
                  <img src={image.previewUrl} alt={`Selected image ${index + 1}: ${image.file.name}`} className={styles.previewImage} />
                  <button
                    type="button"
                    className={styles.removeImageBtn}
                    onClick={() => removeSelectedImage(image.key)}
                    title={`Remove ${image.file.name}`}
                    aria-label={`Remove ${image.file.name}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && <p className={styles.errorMsg} role="alert" style={{ color: "var(--color-error)", fontSize: 13, marginTop: 8 }}>{error}</p>}

        {/* Footer controls */}
        <div className={styles.composerFooter}>
          <button
            type="button"
            className={styles.imageToggleBtn}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Add images from your computer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span>Add image</span>
          </button>

          {/* Quick Emoji Bar */}
          <div className={styles.emojiBar} aria-label="Quick emojis">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={styles.emojiBtn}
                onClick={() => handleInsertEmoji(emoji)}
                title={`Insert ${emoji}`}
                aria-label={`Insert ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Counter group with keyboard shortcut hint */}
          <div className={styles.counterGroup}>
            <span className={styles.shortcutHint}>Ctrl + Enter ↵</span>
            <span className={charCountClass}>
              {text.length} / {MAX_CHARS}
            </span>
          </div>

          {/* Post submit button */}
          <button
            type="submit"
            className={styles.postBtn}
            disabled={sending || !hasContent}
            aria-label={sending ? "Publishing post…" : "Publish post"}
          >
            {sending ? "Posting…" : "Post"}
          </button>
        </div>
      </form>
    </section>
  );
}
