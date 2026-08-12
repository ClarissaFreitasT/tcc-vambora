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

// Lista todos os dias de um roteiro específico.
export async function listarDiasDoRoteiro(roteiroId) {
  return prisma.diaDoRoteiro.findMany({
    where: {
      roteiroId
    }
  });
}

// Atualiza as informações de um dia existente.
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

// Remove um dia do banco de dados pelo seu identificador.
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
