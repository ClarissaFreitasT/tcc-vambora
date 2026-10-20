import "dotenv/config";
import { readFileSync } from "node:fs";

export function databaseConfig(env = process.env) {
  let url;
  try {
    url = new URL(env.DATABASE_URL);
  } catch {
    throw new Error("Configure DATABASE_URL com uma URL MySQL válida.");
  }
  if (url.protocol !== "mysql:" || !url.hostname || !url.username || url.pathname.length < 2) {
    throw new Error("DATABASE_URL deve informar host, usuário e banco MySQL.");
  }
  // Mesmos parâmetros TLS utilizados pelo Prisma CLI em DATABASE_URL.
  const allowed = new Set(["sslaccept", "sslcert"]);
  for (const key of url.searchParams.keys()) {
    if (!allowed.has(key)) throw new Error(`Parâmetro DATABASE_URL não suportado: ${key}`);
  }
  const sslaccept = url.searchParams.get("sslaccept");
  const cert = url.searchParams.get("sslcert");
  if (sslaccept && sslaccept !== "strict") {
    throw new Error("Use sslaccept=strict para verificar o certificado do MySQL.");
  }
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.slice(1)),
    connectionLimit: 5,
    connectTimeout: 10000,
    acquireTimeout: 10000,
    ...(sslaccept || cert ? {
      ssl: { rejectUnauthorized: true, ...(cert ? { ca: readFileSync(cert, "utf8") } : {}) },
    } : {}),
  };
}
