import { prisma } from "../config/prisma.js";

export async function criarPublicacao(usuarioId, texto, roteiroId = null) {
  return prisma.publicacao.create({
    data: {
      usuarioId,
      texto,
      roteiroId,
    },
  });
}

export async function obterPublicacaoPorId(id) {
  return prisma.publicacao.findUnique({
    where: { id },
    include: {
      usuario: {
        select: { id: true, nome: true, username: true },
      },
      roteiro: {
        select: { id: true, titulo: true, publico: true },
      },
      _count: {
        select: {
          curtidas: true,
          comentarios: true,
        },
      },
    },
  });
}

export async function listarPublicacoesUsuario(usuarioId) {
  return prisma.publicacao.findMany({
    where: { usuarioId },
    include: {
      usuario: {
        select: { id: true, nome: true, username: true },
      },
      roteiro: {
        select: { id: true, titulo: true, publico: true },
      },
      _count: {
        select: {
          curtidas: true,
          comentarios: true,
        },
      },
    },
    orderBy: { criadoEm: "desc" },
  });
}

export async function listarFeedUsuario(usuarioId) {
  return prisma.publicacao.findMany({
    where: {
      OR: [
        { usuarioId },
        { usuario: { seguindo: { some: { seguidorId: usuarioId } } } },
      ],
    },
    include: {
      usuario: {
        select: { id: true, nome: true, username: true },
      },
      roteiro: {
        select: { id: true, titulo: true, publico: true },
      },
      _count: {
        select: {
          curtidas: true,
          comentarios: true,
        },
      },
    },
    orderBy: { criadoEm: "desc" },
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

export async function listarComentariosPublicacao(publicacaoId) {
  return prisma.comentario.findMany({
    where: { publicacaoId },
    include: {
      usuario: {
        select: { id: true, nome: true, username: true },
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
        select: { id: true, nome: true, username: true },
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
