import * as RoteiroModel from "../models/roteiro.model.js";

export async function listarRoteiros(req, res) {
  const roteiros = await RoteiroModel.obterTodasRoteiros(req.user?.id);
  res.json(roteiros);
}

export async function listarRoteirosPublicos(req, res) {
  try {
    const roteiros = await RoteiroModel.obterRoteirosPublicos();
    res.json(roteiros);
  } catch (error) {
    console.error("Erro ao listar roteiros públicos:", error);

    res.status(500).json({
      erro: "Não foi possível listar os roteiros públicos.",
    });
  }
}

export async function listarRoteirosPopulares(req, res) {
  try {
    const roteiros = await RoteiroModel.obterRoteirosPopulares(10);
    return res.status(200).json(roteiros);
  } catch (error) {
    console.error("Erro ao listar roteiros populares:", error);

    return res.status(500).json({
      erro: "Não foi possível listar os roteiros populares.",
    });
  }
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
  const { usuarioId, titulo, destino, descricao, orcamento, publico } =
    req.body;

  if (!usuarioId || typeof usuarioId !== "string" || usuarioId.trim() === "") {
    return res.status(400).json({ erro: "UsuarioId é obrigatório" });
  }

  if (typeof titulo !== "string" || titulo.trim() === "") {
    return res.status(400).json({ erro: "Título é obrigatório" });
  }

  if (typeof destino !== "string" || destino.trim() === "") {
    return res.status(400).json({ erro: "Destino é obrigatório" });
  }

  try {
    const roteiroCriado = await RoteiroModel.criarNovoRoteiro({
      usuarioId,
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

  const roteiroRemovido = await RoteiroModel.excluirRoteiro(id);

  res.json({
    mensagem: "Roteiro excluído com sucesso!",
    roteiro: roteiroRemovido,
  });
}

export async function duplicarRoteiro(req, res) {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  const roteiroOriginal = await RoteiroModel.obterRoteiroPorId(id);

  if (!roteiroOriginal) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  if (!roteiroOriginal.publico && roteiroOriginal.usuarioId !== req.user.id) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  const roteiroDuplicado = await RoteiroModel.duplicarRoteiro(id, req.user.id);

  if (!roteiroDuplicado) {
    return res
      .status(400)
      .json({ erro: "Não foi possível duplicar o roteiro" });
  }

  return res.status(201).json({
    mensagem: "Roteiro duplicado com sucesso",
    roteiro: roteiroDuplicado,
  });
}

export async function adicionarCurtidaRoteiro(req, res) {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  const roteiro = await RoteiroModel.obterRoteiroPorId(id);

  if (!roteiro || !roteiro.publico) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  const curtidaExistente = await RoteiroModel.obterCurtida(req.user.id, id);

  if (curtidaExistente) {
    return res.status(409).json({ erro: "Você já curtiu este roteiro" });
  }

  const curtida = await RoteiroModel.criarCurtida(req.user.id, id);
  const totalCurtidas = await RoteiroModel.contarCurtidas(id);

  return res.status(201).json({
    mensagem: "Roteiro curtido com sucesso",
    curtida,
    totalCurtidas,
  });
}

export async function removerCurtidaRoteiro(req, res) {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  const curtidaExistente = await RoteiroModel.obterCurtida(req.user.id, id);

  if (!curtidaExistente) {
    return res.status(404).json({ erro: "Curtida não encontrada" });
  }

  const curtidaRemovida = await RoteiroModel.removerCurtida(req.user.id, id);
  const totalCurtidas = await RoteiroModel.contarCurtidas(id);

  return res.status(200).json({
    mensagem: "Curtida removida com sucesso",
    curtida: curtidaRemovida,
    totalCurtidas,
  });
}

export async function listarRoteirosSalvos(req, res) {
  const roteirosSalvos = await RoteiroModel.listarRoteirosSalvos(req.user.id);

  return res.status(200).json(roteirosSalvos);
}

export async function salvarRoteiroUsuario(req, res) {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  const roteiro = await RoteiroModel.obterRoteiroPorId(id);

  if (!roteiro || !roteiro.publico) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  const salvoExistente = await RoteiroModel.obterRoteiroSalvo(req.user.id, id);

  if (salvoExistente) {
    return res.status(409).json({ erro: "Roteiro já salvo" });
  }

  const salvo = await RoteiroModel.salvarRoteiro(req.user.id, id);

  return res.status(201).json({
    mensagem: "Roteiro salvo com sucesso",
    salvo,
  });
}

export async function removerRoteiroSalvoUsuario(req, res) {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  const salvoExistente = await RoteiroModel.obterRoteiroSalvo(req.user.id, id);

  if (!salvoExistente) {
    return res.status(404).json({ erro: "Roteiro não encontrado nos salvos" });
  }

  const salvoRemovido = await RoteiroModel.removerRoteiroSalvo(req.user.id, id);

  return res.status(200).json({
    mensagem: "Roteiro removido dos salvos",
    salvo: salvoRemovido,
  });
}

export async function criarAvaliacaoRoteiro(req, res) {
  const { id } = req.params;
  const { nota, comentario } = req.body;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  if (!Number.isInteger(Number(nota)) || Number(nota) < 1 || Number(nota) > 5) {
    return res.status(400).json({ erro: "Nota deve estar entre 1 e 5" });
  }

  const roteiro = await RoteiroModel.obterRoteiroPorId(id);

  if (!roteiro || !roteiro.publico) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  const reviewExistente = await RoteiroModel.obterReviewUsuarioRoteiro(
    req.user.id,
    id,
  );

  if (reviewExistente) {
    return res.status(409).json({ erro: "Você já avaliou este roteiro" });
  }

  const avaliacao = await RoteiroModel.criarReview(
    req.user.id,
    id,
    Number(nota),
    comentario ?? null,
  );

  const resumo = await RoteiroModel.obterResumoAvaliacao(id);

  return res.status(201).json({
    mensagem: "Avaliação registrada com sucesso",
    avaliacao,
    resumo,
  });
}

export async function listarAvaliacoesRoteiro(req, res) {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  const roteiro = await RoteiroModel.obterRoteiroPorId(id);

  if (!roteiro || !roteiro.publico) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  const avaliacoes = await RoteiroModel.listarReviewsDoRoteiro(id);
  const resumo = await RoteiroModel.obterResumoAvaliacao(id);

  return res.status(200).json({
    roteiroId: id,
    resumo,
    avaliacoes,
  });
}

export async function removerAvaliacaoRoteiro(req, res) {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  const reviewExistente = await RoteiroModel.obterReviewUsuarioRoteiro(
    req.user.id,
    id,
  );

  if (!reviewExistente) {
    return res.status(404).json({ erro: "Avaliação não encontrada" });
  }

  const avaliacaoRemovida = await RoteiroModel.removerReview(req.user.id, id);
  const resumo = await RoteiroModel.obterResumoAvaliacao(id);

  return res.status(200).json({
    mensagem: "Avaliação removida com sucesso",
    avaliacao: avaliacaoRemovida,
    resumo,
  });
}
