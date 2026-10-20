import "dotenv/config";
import app from "./app.js";
import { prisma } from "./config/prisma.js";

const PORT = Number(process.env.PORT || 3000);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT inválida.");
}
if (!process.env.JWT_SECRET || (
  process.env.NODE_ENV === "production" &&
  (process.env.JWT_SECRET.length < 32 || process.env.JWT_SECRET.includes("substitua"))
)) {
  throw new Error("Configure JWT_SECRET; em produção use uma chave aleatória com pelo menos 32 caracteres.");
}
if (process.env.NODE_ENV === "production" && !process.env.UPLOAD_DIR) {
  throw new Error("Configure UPLOAD_DIR no disco persistente do Render.");
}

let server;
try {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
  server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`API escutando na porta ${PORT}`);
  });
  server.on("error", () => {
    console.error("Não foi possível abrir a porta da API.");
    process.exit(1);
  });
} catch {
  console.error("Não foi possível conectar ao MySQL. Verifique DATABASE_URL, TLS e acesso de rede.");
  await prisma.$disconnect();
  process.exit(1);
}

let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  const timeout = setTimeout(() => process.exit(1), 10000);
  timeout.unref();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
