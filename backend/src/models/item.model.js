import { prisma } from "../config/prisma.js";

export async function criarItem(
  diaId,
  titulo,
  descricao,
  localNome
) {
  return prisma.itemDoRoteiro.create({
    data: {
      diaId,
      titulo,
      descricao,
      localNome
    }
  });
}

export async function listarItensDoDia(diaId) {
  return prisma.itemDoRoteiro.findMany({
    where: {
      diaId
    }
  });
}

export async function atualizarItem(id, dadosAtualizados) {
  const itemExistente = await prisma.itemDoRoteiro.findUnique({
    where: { id }
  });

  if (!itemExistente) {
    return null;
  }

  return prisma.itemDoRoteiro.update({
    where: { id },
    data: dadosAtualizados
  });
}

export async function deletarItem(id) { 
  const itemExistente = await prisma.itemDoRoteiro.findUnique({
    where: { id }
  });

  if (!itemExistente) {
    return null;
  }

  return prisma.itemDoRoteiro.delete({
    where: { id }
  });
} 