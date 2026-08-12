import { prisma } from "../config/prisma.js";

// Cria um novo item em um dia específico do roteiro.
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

// Lista todos os itens de um dia específico.
export async function listarItensDoDia(diaId) {
  return prisma.itemDoRoteiro.findMany({
    where: {
      diaId
    }
  });
}

// Atualiza as informações de um item existente.
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

// Remove um item do banco de dados pelo seu identificador.
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