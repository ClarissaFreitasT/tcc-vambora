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