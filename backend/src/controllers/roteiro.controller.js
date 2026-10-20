import * as RoteiroModel from "../models/roteiro.model.js";

export async function listarRoteiros(req, res) {
  const roteiros = await RoteiroModel.obterTodasRoteiros(req.user?.id);
  res.json(roteiros);
}

export async function listarRoteirosPublicos(req, res) {
  try {
    const filters = parsePublicRouteFilters(req.query || {});
    if (filters.error) {
      return res.status(400).json({ erro: filters.error });
    }
    const roteiros = await RoteiroModel.obterRoteirosPublicos(filters.value);
    return res.json(roteiros);
  } catch (error) {
    console.error("Erro ao listar roteiros públicos:", error);

    res.status(500).json({
      erro: "Não foi possível listar os roteiros públicos.",
    });
  }
}

export async function listarRoteirosPopulares(req, res) {
  try {
    const limit = Math.min(
      20,
      Math.max(1, Number.parseInt(req.query?.limit, 10) || 10),
    );
    const roteiros = await RoteiroModel.obterRoteirosPopulares(limit);
    return res.status(200).json(roteiros);
  } catch (error) {
    console.error("Erro ao listar roteiros populares:", error);

    return res.status(500).json({
      erro: "Não foi possível listar os roteiros populares.",
    });
  }
}

function parsePublicRouteFilters(query) {
  const numeric = (key) => {
    if (query[key] === undefined || query[key] === "") return undefined;
    const value = Number(query[key]);
    return Number.isFinite(value) ? value : null;
  };
  const minBudget = numeric("orcamentoMin");
  const maxBudget = numeric("orcamentoMax");
  const days = numeric("dias");
  const minRating = numeric("avaliacaoMin");
  if ([minBudget, maxBudget, days, minRating].includes(null)) {
    return { error: "Um ou mais filtros numéricos são inválidos" };
  }
  if (minBudget !== undefined && minBudget < 0) {
    return { error: "O orçamento mínimo não pode ser negativo" };
  }
  if (maxBudget !== undefined && maxBudget < 0) {
    return { error: "O orçamento máximo não pode ser negativo" };
  }
  if (
    minBudget !== undefined &&
    maxBudget !== undefined &&
    minBudget > maxBudget
  ) {
    return { error: "O orçamento mínimo não pode ser maior que o máximo" };
  }
  if (days !== undefined && (!Number.isInteger(days) || days < 1)) {
    return { error: "A quantidade de dias deve ser um inteiro positivo" };
  }
  if (minRating !== undefined && (minRating < 1 || minRating > 5)) {
    return { error: "A avaliação mínima deve estar entre 1 e 5" };
  }
  const categoryIds =
    typeof query.categorias === "string"
      ? [...new Set(query.categorias.split(",").filter(Boolean))].slice(0, 10)
      : [];
  return {
    value: {
      destino: typeof query.destino === "string" ? query.destino.trim() : "",
      termo: typeof query.termo === "string" ? query.termo.trim() : "",
      orcamentoMin: minBudget,
      orcamentoMax: maxBudget,
      dias: days,
      avaliacaoMin: minRating,
      categoriaIds: categoryIds,
    },
  };
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
  const {
    usuarioId,
    titulo,
    destino,
    descricao,
    imagemUrl,
    orcamento,
    publico,
  } = req.body;

  if (!usuarioId || typeof usuarioId !== "string" || usuarioId.trim() === "") {
    return res.status(400).json({ erro: "UsuarioId é obrigatório" });
  }

  if (typeof titulo !== "string" || titulo.trim() === "") {
    return res.status(400).json({ erro: "Título é obrigatório" });
  }

  if (typeof destino !== "string" || destino.trim() === "") {
    return res.status(400).json({ erro: "Destino é obrigatório" });
  }
  if (
    imagemUrl != null &&
    imagemUrl !== "" &&
    !isValidRouteImageUrl(imagemUrl)
  ) {
    return res.status(400).json({
      erro: "A imagem deve ser uma URL HTTP ou HTTPS válida",
    });
  }

  try {
    const roteiroCriado = await RoteiroModel.criarNovoRoteiro({
      usuarioId,
      titulo,
      destino,
      descricao,
      imagemUrl: imagemUrl || null,
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
      detalhe: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
}

export async function atualizarRoteiro(req, res) {
  const id = req.params.id;
  const { titulo, destino, descricao, imagemUrl, orcamento, publico } =
    req.body;

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
  if (
    imagemUrl !== undefined &&
    imagemUrl !== null &&
    imagemUrl !== "" &&
    !isValidRouteImageUrl(imagemUrl)
  ) {
    return res.status(400).json({
      erro: "A imagem deve ser uma URL HTTP ou HTTPS válida",
    });
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
    imagemUrl: imagemUrl === "" ? null : imagemUrl,
    orcamento,
    publico,
  });

  res.json({
    mensagem: "Roteiro atualizado com sucesso!",
    roteiro: roteiroAtualizado,
  });
}

function isValidRouteImageUrl(value) {
  if (typeof value !== "string" || value.trim().length > 500) return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
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

export async function obterCurtidasRoteiro(req, res) {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  const roteiro = await RoteiroModel.obterRoteiroPorId(id);
  if (!roteiro || (!roteiro.publico && roteiro.usuarioId !== req.user?.id)) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  const [totalCurtidas, curtida] = await Promise.all([
    RoteiroModel.contarCurtidas(id),
    req.user?.id ? RoteiroModel.obterCurtida(req.user.id, id) : null,
  ]);

  return res.status(200).json({
    roteiroId: id,
    totalCurtidas,
    curtiu: Boolean(curtida),
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
