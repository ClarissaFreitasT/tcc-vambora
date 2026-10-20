import { prisma } from "../config/prisma.js";

// Retorna a lista completa de todos os roteiros cadastrados.
export async function obterTodasRoteiros(usuarioId) {
  return prisma.roteiro.findMany({
    where: usuarioId ? { usuarioId } : { publico: true },
    include: {
      usuario: { select: { id: true, nome: true } },
      categorias: {
        include: { categoria: true },
      },
      dias: { select: { id: true, numeroDia: true } },
    },
    orderBy: { criadoEm: "desc" },
  });
}

function routeMetrics(roteiro) {
  const totalCurtidas = roteiro.favoritos?.length || 0;
  const totalAvaliacoes = roteiro.reviews?.length || 0;
  const mediaAvaliacao = totalAvaliacoes
    ? roteiro.reviews.reduce((sum, review) => sum + review.nota, 0) /
      totalAvaliacoes
    : 0;
  const totalUsos = roteiro._count?.roteirosDuplicados || 0;
  const ageDays = Math.max(
    0,
    (Date.now() - new Date(roteiro.criadoEm).getTime()) / 86_400_000,
  );
  const popularidade =
    Math.log1p(totalCurtidas) * 2 +
    Math.log1p(totalAvaliacoes) * 2 +
    (mediaAvaliacao / 5) * 1.5 +
    Math.log1p(totalUsos) * 1.5 +
    2 / (1 + ageDays / 30);

  return {
    totalCurtidas,
    totalAvaliacoes,
    mediaAvaliacao: Number(mediaAvaliacao.toFixed(2)),
    totalUsos,
    popularidade: Number(popularidade.toFixed(3)),
    totalDias: roteiro.dias?.length || 0,
  };
}

function withRouteMetrics(roteiro) {
  const { favoritos, reviews, _count, ...safeRoteiro } = roteiro;
  return {
    ...safeRoteiro,
    ...routeMetrics({ ...roteiro, favoritos, reviews, _count }),
  };
}

function matchesPublicRouteFilters(roteiro, filters = {}) {
  const destination = filters.destino?.toLocaleLowerCase("pt-BR");
  if (
    destination &&
    !roteiro.destino?.toLocaleLowerCase("pt-BR").includes(destination)
  )
    return false;
  const term = filters.termo?.toLocaleLowerCase("pt-BR");
  if (
    term &&
    ![roteiro.destino, roteiro.titulo, roteiro.descricao].some((value) =>
      value?.toLocaleLowerCase("pt-BR").includes(term),
    )
  )
    return false;
  if (
    filters.orcamentoMin !== undefined &&
    (roteiro.orcamento == null ||
      Number(roteiro.orcamento) < filters.orcamentoMin)
  )
    return false;
  if (
    filters.orcamentoMax !== undefined &&
    (roteiro.orcamento == null ||
      Number(roteiro.orcamento) > filters.orcamentoMax)
  )
    return false;
  if (
    filters.dias !== undefined &&
    (roteiro.dias?.length || 0) !== filters.dias
  )
    return false;
  if (
    filters.avaliacaoMin !== undefined &&
    roteiro.reviews?.length > 0 &&
    routeMetrics(roteiro).mediaAvaliacao < filters.avaliacaoMin
  )
    return false;
  if (filters.categoriaIds?.length) {
    const routeCategoryIds = new Set(
      roteiro.categorias?.map(({ categoriaId }) => categoriaId),
    );
    if (!filters.categoriaIds.some((id) => routeCategoryIds.has(id)))
      return false;
  }
  return true;
}

function publicRouteInclude() {
  return {
    usuario: { select: { id: true, nome: true, username: true } },
    categorias: { include: { categoria: true } },
    dias: { select: { id: true, numeroDia: true } },
    favoritos: { select: { id: true } },
    reviews: { select: { nota: true } },
    _count: { select: { roteirosDuplicados: true } },
  };
}

