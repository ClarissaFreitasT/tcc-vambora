import { prisma } from "../config/prisma.js";

const publicacaoInclude = (usuarioId) => ({
  usuario: {
    select: { id: true, nome: true, username: true, fotoUrl: true },
  },
  roteiro: {
    select: { id: true, titulo: true, destino: true, publico: true },
  },
  categorias: {
    include: { categoria: { select: { id: true, nome: true } } },
  },
  fotos: { orderBy: { ordem: "asc" } },
  comentarios: {
    where: { comentarioPaiId: null },
    take: 2,
    orderBy: { criadoEm: "desc" },
    include: {
      usuario: {
        select: { id: true, nome: true, username: true, fotoUrl: true },
      },
    },
  },
  _count: {
    select: { curtidas: true, comentarios: true },
  },
  ...(usuarioId
    ? {
        curtidas: {
          where: { usuarioId },
          select: { id: true },
        },
        salvos: {
          where: { usuarioId },
          select: { id: true },
        },
      }
    : {}),
});

function communityWhere({ followingUserId, categoryIds = [] } = {}) {
  return {
    ...(followingUserId
      ? {
          OR: [
            { usuarioId: followingUserId },
            {
              usuario: { seguindo: { some: { seguidorId: followingUserId } } },
            },
          ],
        }
      : {}),
    ...(categoryIds.length
      ? {
          categorias: {
            some: { categoriaId: { in: categoryIds } },
          },
        }
      : {}),
  };
}

async function findCommunityPage(
  where,
  usuarioId,
  { limit, cursor, following = false } = {},
) {
  const rows = await prisma.publicacao.findMany({
    where,
    include: publicacaoInclude(usuarioId),
    orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
    ...(limit
      ? {
          take: limit + 1,
          ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        }
      : {}),
  });

  const safeRows = rows.map(sanitizePrivateRoute);
  if (!limit) return safeRows;
  const hasMore = safeRows.length > limit;
  const chronologicalItems = safeRows.slice(0, limit);
  const nextCursor = hasMore ? chronologicalItems.at(-1)?.id || null : null;
  const rankedItems = following
    ? chronologicalItems
    : [...chronologicalItems].sort(
        (a, b) => relevanceScore(b) - relevanceScore(a),
      );
  const items = rankedItems.map((post) => ({
    ...post,
    curtiu: Boolean(post.curtidas?.length),
    salvo: Boolean(post.salvos?.length),
    curtidas: undefined,
    salvos: undefined,
  }));
  return {
    items,
    nextCursor,
  };
}

function relevanceScore(post) {
  const ageDays = Math.max(
    0,
    (Date.now() - new Date(post.criadoEm).getTime()) / 86_400_000,
  );
  const likes = post._count?.curtidas || 0;
  const comments = post._count?.comentarios || 0;
  return (
    1 / (1 + ageDays / 5) +
    Math.log1p(likes) * 0.15 +
    Math.log1p(comments) * 0.2
  );
}

function sanitizePrivateRoute(post) {
  return { ...post, roteiro: post.roteiro?.publico ? post.roteiro : null };
}

export async function criarPublicacao(
  usuarioId,
  texto,
  roteiroId = null,
  fotoUrls = [],
  categoriaIds = [],
) {
  const created = await prisma.publicacao.create({
    data: {
      usuarioId,
      texto,
      roteiroId,
      fotos: {
        create: fotoUrls.map((url, ordem) => ({ url, ordem })),
      },
      categorias: {
        create: categoriaIds.map((categoriaId) => ({
          categoria: { connect: { id: categoriaId } },
        })),
      },
    },
    include: publicacaoInclude(usuarioId),
  });
  return {
    ...sanitizePrivateRoute(created),
    curtidas: undefined,
    salvos: undefined,
    curtiu: false,
    salvo: false,
  };
}

