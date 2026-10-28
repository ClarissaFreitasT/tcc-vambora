import { prisma } from "../config/prisma.js";

// Lock the parent first, in the same transaction as every manual child mutation.
export function comRevisao(roteiroId, alterar) {
  return prisma.$transaction(async (tx) => {
    await tx.roteiro.update({ where: { id: roteiroId }, data: { revisao: { increment: 1 } } });
    return alterar(tx);
  });
}

export function camposPermitidos(dados, nomes) {
  return Object.fromEntries(nomes.filter((nome) => dados[nome] !== undefined).map((nome) => [nome, dados[nome]]));
}