export async function obterRoteirosPublicos(filters = {}) {
  const roteiros = await prisma.roteiro.findMany({
    where: { publico: true },
    include: publicRouteInclude(),
  });
  return roteiros
    .filter((roteiro) => matchesPublicRouteFilters(roteiro, filters))
    .map(withRouteMetrics)
    .sort((a, b) => {
      const destination = filters.destino?.toLocaleLowerCase("pt-BR");
      const rank = (route) => {
        if (!destination) return 0;
        const value = route.destino?.toLocaleLowerCase("pt-BR") || "";
        return value === destination
          ? 4
          : value.startsWith(destination)
            ? 3
            : 2;
      };
      const termRank = (route) => {
        const term = filters.termo?.toLocaleLowerCase("pt-BR");
        if (!term) return 0;
        if (route.titulo?.toLocaleLowerCase("pt-BR").includes(term)) return 1;
        if (route.descricao?.toLocaleLowerCase("pt-BR").includes(term))
          return 0.5;
        return 0;
      };
      return (
        rank(b) - rank(a) ||
        termRank(b) - termRank(a) ||
        b.popularidade - a.popularidade ||
        new Date(b.criadoEm) - new Date(a.criadoEm)
      );
    });
}

export async function obterRoteirosPopulares(limit = 10) {
  const roteiros = await prisma.roteiro.findMany({
    where: { publico: true },
    include: publicRouteInclude(),
    orderBy: { criadoEm: "desc" },
  });

  return roteiros
    .map(withRouteMetrics)
    .filter(
      (roteiro) =>
        roteiro.totalCurtidas > 0 ||
        roteiro.totalAvaliacoes > 0 ||
        roteiro.totalUsos > 0,
    )
    .sort(
      (a, b) =>
        b.popularidade - a.popularidade ||
        new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
    )
    .slice(0, limit)
    .map(({ favoritos, reviews, _count, ...roteiro }) => roteiro);
}

// Busca um roteiro específico pelo seu identificador único.
export async function obterRoteiroPorId(id, usuarioId) {
  return prisma.roteiro.findUnique({
    where: { id },
    include: {
      usuario: { select: { id: true, nome: true } },
      dias: {
        orderBy: { numeroDia: "asc" },
        include: { itens: { orderBy: { ordem: "asc" } } },
      },
      categorias: {
        include: { categoria: true },
      },
    },
  });
}

export async function usuarioPodeEditar(id, usuarioId) {
  const roteiro = await prisma.roteiro.findUnique({
    where: { id },
    select: { usuarioId: true },
  });

  return roteiro?.usuarioId === usuarioId;
}

export async function obterCurtida(usuarioId, roteiroId) {
  return prisma.favorito.findUnique({
    where: {
      usuarioId_roteiroId: {
        usuarioId,
        roteiroId,
      },
    },
  });
}

export async function criarCurtida(usuarioId, roteiroId) {
  return prisma.favorito.create({
    data: {
      usuarioId,
      roteiroId,
    },
  });
}

export async function removerCurtida(usuarioId, roteiroId) {
  return prisma.favorito.delete({
    where: {
      usuarioId_roteiroId: {
        usuarioId,
        roteiroId,
      },
    },
  });
}

export async function contarCurtidas(roteiroId) {
  return prisma.favorito.count({
    where: { roteiroId },
  });
}

export async function listarRoteirosCurtidosUsuario(usuarioId) {
  const curtidas = await prisma.favorito.findMany({
    where: {
      usuarioId,
      roteiro: { publico: true },
    },
    include: {
      roteiro: {
        include: {
          usuario: {
            select: { id: true, nome: true, username: true },
          },
          categorias: {
            include: { categoria: true },
          },
        },
      },
    },
    orderBy: { roteiro: { criadoEm: "desc" } },
  });

  return curtidas.map(({ roteiro }) => roteiro);
}

export async function obterRoteiroSalvo(usuarioId, roteiroId) {
  return prisma.salvoRoteiro.findUnique({
    where: {
      usuarioId_roteiroId: {
        usuarioId,
        roteiroId,
      },
    },
  });
}

export async function salvarRoteiro(usuarioId, roteiroId) {
  return prisma.salvoRoteiro.create({
    data: {
      usuarioId,
      roteiroId,
    },
  });
}

export async function removerRoteiroSalvo(usuarioId, roteiroId) {
  return prisma.salvoRoteiro.delete({
    where: {
      usuarioId_roteiroId: {
        usuarioId,
        roteiroId,
      },
    },
  });
}

export async function listarRoteirosSalvos(usuarioId) {
  return prisma.salvoRoteiro.findMany({
    where: { usuarioId },
    include: {
      roteiro: {
        include: {
          usuario: {
            select: { id: true, nome: true, username: true },
          },
        },
      },
    },
    orderBy: { id: "desc" },
  });
}

