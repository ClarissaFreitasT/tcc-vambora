import { prisma } from "../config/prisma.js";

// Cria um novo item em um dia específico do roteiro.
export async function criarItem(diaId, dados) {
  return prisma.itemDoRoteiro.create({
    data: { diaId, ...dados }
  });
}

export async function diaPertenceAoUsuario(diaId, usuarioId) {
  const item = await prisma.diaDoRoteiro.findUnique({
    where: { id: diaId },
    include: { roteiro: { select: { usuarioId: true } } }
  });
  return item?.roteiro.usuarioId === usuarioId;
}

// Lista todos os itens de um dia específico.
export async function listarItensDoDia(diaId) {
  return prisma.itemDoRoteiro.findMany({
    where: {
      diaId
    }
  });
}

// Atualiza as informações de um item existente.
export async function atualizarItem(id, dadosAtualizados, usuarioId) {
  const itemExistente = await prisma.itemDoRoteiro.findUnique({
    where: { id },
    include: { dia: { include: { roteiro: true } } }
  });

  if (!itemExistente || itemExistente.dia.roteiro.usuarioId !== usuarioId) {
    return null;
  }

  return prisma.itemDoRoteiro.update({
    where: { id },
    data: dadosAtualizados
  });
}

// Remove um item do banco de dados pelo seu identificador.
export async function deletarItem(id, usuarioId) { 
  const itemExistente = await prisma.itemDoRoteiro.findUnique({
    where: { id },
    include: { dia: { include: { roteiro: true } } }
  });

  if (!itemExistente || itemExistente.dia.roteiro.usuarioId !== usuarioId) {
    return null;
  }

  return prisma.itemDoRoteiro.delete({
    where: { id }
  });
} 