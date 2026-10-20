import cors from "cors";
import express from "express";
import path from "node:path";

import roteiroRoutes from "./routes/roteiro.routes.js";
import diaRoutes from "./routes/dia.routes.js";
import itemRoutes from "./routes/item.routes.js";
import usuarioRoutes from "./routes/users.routes.js";
import authRoutes from "./routes/auth.routes.js";
import publicacaoRoutes from "./routes/publicacao.routes.js";
import categoriaRoutes from "./routes/categoria.routes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

// Middleware para JSON
app.use(express.json());
app.use(
  "/uploads/community",
  express.static(path.resolve(process.cwd(), "uploads", "community"), {
    dotfiles: "deny",
    index: false,
    maxAge: "7d",
  }),
);

// Rota de teste
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

app.use((error, _req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status || (error.name === "MulterError" ? 400 : 500);
  return res.status(status).json({
    erro: error.message || "Não foi possível processar a solicitação.",
  });
});

export default app;