export async function obterReviewUsuarioRoteiro(usuarioId, roteiroId) {
  return prisma.review.findUnique({
    where: {
      usuarioId_roteiroId: {
        usuarioId,
        roteiroId,
      },
    },
  });
}

export async function criarReview(
  usuarioId,
  roteiroId,
  nota,
  comentario = null,
) {
  return prisma.review.create({
    data: {
      usuarioId,
      roteiroId,
      nota,
      comentario,
    },
  });
}

export async function listarReviewsDoRoteiro(roteiroId) {
  return prisma.review.findMany({
    where: { roteiroId },
    include: {
      usuario: {
        select: { id: true, nome: true, username: true },
      },
    },
    orderBy: { criadoEm: "desc" },
  });
}

export async function removerReview(usuarioId, roteiroId) {
  return prisma.review.delete({
    where: {
      usuarioId_roteiroId: {
        usuarioId,
        roteiroId,
      },
    },
  });
}

export async function obterResumoAvaliacao(roteiroId) {
  const resumo = await prisma.review.aggregate({
    where: { roteiroId },
    _avg: { nota: true },
    _count: { nota: true },
  });

  return {
    media: Number(resumo._avg.nota ?? 0),
    total: resumo._count.nota ?? 0,
  };
}

// Cria um novo roteiro com as informações fornecidas pelo usuário.
export async function criarNovoRoteiro({
  usuarioId,
  titulo,
  destino,
  descricao = null,
  orcamento = null,
  imagemUrl = null,
  publico = false,
  roteiroOriginalId = null,
}) {
  return prisma.roteiro.create({
    data: {
      usuarioId,
      titulo,
      destino,
      descricao,
      imagemUrl,
      orcamento,
      publico,
      roteiroOriginalId,
    },
  });
}

// Atualiza os dados de um roteiro existente com as informações fornecidas.
export async function atualizarRoteiro(id, dados) {
  const roteiroExistente = await prisma.roteiro.findUnique({
    where: { id },
  });

  if (!roteiroExistente) {
    return null;
  }

  const updateData = {};

  if (dados.titulo !== undefined) updateData.titulo = dados.titulo;
  if (dados.destino !== undefined) updateData.destino = dados.destino;
  if (dados.descricao !== undefined) updateData.descricao = dados.descricao;
  if (dados.imagemUrl !== undefined) updateData.imagemUrl = dados.imagemUrl;
  if (dados.orcamento !== undefined) updateData.orcamento = dados.orcamento;
  if (dados.publico !== undefined) updateData.publico = dados.publico;

  return prisma.roteiro.update({
    where: { id },
    data: updateData,
  });
}

// Remove um roteiro do banco de dados pelo seu identificador.
export async function excluirRoteiro(id) {
  const roteiroExistente = await prisma.roteiro.findUnique({
    where: { id },
  });

  if (!roteiroExistente) {
    return null;
  }

  return prisma.roteiro.delete({
    where: { id },
  });
}

export async function duplicarRoteiro(roteiroId, usuarioId) {
  const roteiroOriginal = await prisma.roteiro.findUnique({
    where: { id: roteiroId },
    include: {
      dias: {
        include: { itens: true },
      },
    },
  });

  if (!roteiroOriginal) {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    const roteiroDuplicado = await tx.roteiro.create({
      data: {
        usuarioId,
        roteiroOriginalId: roteiroOriginal.id,
        titulo: `${roteiroOriginal.titulo} (Cópia)`,
        destino: roteiroOriginal.destino,
        descricao: roteiroOriginal.descricao,
        imagemUrl: roteiroOriginal.imagemUrl,
        orcamento: roteiroOriginal.orcamento,
        publico: false,
      },
    });

    for (const dia of roteiroOriginal.dias) {
      const diaDuplicado = await tx.diaDoRoteiro.create({
        data: {
          roteiroId: roteiroDuplicado.id,
          numeroDia: dia.numeroDia,
          titulo: dia.titulo,
        },
      });

      for (const item of dia.itens) {
        await tx.itemDoRoteiro.create({
          data: {
            diaId: diaDuplicado.id,
            titulo: item.titulo,
            descricao: item.descricao,
            localNome: item.localNome,
            custoEstimado: item.custoEstimado,
            horarioInicio: item.horarioInicio,
            ordem: item.ordem,
          },
        });
      }
    }

    return roteiroDuplicado;
  });
}
