import * as RoteiroModel from '../models/roteiro.model.js'

export async function listarRoteiros(req, res) {
  const roteiros = await RoteiroModel.obterTodosRoteiros();
  res.json(roteiros);
}

/**
 * Retorna um roteiro específico com base no id enviado na URL
 * @route GET /filmes/:id
 */
export async function obterRoteiro(req, res) {
  const id = req.params.id;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  const roteiro = await RoteiroModel.obterRoteiroPorId(id);

  if (!roteiro) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  res.json(roteiro);
}

/**
 * Cria um novo roteiro
 * @route POST /filmes
 */
export async function criarRoteiro(req, res) {
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

  const roteiroCriado = await RoteiroModel.criarNovoRoteiro(nome, data, genero, lugares);

  res.status(201).json({
    mensagem: "Roteiro criado com sucesso!",
    roteiro: roteiroCriado
  });
}

/**
 * Atualiza parcialmente um roteiro existente
 * @route PATCH /filmes/:id
 */
export async function atualizarRoteiro(req, res) {
  const id = req.params.id;
  const { nome, lugares, data } = req.body;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  if (
    nome !== undefined &&
    (typeof nome !== "string" || nome.trim() === "")
  ) {
    return res.status(400).json({ erro: "Nome inválido" });
  }

  if (
    data !== undefined &&
    (typeof data !== "string" || data.trim() === "")
  ) {
    return res.status(400).json({ erro: "Data inválida" });
  }

  if (
    lugares !== undefined &&
    (typeof lugares !== "string" || lugares.trim() === "")
  ) {
    return res.status(400).json({ erro: "Lugares inválidos" });
  }

  const roteiroAtualizado = await RoteiroModel.atualizarRoteiro(
    id,
    nome,
    data,
    lugares
  );

  if (!roteiroAtualizado) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  res.json({
    mensagem: "Roteiro atualizado com sucesso!",
    roteiro: roteiroAtualizado
  });
}

/**
 * Remove um roteiro pelo id
 * @route DELETE /filmes/:id
 */
export async function excluirRoteiro(req, res) {
  const id = req.params.id;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  const roteiroRemovido = await RoteiroModel.excluirRoteiro(id);

  if (!roteiroRemovido) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  res.json({
    mensagem: "Roteiro excluído com sucesso!",
    roteiro: roteiroRemovido
  });
}