export async function obterPublicacaoPorId(id) {
  const post = await prisma.publicacao.findUnique({
    where: { id },
    include: {
      usuario: {
        select: { id: true, nome: true, username: true, fotoUrl: true },
      },
      roteiro: {
        select: { id: true, titulo: true, destino: true, publico: true },
      },
      categorias: {
        include: { categoria: { select: { id: true, nome: true } } },
      },
      fotos: { orderBy: { ordem: "asc" } },
      comentarios: {
        where: { comentarioPaiId: null },
        take: 2,
        orderBy: { criadoEm: "desc" },
        include: {
          usuario: {
            select: { id: true, nome: true, username: true, fotoUrl: true },
          },
        },
      },
      _count: {
        select: {
          curtidas: true,
          comentarios: true,
        },
      },
    },
  });
  return post ? sanitizePrivateRoute(post) : null;
}

export async function obterRoteiroVinculavel(id, usuarioId) {
  return prisma.roteiro.findFirst({
    where: { id, usuarioId },
    select: { id: true, publico: true },
  });
}

export async function listarPublicacoesUsuario(usuarioId) {
  const posts = await prisma.publicacao.findMany({
    where: { usuarioId },
    include: publicacaoInclude(),
    orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
  });
  return posts.map(sanitizePrivateRoute);
}

export async function listarPublicacoesCurtidasUsuario(usuarioId) {
  const curtidas = await prisma.curtidaPublicacao.findMany({
    where: { usuarioId },
    include: {
      publicacao: {
        include: {
          usuario: {
            select: { id: true, nome: true, username: true, fotoUrl: true },
          },
          roteiro: {
            select: { id: true, titulo: true, destino: true, publico: true },
          },
          categorias: {
            include: { categoria: { select: { id: true, nome: true } } },
          },
          fotos: { orderBy: { ordem: "asc" } },
          _count: {
            select: { curtidas: true, comentarios: true },
          },
        },
      },
    },
    orderBy: { publicacao: { criadoEm: "desc" } },
  });

  return curtidas
    .map(({ publicacao }) => ({
      ...publicacao,
      roteiro: publicacao.roteiro?.publico ? publicacao.roteiro : null,
      curtiu: true,
    }))
    .filter((publicacao) => publicacao.usuarioId);
}

export async function listarFeedUsuario(usuarioId) {
  return findCommunityPage(
    communityWhere({ followingUserId: usuarioId }),
    usuarioId,
  );
}

export async function listarFeedPaginado(usuarioId, options = {}) {
  return findCommunityPage(
    communityWhere({
      ...(options.following ? { followingUserId: usuarioId } : {}),
      categoryIds: options.categoryIds,
    }),
    usuarioId,
    options,
  );
}

export async function listarTimelinePublica(usuarioId, options) {
  if (options?.limit) {
    return listarFeedPaginado(usuarioId, options);
  }
  return findCommunityPage({}, usuarioId);
}

export async function listarCategoriasPublicacao() {
  return prisma.categoria.findMany({
    where: { nome: { in: ["Dicas", "Roteiros", "Destinos"] } },
    orderBy: { nome: "asc" },
  });
}

export async function listarCurtidasComUsuarios(publicacaoId) {
  return prisma.curtidaPublicacao.findMany({
    where: { publicacaoId },
    include: {
      usuario: {
        select: { id: true, nome: true, username: true, fotoUrl: true },
      },
    },
    orderBy: { id: "desc" },
  });
}

export async function obterSalvamentoPublicacao(usuarioId, publicacaoId) {
  return prisma.salvoPublicacao.findUnique({
    where: { usuarioId_publicacaoId: { usuarioId, publicacaoId } },
  });
}

export async function salvarPublicacao(usuarioId, publicacaoId) {
  return prisma.salvoPublicacao.upsert({
    where: { usuarioId_publicacaoId: { usuarioId, publicacaoId } },
    update: {},
    create: { usuarioId, publicacaoId },
  });
}

