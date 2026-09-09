import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import multer from "multer";

export const UPLOAD_DIRECTORY = path.resolve(process.cwd(), "uploads");
fs.mkdirSync(UPLOAD_DIRECTORY, { recursive: true });

const extensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, UPLOAD_DIRECTORY),
  filename: (_req, file, callback) => callback(null, `${randomUUID()}${extensions[file.mimetype]}`),
});

export const uploadImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 12 },
  fileFilter: (_req, file, callback) => {
    if (extensions[file.mimetype]) return callback(null, true);
    const error = new Error("Only JPG, PNG, WEBP, and GIF image files are allowed.");
    error.status = 400;
    return callback(error);
  },
});
