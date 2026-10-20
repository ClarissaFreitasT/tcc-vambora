import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

// UPLOAD_DIR é a raiz do volume; os arquivos ficam no subdiretório community.
export const uploadDirectory = path.join(
  process.env.UPLOAD_DIR || fileURLToPath(new URL("../../uploads/", import.meta.url)),
  "community",
);
