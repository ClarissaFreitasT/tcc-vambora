import * as PublicacaoModel from "../models/publicacao.model.js";

export async function criarPublicacao(req, res) {
  const { texto, roteiroId } = req.body;

  if (!texto || typeof texto !== "string" || texto.trim() === "") {
    return res.status(400).json({ erro: "Texto da publicação é obrigatório" });
  }

  try {
    const publicacao = await PublicacaoModel.criarPublicacao(
      req.user.id,
      texto.trim(),
      roteiroId ?? null,
    );

    return res.status(201).json({
      mensagem: "Publicação criada com sucesso",
      publicacao,
    });
  } catch (error) {
    console.error("Erro ao criar publicação:", error);
    return res.status(500).json({
      erro: "Não foi possível criar a publicação",
      detalhe: error.message,
    });
  }
}

export async function listarPublicacoesUsuario(req, res) {
  const { usuarioId } = req.params;

  const publicacoes = await PublicacaoModel.listarPublicacoesUsuario(usuarioId);

  return res.status(200).json(publicacoes);
}

export async function listarFeedUsuario(req, res) {
  const publicacoes = await PublicacaoModel.listarFeedUsuario(req.user.id);

  return res.status(200).json(publicacoes);
}

export async function obterPublicacao(req, res) {
  const { id } = req.params;

  const publicacao = await PublicacaoModel.obterPublicacaoPorId(id);

  if (!publicacao) {
    return res.status(404).json({ erro: "Publicação não encontrada" });
  }

  return res.status(200).json(publicacao);
}

export async function curtirPublicacao(req, res) {
  const { id } = req.params;

  const publicacao = await PublicacaoModel.obterPublicacaoPorId(id);

  if (!publicacao) {
    return res.status(404).json({ erro: "Publicação não encontrada" });
  }

  const curtidaExistente = await PublicacaoModel.obterCurtidaPublicacao(
    req.user.id,
    id,
  );

  if (curtidaExistente) {
    return res.status(409).json({ erro: "Você já curtiu esta publicação" });
  }

  const curtida = await PublicacaoModel.criarCurtidaPublicacao(req.user.id, id);
  const totalCurtidas = await PublicacaoModel.contarCurtidasPublicacao(id);

  return res.status(201).json({
    mensagem: "Publicação curtida com sucesso",
    curtida,
    totalCurtidas,
  });
}

export async function removerCurtidaPublicacao(req, res) {
  const { id } = req.params;

  const curtidaExistente = await PublicacaoModel.obterCurtidaPublicacao(
    req.user.id,
    id,
  );

  if (!curtidaExistente) {
    return res.status(404).json({ erro: "Curtida não encontrada" });
  }

  const curtidaRemovida = await PublicacaoModel.removerCurtidaPublicacao(
    req.user.id,
    id,
  );
  const totalCurtidas = await PublicacaoModel.contarCurtidasPublicacao(id);

  return res.status(200).json({
    mensagem: "Curtida removida com sucesso",
    curtida: curtidaRemovida,
    totalCurtidas,
  });
}

export async function adicionarComentarioPublicacao(req, res) {
  const { id } = req.params;
  const { texto, comentarioPaiId } = req.body;

  if (!texto || typeof texto !== "string" || texto.trim() === "") {
    return res.status(400).json({ erro: "Texto do comentário é obrigatório" });
  }

  const publicacao = await PublicacaoModel.obterPublicacaoPorId(id);

  if (!publicacao) {
    return res.status(404).json({ erro: "Publicação não encontrada" });
  }

  const comentario = await PublicacaoModel.criarComentarioPublicacao(
    req.user.id,
    id,
    texto.trim(),
    comentarioPaiId ?? null,
  );

  return res.status(201).json({
    mensagem: "Comentário adicionado com sucesso",
    comentario,
  });
}

export async function listarComentariosPublicacao(req, res) {
  const { id } = req.params;

  const publicacao = await PublicacaoModel.obterPublicacaoPorId(id);

  if (!publicacao) {
    return res.status(404).json({ erro: "Publicação não encontrada" });
  }

  const comentarios = await PublicacaoModel.listarComentariosPublicacao(id);

  return res.status(200).json(comentarios);
}

export async function excluirPublicacaoAdmin(req, res) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ erro: "Acesso restrito a administradores" });
  }

  const { id } = req.params;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID da publicação inválido" });
  }

  const publicacaoExistente = await PublicacaoModel.obterPublicacaoPorId(id);

  if (!publicacaoExistente) {
    return res.status(404).json({ erro: "Publicação não encontrada" });
  }

  const publicacaoRemovida = await PublicacaoModel.excluirPublicacao(id);

  return res.status(200).json({
    mensagem: "Publicação removida pelo administrador",
    publicacao: publicacaoRemovida,
  });
}

export async function excluirComentarioAdmin(req, res) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ erro: "Acesso restrito a administradores" });
  }

  const { comentarioId } = req.params;

  if (!comentarioId || typeof comentarioId !== "string") {
    return res.status(400).json({ erro: "ID do comentário inválido" });
  }

  const comentarioExistente =
    await PublicacaoModel.obterComentarioPorId(comentarioId);

  if (!comentarioExistente) {
    return res.status(404).json({ erro: "Comentário não encontrado" });
  }

  const comentarioRemovido =
    await PublicacaoModel.excluirComentario(comentarioId);

  return res.status(200).json({
    mensagem: "Comentário removido pelo administrador",
    comentario: comentarioRemovido,
  });
}
