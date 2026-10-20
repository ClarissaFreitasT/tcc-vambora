import * as PublicacaoModel from "../models/publicacao.model.js";

export async function criarPublicacao(req, res) {
  const { texto, roteiroId } = req.body || {};
  let categoriaIds = [];
  try {
    const rawCategoryIds = req.body?.categoriaIds;
    categoriaIds = Array.isArray(rawCategoryIds)
      ? rawCategoryIds
      : rawCategoryIds
        ? JSON.parse(rawCategoryIds)
        : [];
  } catch {
    return res.status(400).json({ erro: "Categorias inválidas" });
  }

  if (!texto || typeof texto !== "string" || texto.trim() === "") {
    return res.status(400).json({ erro: "Texto da publicação é obrigatório" });
  }
  if (
    !Array.isArray(categoriaIds) ||
    categoriaIds.length > 3 ||
    categoriaIds.some((id) => typeof id !== "string")
  ) {
    return res.status(400).json({ erro: "Selecione categorias válidas" });
  }
  categoriaIds = [...new Set(categoriaIds)];

  try {
    const categories = await PublicacaoModel.listarCategoriasPublicacao();
    const allowedIds = new Set(categories.map(({ id }) => id));
    if (categoriaIds.some((id) => !allowedIds.has(id))) {
      return res
        .status(400)
        .json({ erro: "Uma ou mais categorias não são válidas" });
    }
    if (roteiroId) {
      const roteiro = await PublicacaoModel.obterRoteiroVinculavel(
        roteiroId,
        req.user.id,
      );
      if (!roteiro?.publico) {
        return res.status(400).json({
          erro: "Só é possível compartilhar um roteiro público seu",
        });
      }
    }

    const publicacao = await PublicacaoModel.criarPublicacao(
      req.user.id,
      texto.trim(),
      roteiroId || null,
      [],
      categoriaIds,
    );

    return res.status(201).json(publicacao);
  } catch (error) {
    console.error("Erro ao criar publicação:", error);
    return res.status(500).json({
      erro: "Não foi possível criar a publicação",
      detalhe: process.env.NODE_ENV === "production" ? undefined : error.message,
    });
  }
}

export async function listarPublicacoesUsuario(req, res) {
  const { usuarioId } = req.params;

  const publicacoes = await PublicacaoModel.listarPublicacoesUsuario(usuarioId);

  return res.status(200).json(publicacoes);
}

export async function listarFeedUsuario(req, res) {
  const parsed = parseFeedOptions(req.query || {});
  const publicacoes = parsed
    ? await PublicacaoModel.listarFeedPaginado(req.user.id, {
        ...parsed,
        following: true,
      })
    : await PublicacaoModel.listarFeedUsuario(req.user.id);

  if (parsed) return res.status(200).json(publicacoes);

  return res.status(200).json(
    publicacoes.map(({ curtidas = [], salvos = [], ...publicacao }) => ({
      ...publicacao,
      curtiu: curtidas.length > 0,
      salvo: salvos.length > 0,
    })),
  );
}

export async function listarTimelinePublica(req, res) {
  const parsed = parseFeedOptions(req.query || {});
  const publicacoes = await PublicacaoModel.listarTimelinePublica(
    req.user?.id,
    parsed,
  );

  if (parsed) return res.status(200).json(publicacoes);

  return res.status(200).json(
    publicacoes.map(({ curtidas = [], salvos = [], ...publicacao }) => ({
      ...publicacao,
      curtiu: curtidas.length > 0,
      salvo: salvos.length > 0,
    })),
  );
}

function parseFeedOptions(query) {
  if (!query.limit && !query.cursor && !query.categorias) return null;
  const limit = Math.min(
    30,
    Math.max(1, Number.parseInt(query.limit, 10) || 12),
  );
  const categoryIds =
    typeof query.categorias === "string"
      ? query.categorias.split(",").filter(Boolean).slice(0, 3)
      : [];
  return {
    limit,
    cursor: typeof query.cursor === "string" ? query.cursor : undefined,
    categoryIds,
  };
}

export async function listarCategoriasPublicacao(_req, res) {
  return res
    .status(200)
    .json(await PublicacaoModel.listarCategoriasPublicacao());
}

export async function listarCurtidasPublicacao(req, res) {
  const publication = await PublicacaoModel.obterPublicacaoPorId(req.params.id);
  if (!publication)
    return res.status(404).json({ erro: "Publicação não encontrada" });
  return res
    .status(200)
    .json(await PublicacaoModel.listarCurtidasComUsuarios(req.params.id));
}