export async function removerPublicacaoSalva(usuarioId, publicacaoId) {
  return prisma.salvoPublicacao.deleteMany({
    where: { usuarioId, publicacaoId },
  });
}

export async function listarPublicacoesSalvas(usuarioId) {
  const entries = await prisma.salvoPublicacao.findMany({
    where: { usuarioId },
    include: { publicacao: { include: publicacaoInclude(usuarioId) } },
    orderBy: [{ criadoEm: "desc" }, { id: "desc" }],
  });
  return entries.map(({ publicacao }) => ({
    ...publicacao,
    curtiu: Boolean(publicacao.curtidas?.length),
    salvo: true,
    curtidas: undefined,
    salvos: undefined,
  }));
}

export async function criarDenuncia(usuarioId, publicacaoId, motivo, detalhe) {
  return prisma.denunciaPublicacao.create({
    data: { usuarioId, publicacaoId, motivo, detalhe: detalhe || null },
  });
}

export async function obterDenuncia(usuarioId, publicacaoId) {
  return prisma.denunciaPublicacao.findUnique({
    where: { usuarioId_publicacaoId: { usuarioId, publicacaoId } },
  });
}

export async function listarDenunciasPublicacoes() {
  return prisma.denunciaPublicacao.findMany({
    include: {
      usuario: {
        select: { id: true, nome: true, username: true },
      },
      publicacao: {
        select: {
          id: true,
          texto: true,
          criadoEm: true,
          usuario: { select: { id: true, nome: true, username: true } },
        },
      },
    },
    orderBy: [{ estado: "asc" }, { criadoEm: "desc" }],
  });
}

export async function atualizarEstadoDenuncia(id, estado) {
  return prisma.denunciaPublicacao.update({
    where: { id },
    data: { estado },
  });
}

export async function obterCurtidaPublicacao(usuarioId, publicacaoId) {
  return prisma.curtidaPublicacao.findUnique({
    where: {
      usuarioId_publicacaoId: {
        usuarioId,
        publicacaoId,
      },
    },
  });
}

export async function criarCurtidaPublicacao(usuarioId, publicacaoId) {
  return prisma.curtidaPublicacao.create({
    data: {
      usuarioId,
      publicacaoId,
    },
  });
}

export async function removerCurtidaPublicacao(usuarioId, publicacaoId) {
  return prisma.curtidaPublicacao.delete({
    where: {
      usuarioId_publicacaoId: {
        usuarioId,
        publicacaoId,
      },
    },
  });
}

export async function contarCurtidasPublicacao(publicacaoId) {
  return prisma.curtidaPublicacao.count({
    where: { publicacaoId },
  });
}

export async function criarComentarioPublicacao(
  usuarioId,
  publicacaoId,
  texto,
  comentarioPaiId = null,
) {
  return prisma.comentario.create({
    data: {
      usuarioId,
      publicacaoId,
      texto,
      comentarioPaiId,
    },
  });
}

export async function obterComentarioDaPublicacao(comentarioId, publicacaoId) {
  return prisma.comentario.findFirst({
    where: { id: comentarioId, publicacaoId },
    select: { id: true },
  });
}

export async function listarComentariosPublicacao(publicacaoId) {
  return prisma.comentario.findMany({
    where: { publicacaoId },
    include: {
      usuario: {
        select: { id: true, nome: true, username: true, fotoUrl: true },
      },
      comentarioPai: true,
      respostas: true,
    },
    orderBy: { criadoEm: "asc" },
  });
}

export async function obterComentarioPorId(id) {
  return prisma.comentario.findUnique({
    where: { id },
    include: {
      usuario: {
        select: { id: true, nome: true, username: true, fotoUrl: true },
      },
      publicacao: {
        select: { id: true, texto: true },
      },
    },
  });
}

export async function excluirPublicacao(id) {
  return prisma.publicacao.delete({
    where: { id },
  });
}

export async function excluirComentario(id) {
  return prisma.comentario.delete({
    where: { id },
  });
}
