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
app.get("/roteiros", (req, res) => {
  res.json(obterTodasRoteiros());
});

/**
 * GET /roteiros/:id
 * Retorna um roteiro específico com base no id enviado na URL
 */
app.get("/roteiros/:id", (req, res) => {
  // Converte o id recebido pela URL para número
  const idNumero = Number(req.params.id);

  // Valida se o id é realmente um número
  if (Number.isNaN(idNumero)) {
    return res.status(400).json({ erro: "ID inválido" });
  }

  // Busca o roteiro pelo id
  const roteiro = obterRoteiroPorId(idNumero);

  // Se não encontrar, retorna erro 404
  if (!roteiro) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  // Se encontrar, retorna o roteiro
  res.json(roteiro);
});

/**
 * POST /roteiros
 * Cria um novo roteiro
 */
app.post("/roteiros", (req, res) => {
  // Pega o nome, data e gênero enviados no corpo da requisição
  const { nome, data, genero } = req.body;

  // Valida se o nome foi enviado corretamente
  if (typeof nome !== "string" || nome.trim() === "") {
    return res.status(400).json({ erro: "Nome é obrigatório" });
  }

  // Valida se a data foi enviada corretamente
  if (typeof data !== "string" || data.trim() === "") {
    return res.status(400).json({ erro: "Data é obrigatória" });
  }

  // Valida se o gênero foi enviado corretamente
  if (typeof genero !== "string" || genero.trim() === "") {
    return res.status(400).json({ erro: "Gênero é obrigatório" });
  }

  // Cria o novo roteiro
  const roteiroCriado = criarNovoRoteiro(nome, data, genero);

  // Retorna status 201 (criado com sucesso)
  res.status(201).json({
    mensagem: "Roteiro criado com sucesso!",
    roteiro: roteiroCriado
  });
});

/**
 * PATCH /roteiros/:id
 * Atualiza parcialmente um roteiro existente
 */
app.patch("/roteiros/:id", (req, res) => {
  // Converte o id da URL para número
  const idNumero = Number(req.params.id);

  // Pega os dados enviados no corpo da requisição
  const { nome, data, genero } = req.body;

  // Valida o id
  if (Number.isNaN(idNumero)) {
    return res.status(400).json({ erro: "ID inválido" });
  }

  // Valida o nome, se ele foi enviado
  if (
    nome !== undefined &&
    (typeof nome !== "string" || nome.trim() === "")
  ) {
    return res.status(400).json({ erro: "Nome inválido" });
  }

  // Valida a data, se ela foi enviada
  if (data !== undefined && (typeof data !== "string" || data.trim() === "")) {
    return res.status(400).json({ erro: "Data inválida" });
  }

  // Valida o gênero, se ele foi enviado
  if (genero !== undefined && (typeof genero !== "string" || genero.trim() === "")) {
    return res.status(400).json({ erro: "Gênero inválido" });
  }

  // Tenta atualizar o roteiro
  const roteiroAtualizado = atualizarRoteiro(idNumero, nome, data, genero);

  // Se não encontrar o roteiro, retorna erro 404
  if (!roteiroAtualizado) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  // Se atualizar com sucesso, retorna o roteiro atualizado
  res.json({
    mensagem: "Roteiro atualizado com sucesso!",
    roteiro: roteiroAtualizado
  });
});

/**
 * DELETE /roteiros/:id
 * Remove um roteiro pelo id
 */
app.delete("/roteiros/:id", (req, res) => {
  // Converte o id da URL para número
  const idNumero = Number(req.params.id);

  // Valida o id
  if (Number.isNaN(idNumero)) {
    return res.status(400).json({ erro: "ID inválido" });
  }

  // Tenta excluir o roteiro
  const roteiroRemovido = excluirRoteiro(idNumero);

  // Se não encontrar, retorna erro 404
  if (!roteiroRemovido) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  // Retorna o roteiro que foi removido
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