export async function salvarPublicacao(req, res) {
  const publication = await PublicacaoModel.obterPublicacaoPorId(req.params.id);
  if (!publication)
    return res.status(404).json({ erro: "Publicação não encontrada" });
  await PublicacaoModel.salvarPublicacao(req.user.id, req.params.id);
  return res.status(200).json({ salvo: true });
}

export async function removerPublicacaoSalva(req, res) {
  await PublicacaoModel.removerPublicacaoSalva(req.user.id, req.params.id);
  return res.status(200).json({ salvo: false });
}

export async function listarPublicacoesSalvas(req, res) {
  return res
    .status(200)
    .json(await PublicacaoModel.listarPublicacoesSalvas(req.user.id));
}

export async function denunciarPublicacao(req, res) {
  const { motivo, detalhe } = req.body;
  const motivosValidos = new Set([
    "Spam",
    "Assédio ou discurso de ódio",
    "Conteúdo impróprio",
    "Informação enganosa",
    "Outro",
  ]);
  if (!motivosValidos.has(motivo))
    return res.status(400).json({ erro: "Selecione um motivo válido" });
  const publication = await PublicacaoModel.obterPublicacaoPorId(req.params.id);
  if (!publication)
    return res.status(404).json({ erro: "Publicação não encontrada" });
  if (publication.usuarioId === req.user.id)
    return res
      .status(400)
      .json({ erro: "Você não pode denunciar sua própria publicação" });
  if (await PublicacaoModel.obterDenuncia(req.user.id, req.params.id))
    return res.status(409).json({ erro: "Você já denunciou esta publicação" });
  try {
    await PublicacaoModel.criarDenuncia(
      req.user.id,
      req.params.id,
      motivo,
      typeof detalhe === "string" ? detalhe.trim().slice(0, 2000) : null,
    );
  } catch (error) {
    if (error.code === "P2002")
      return res
        .status(409)
        .json({ erro: "Você já denunciou esta publicação" });
    throw error;
  }
  return res.status(201).json({ mensagem: "Denúncia enviada para análise" });
}

export async function listarDenunciasPublicacoes(req, res) {
  if (req.user?.role !== "ADMIN")
    return res.status(403).json({ erro: "Acesso restrito a administradores" });
  return res
    .status(200)
    .json(await PublicacaoModel.listarDenunciasPublicacoes());
}

export async function atualizarEstadoDenuncia(req, res) {
  if (req.user?.role !== "ADMIN")
    return res.status(403).json({ erro: "Acesso restrito a administradores" });
  const validStates = new Set(["ABERTA", "EM_ANALISE", "TRATADA"]);
  if (!validStates.has(req.body.estado))
    return res.status(400).json({ erro: "Estado da denúncia inválido" });
  try {
    const report = await PublicacaoModel.atualizarEstadoDenuncia(
      req.params.denunciaId,
      req.body.estado,
    );
    return res.status(200).json(report);
  } catch (error) {
    if (error.code === "P2025")
      return res.status(404).json({ erro: "Denúncia não encontrada" });
    throw error;
  }
}

export async function excluirPublicacaoPropria(req, res) {
  const publication = await PublicacaoModel.obterPublicacaoPorId(req.params.id);
  if (!publication)
    return res.status(404).json({ erro: "Publicação não encontrada" });
  if (publication.usuarioId !== req.user.id)
    return res
      .status(403)
      .json({ erro: "Você só pode excluir suas próprias publicações" });
  await PublicacaoModel.excluirPublicacao(req.params.id);
  return res.status(204).send();
}

export async function obterPreviewComentarios(req, res) {
  const publication = await PublicacaoModel.obterPublicacaoPorId(req.params.id);
  if (!publication)
    return res.status(404).json({ erro: "Publicação não encontrada" });
  return res.status(200).json(publication.comentarios || []);
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

  if (comentarioPaiId != null) {
    if (typeof comentarioPaiId !== "string" || !comentarioPaiId.trim()) {
      return res.status(400).json({ erro: "Comentário pai inválido" });
    }
    const comentarioPai = await PublicacaoModel.obterComentarioDaPublicacao(
      comentarioPaiId,
      id,
    );
    if (!comentarioPai) {
      return res.status(400).json({
        erro: "O comentário respondido não pertence a esta publicação",
      });
    }
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
