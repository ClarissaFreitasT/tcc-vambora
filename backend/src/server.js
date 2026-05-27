import express from "express";
import {
  obterTodasRoteiros,
  obterRoteiroPorId,
  criarNovoRoteiro,
  atualizarRoteiro,
  excluirRoteiro
} from "./models/roteiro.model.js";

// Cria a aplicação Express
const app = express();

// Define a porta em que o servidor vai rodar
const PORT = 3000;

// ========================================
// CONFIGURAÇÃO INICIAL
// ========================================

// Permite que o servidor entenda JSON enviado no corpo da requisição
app.use(express.json());

// ========================================
// ROTAS DA API
// ========================================

/**
 * GET /
 * Rota inicial apenas para testar se a API está funcionando
 */
app.get("/", (req, res) => {
  res.send("API de roteiros funcionando!");
});

/**
 * GET /roteiros
 * Retorna todos os roteiros em formato JSON
 */
app.get("/roteiros", async (req, res) => {
  const roteiros = await obterTodasRoteiros();
  res.json(roteiros);
});

/**
 * GET /roteiros/:id
 * Retorna um roteiro específico com base no id enviado na URL
 */
app.get("/roteiros/:id", async (req, res) => {
  const id = req.params.id;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  const roteiro = await obterRoteiroPorId(id);

  if (!roteiro) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  res.json(roteiro);
});

/**
 * POST /roteiros
 * Cria um novo roteiro
 */
app.post("/roteiros", async (req, res) => {
  const { nome, data, genero, lugares } = req.body;

  if (typeof nome !== "string" || nome.trim() === "") {
    return res.status(400).json({ erro: "Nome é obrigatório" });
  }

  if (typeof data !== "string" || data.trim() === "") {
    return res.status(400).json({ erro: "Data é obrigatória" });
  }

  if (typeof genero !== "string" || genero.trim() === "") {
    return res.status(400).json({ erro: "Gênero é obrigatório" });
  }

  const roteiroCriado = await criarNovoRoteiro(nome, data, genero, lugares);

  res.status(201).json({
    mensagem: "Roteiro criado com sucesso!",
    roteiro: roteiroCriado
  });
});

/**
 * PATCH /roteiros/:id
 * Atualiza parcialmente um roteiro existente
 */
app.patch("/roteiros/:id", async (req, res) => {
  const id = req.params.id;
  const { nome, data, genero, lugares } = req.body;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  if (
    nome !== undefined &&
    (typeof nome !== "string" || nome.trim() === "")
  ) {
    return res.status(400).json({ erro: "Nome inválido" });
  }

  if (data !== undefined && (typeof data !== "string" || data.trim() === "")) {
    return res.status(400).json({ erro: "Data inválida" });
  }

  if (genero !== undefined && (typeof genero !== "string" || genero.trim() === "")) {
    return res.status(400).json({ erro: "Gênero inválido" });
  }

  const roteiroAtualizado = await atualizarRoteiro(
    id,
    nome,
    data,
    genero,
    lugares
  );

  if (!roteiroAtualizado) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  res.json({
    mensagem: "Roteiro atualizado com sucesso!",
    roteiro: roteiroAtualizado
  });
});

/**
 * DELETE /roteiros/:id
 * Remove um roteiro pelo id
 */
app.delete("/roteiros/:id", async (req, res) => {
  const id = req.params.id;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  const roteiroRemovido = await excluirRoteiro(id);

  if (!roteiroRemovido) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  res.json({
    mensagem: "Roteiro excluído com sucesso!",
    roteiro: roteiroRemovido
  });
});

// ========================================
// INICIALIZAÇÃO DO SERVIDOR
// ========================================

// Faz o servidor começar a escutar a porta definida
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
