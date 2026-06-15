import { prisma } from "../config/prisma.js";

export async function obterTodasRoteiros() {
  return prisma.roteiro.findMany();
}

export async function obterRoteiroPorId(id) {
  return prisma.roteiro.findUnique({
    where: { id }
  });
}

export async function criarNovoRoteiro({
  usuarioId,
  titulo,
  destino,
  descricao = null,
  orcamento = null,
  publico = false,
  roteiroOriginalId = null
}) {
  return prisma.roteiro.create({
    data: {
      usuarioId,
      titulo,
      destino,
      descricao,
      orcamento,
      publico,
      roteiroOriginalId
    }
  });
}

export async function atualizarRoteiro(id, dados) {
  const roteiroExistente = await prisma.roteiro.findUnique({
    where: { id }
  });

  if (!roteiroExistente) {
    return null;
  }

  const updateData = {};

  if (dados.titulo !== undefined) updateData.titulo = dados.titulo;
  if (dados.destino !== undefined) updateData.destino = dados.destino;
  if (dados.descricao !== undefined) updateData.descricao = dados.descricao;
  if (dados.orcamento !== undefined) updateData.orcamento = dados.orcamento;
  if (dados.publico !== undefined) updateData.publico = dados.publico;

  return prisma.roteiro.update({
    where: { id },
    data: updateData
  });
}

export async function excluirRoteiro(id) {
  const roteiroExistente = await prisma.roteiro.findUnique({
    where: { id }
  });

  if (!roteiroExistente) {
    return null;
  }

  return prisma.roteiro.delete({
    where: { id }
  });
}

