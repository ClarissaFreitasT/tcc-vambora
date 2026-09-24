import * as RoteiroModel from "../models/roteiro.model.js";

export async function listarRoteiros(req, res) {
  const roteiros = await RoteiroModel.obterTodasRoteiros(req.user?.id);
  res.json(roteiros);
}

export async function obterRoteiro(req, res) {
  const id = req.params.id;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  const roteiro = await RoteiroModel.obterRoteiroPorId(id);

  if (!roteiro) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  if (!roteiro.publico && roteiro.usuarioId !== req.user?.id) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  res.json(roteiro);
}

export async function criarRoteiro(req, res) {
  const { titulo, destino, descricao, orcamento, publico } = req.body;

  if (typeof titulo !== "string" || titulo.trim() === "") {
    return res.status(400).json({ erro: "Título é obrigatório" });
  }

  if (typeof destino !== "string" || destino.trim() === "") {
    return res.status(400).json({ erro: "Destino é obrigatório" });
  }

  try {
    const roteiroCriado = await RoteiroModel.criarNovoRoteiro({
      usuarioId: req.user.id,
      titulo,
      destino,
      descricao,
      orcamento,
      publico,
    });

    return res.status(201).json({
      mensagem: "Roteiro criado com sucesso!",
      roteiro: roteiroCriado,
    });
  } catch (error) {
    console.error("Erro ao criar roteiro:", error);

    return res.status(500).json({
      erro: "Não foi possível salvar o roteiro.",
      detalhe: error.message,
    });
  }
}

export async function atualizarRoteiro(req, res) {
  const id = req.params.id;
  const { titulo, destino, descricao, orcamento, publico } = req.body;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  if (
    titulo !== undefined &&
    (typeof titulo !== "string" || titulo.trim() === "")
  ) {
    return res.status(400).json({ erro: "Título inválido" });
  }

  if (
    destino !== undefined &&
    (typeof destino !== "string" || destino.trim() === "")
  ) {
    return res.status(400).json({ erro: "Destino inválido" });
  }

  const roteiroAtual = await RoteiroModel.obterRoteiroPorId(id);

  if (!roteiroAtual) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  if (roteiroAtual.usuarioId !== req.user.id) {
    return res.status(403).json({
      erro: "Você não tem permissão para atualizar este roteiro",
    });
  }

  const roteiroAtualizado = await RoteiroModel.atualizarRoteiro(id, {
    titulo,
    destino,
    descricao,
    orcamento,
    publico,
  });

  if (!roteiroAtualizado) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  res.json({
    mensagem: "Roteiro atualizado com sucesso!",
    roteiro: roteiroAtualizado,
  });
}

export async function excluirRoteiro(req, res) {
  const id = req.params.id;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  const roteiroAtual = await RoteiroModel.obterRoteiroPorId(id);

  if (!roteiroAtual) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  if (roteiroAtual.usuarioId !== req.user.id) {
    return res.status(403).json({
      erro: "Você não tem permissão para excluir este roteiro",
    });
  }

  const roteiroRemovido = await Rotei;
}
