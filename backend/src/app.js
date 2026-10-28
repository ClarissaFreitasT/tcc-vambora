import cors from "cors";
import express from "express";
import { corsOptions } from "./config/cors.js";

import roteiroRoutes from "./routes/roteiro.routes.js";
import diaRoutes from "./routes/dia.routes.js";
import itemRoutes from "./routes/item.routes.js";
import usuarioRoutes from "./routes/users.routes.js";
import authRoutes from "./routes/auth.routes.js";
import publicacaoRoutes from "./routes/publicacao.routes.js";
import categoriaRoutes from "./routes/categoria.routes.js";
import planejamentoIaRoutes from "./routes/planejamento-ia.routes.js";

const app = express();

app.use(cors(corsOptions));

// Middleware para JSON
app.use(express.json());
// Rota de teste
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (req, res) => {
  res.send("API de roteiros funcionando!");
});

// Rotas da aplicação
app.use("/roteiros", roteiroRoutes);
app.use("/dias", diaRoutes);
app.use("/itens", itemRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/publicacoes", publicacaoRoutes);
app.use("/categorias", categoriaRoutes);
app.use("/auth", authRoutes);
app.use("/planejamentos-ia", planejamentoIaRoutes);

app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status || 500;
  return res.status(status).json({
    erro: status >= 500 && process.env.NODE_ENV === "production"
      ? "Não foi possível processar a solicitação."
      : error.message || "Não foi possível processar a solicitação.",
  });
});

export default app;
