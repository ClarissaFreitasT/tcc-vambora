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