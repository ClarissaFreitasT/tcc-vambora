import * as RoteiroModel from '../models/roteiro.model.js'

export async function listarRoteiros(req, res) {
  const roteiros = await RoteiroModel.obterTodosRoteiros();
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

  res.json(roteiro);
}

export async function criarRoteiro(req, res) {
  const {
    usuarioId,
    titulo,
    destino,
    descricao,
    orcamento,
    publico
  } = req.body;

  if (typeof usuarioId !== "string" || usuarioId.trim() === "") {
    return res.status(400).json({ erro: "UsuarioId é obrigatório" });
  }

  if (typeof titulo !== "string" || titulo.trim() === "") {
    return res.status(400).json({ erro: "Título é obrigatório" });
  }

  if (typeof destino !== "string" || destino.trim() === "") {
    return res.status(400).json({ erro: "Destino é obrigatório" });
  }

  const roteiroCriado = await RoteiroModel.criarNovoRoteiro({
    usuarioId,
    titulo,
    destino,
    descricao,
    orcamento,
    publico
  });

  res.status(201).json({
    mensagem: "Roteiro criado com sucesso!",
    roteiro: roteiroCriado
  });
}

export async function atualizarRoteiro(req, res) {
  const id = req.params.id;
  const {
    titulo,
    destino,
    descricao,
    orcamento,
    publico
  } = req.body;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  if (titulo !== undefined && (typeof titulo !== "string" || titulo.trim() === "")) {
    return res.status(400).json({ erro: "Título inválido" });
  }

  if (destino !== undefined && (typeof destino !== "string" || destino.trim() === "")) {
    return res.status(400).json({ erro: "Destino inválido" });
  }

  const roteiroAtualizado = await RoteiroModel.atualizarRoteiro(id, {
    titulo,
    destino,
    descricao,
    orcamento,
    publico
  });

  if (!roteiroAtualizado) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  res.json({
    mensagem: "Roteiro atualizado com sucesso!",
    roteiro: roteiroAtualizado
  });
}

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
