import multer from "multer";

const MAX_FILE_SIZE = 8 * 1024 * 1024;
const MAX_PUBLICATION_FILES = 8;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function detectImageType(buffer) {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])))
    return "image/jpeg";
  if (
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return "image/png";
  if (
    buffer.subarray(0, 4).toString() === "RIFF" &&
    buffer.subarray(8, 12).toString() === "WEBP"
  )
    return "image/webp";
  return null;
}

function validateFile(file) {
  const detectedType = detectImageType(file.buffer);
  if (!allowedMimeTypes.has(file.mimetype) || detectedType !== file.mimetype) {
    const error = new Error("Use uma imagem JPG, PNG ou WebP válida.");
    error.status = 400;
    throw error;
  }
  return { ...file, detectedType };
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: MAX_PUBLICATION_FILES },
});

function handleUpload(handler) {
  return (req, res, next) =>
    handler(req, res, (error) => {
      if (error) {
        if (error.code === "LIMIT_FILE_SIZE") {
          error.status = 400;
          error.message = "Cada imagem pode ter no máximo 8 MB.";
        } else if (
          error.code === "LIMIT_FILE_COUNT" ||
          error.code === "LIMIT_UNEXPECTED_FILE"
        ) {
          error.status = 400;
          error.message = "A publicação pode ter no máximo 8 fotos.";
        }
        return next(error);
      }
      try {
        if (req.file) req.file = validateFile(req.file);
        req.files = (req.files || []).map(validateFile);
        next();
      } catch (validationError) {
        next(validationError);
      }
    });
}

export const uploadPublicationImages = handleUpload(
  upload.array("fotos", MAX_PUBLICATION_FILES),
);
export const uploadProfileImage = handleUpload(upload.single("foto"));
export const uploadRouteCoverImage = handleUpload(upload.single("imagem"));
export { MAX_FILE_SIZE, MAX_PUBLICATION_FILES, detectImageType, validateFile };
