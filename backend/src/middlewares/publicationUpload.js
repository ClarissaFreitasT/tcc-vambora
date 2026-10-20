import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { unlink } from "node:fs/promises";
import { uploadDirectory } from "../config/uploads.js";
import multer from "multer";

mkdirSync(uploadDirectory, { recursive: true });

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, _file, callback) => callback(null, randomUUID()),
});

const uploadFiles = multer({
  storage,
  limits: { files: 8, fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      const error = new Error("Use imagens JPG, PNG, WebP ou GIF.");
      error.status = 400;
      callback(error);
      return;
    }
    callback(null, true);
  },
}).array("fotos", 8);

export function uploadPublicationPhotos(req, res, next) {
  uploadFiles(req, res, (error) => {
    if (!error) return next();
    Promise.all(
      (req.files || []).map((file) => unlink(file.path).catch(() => {})),
    ).finally(() => next(error));
  });
}
