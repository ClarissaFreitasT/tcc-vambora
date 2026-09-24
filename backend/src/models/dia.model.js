import { prisma } from "../config/prisma.js";

// Cria um novo dia dentro de um roteiro com número e título específicos.
export async function criarDia(roteiroId, numeroDia, titulo) {
  return prisma.diaDoRoteiro.create({
    data: {
      roteiroId,
      numeroDia,
      titulo
    }
  });
}

export async function roteiroPertenceAoUsuario(roteiroId, usuarioId) {
  const roteiro = await prisma.roteiro.findUnique({ where: { id: roteiroId }, select: { usuarioId: true } });
  return roteiro?.usuarioId === usuarioId;
}

// Lista todos os dias de um roteiro específico.
export async function listarDiasDoRoteiro(roteiroId) {
  return prisma.diaDoRoteiro.findMany({
    where: {
      roteiroId
    },
    include: { itens: { orderBy: { ordem: "asc" } } },
    orderBy: { numeroDia: "asc" }
  });
}

// Atualiza as informações de um dia existente.
export async function atualizarDia(id, dadosAtualizados, usuarioId) {
  const diaExistente = await prisma.diaDoRoteiro.findUnique({
    where: { id },
    include: { roteiro: true }
  });

  if (!diaExistente || diaExistente.roteiro.usuarioId !== usuarioId) {
    return null;
  }   

  return prisma.diaDoRoteiro.update({
    where: { id },
    data: dadosAtualizados
  });
}

// Remove um dia do banco de dados pelo seu identificador.
export async function deletarDia(id, usuarioId) {
  const diaExistente = await prisma.diaDoRoteiro.findUnique({
    where: { id },
    include: { roteiro: true }
  });

  if (!diaExistente || diaExistente.roteiro.usuarioId !== usuarioId) {
    return null;
  }

  return prisma.diaDoRoteiro.delete({
    where: { id }
  });
}
