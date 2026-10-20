import "dotenv/config";

const configuredOrigin = process.env.FRONTEND_URL;
if (process.env.NODE_ENV === "production" && !configuredOrigin) {
  throw new Error("FRONTEND_URL é obrigatória em produção.");
}
const origin = new URL(configuredOrigin || "http://localhost:5173");
if (origin.pathname !== "/" || origin.search || origin.hash || origin.username || origin.password ||
    !["http:", "https:"].includes(origin.protocol) ||
    (process.env.NODE_ENV === "production" && origin.protocol !== "https:")) {
  throw new Error("FRONTEND_URL deve conter apenas a origem (protocolo e domínio), sem a subpasta.");
}

export const corsOptions = {
  origin(requestOrigin, callback) {
    callback(null, !requestOrigin || requestOrigin === origin.origin);
  },
};
