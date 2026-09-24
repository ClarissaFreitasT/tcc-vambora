import { prisma } from "../config/prisma.js";

export async function obterItemPorId(id) {
  return prisma.itemDoRoteiro.findUnique({
    where: { id },
  });
}

// Cria um novo item em um dia específico do roteiro.
export async function criarItem(
  diaId,
  titulo,
  descricao = null,
  localNome = null,
  custoEstimado = null,
  horarioInicio = null,
  ordem = 0,
) {
  return prisma.itemDoRoteiro.create({
    data: {
      diaId,
      titulo,
      descricao,
      localNome,
      custoEstimado,
      horarioInicio,
      ordem,
    },
  });
}

// Lista todos os itens de um dia específico.
export async function listarItensDoDia(diaId) {
  return prisma.itemDoRoteiro.findMany({
    where: {
      diaId,
    },
    orderBy: {
      ordem: "asc",
    },
  });
}

// Atualiza as informações de um item existente.
export async function atualizarItem(id, dadosAtualizados, usuarioId) {
  const itemExistente = await prisma.itemDoRoteiro.findUnique({
    where: { id },
    include: {
      dia: {
        include: {
          roteiro: true,
        },
      },
    },
  });

  if (!itemExistente || itemExistente.dia.roteiro.usuarioId !== usuarioId) {
    return null;
  }

  return prisma.itemDoRoteiro.update({
    where: { id },
    data: dadosAtualizados,
  });
}

// Remove um item do banco de dados pelo seu identificador.
export async function deletarItem(id, usuarioId) {
  const itemExistente = await prisma.itemDoRoteiro.findUnique({
    where: { id },
    include: {
      dia: {
        include: {
          roteiro: true,
        },
      },
    },
  });

  if (!itemExistente || itemExistente.dia.roteiro.usuarioId !== usuarioId) {
    return null;
  }

  return prisma.itemDoRoteiro.delete({
    where: { id },
  });
}
