import express from "express";

import roteiroRoutes from "./routes/roteiro.routes.js";
import diaRoutes from "./routes/dia.routes.js";
import itemRoutes from "./routes/item.routes.js";
import usuarioRoutes from "./routes/users.routes.js";

const app = express();

// Middleware para JSON
app.use(express.json());

// Rota de teste
app.get("/", (req, res) => {
  res.send("API de roteiros funcionando!");
});

// Rotas da aplicação
app.use("/roteiros", roteiroRoutes);
app.use("/dias", diaRoutes);
app.use("/itens", itemRoutes);
app.use("/usuarios", usuarioRoutes);

export default app;