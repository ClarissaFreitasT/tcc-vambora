import { prisma } from "../config/prisma.js";

export async function criarDia(roteiroId, numeroDia, titulo) {
  return prisma.diaDoRoteiro.create({
    data: {
      roteiroId,
      numeroDia,
      titulo
    }
  });
}

export async function listarDiasDoRoteiro(roteiroId) {
  return prisma.diaDoRoteiro.findMany({
    where: {
      roteiroId
    }
  });
}

export async function atualizarDia(id, dadosAtualizados) {
  const diaExistente = await prisma.diaDoRoteiro.findUnique({
    where: { id }
  });

  if (!diaExistente) {
    return null;
  }   

  return prisma.diaDoRoteiro.update({
    where: { id },
    data: dadosAtualizados
  });
} 


export async function deletarDia(id) {
  const diaExistente = await prisma.diaDoRoteiro.findUnique({
    where: { id }
  });

  if (!diaExistente) {
    return null;
  }

  return prisma.diaDoRoteiro.delete({
    where: { id }
  });
}
