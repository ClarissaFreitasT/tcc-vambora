import { prisma } from "../config/prisma.js";
import { comRevisao, camposPermitidos } from "./roteiro-revisao.js";

// Cria um novo dia dentro de um roteiro com número e título específicos.
export async function criarDia(roteiroId, numeroDia, titulo) {
  return comRevisao(roteiroId, (tx) => tx.diaDoRoteiro.create({
    data: {
      roteiroId,
      numeroDia,
      titulo,
    },
  }));
}

// Lista todos os dias de um roteiro específico.
export async function listarDiasDoRoteiro(roteiroId) {
  return prisma.diaDoRoteiro.findMany({
    where: {
      roteiroId,
    },
    include: {
      itens: {
        orderBy: {
          ordem: "asc",
        },
      },
    },
    orderBy: {
      numeroDia: "asc",
    },
  });
}

// Busca um dia específico pelo ID.
export async function obterDiaPorId(id) {
  return prisma.diaDoRoteiro.findUnique({
    where: { id },
  });
}

// Atualiza as informações de um dia existente.
export async function atualizarDia(id, dadosAtualizados, usuarioId) {
  const diaExistente = await prisma.diaDoRoteiro.findUnique({
    where: { id },
    include: { roteiro: true },
  });

  if (!diaExistente || diaExistente.roteiro.usuarioId !== usuarioId) {
    return null;
  }

  return comRevisao(diaExistente.roteiroId, (tx) => tx.diaDoRoteiro.update({
    where: { id },
    data: camposPermitidos(dadosAtualizados, ["titulo", "numeroDia"]),
  }));
}

// Remove um dia do banco de dados pelo seu identificador.
export async function deletarDia(id, usuarioId) {
  const diaExistente = await prisma.diaDoRoteiro.findUnique({
    where: { id },
    include: { roteiro: true },
  });

  if (!diaExistente || diaExistente.roteiro.usuarioId !== usuarioId) {
    return null;
  }

  return comRevisao(diaExistente.roteiroId, (tx) => tx.diaDoRoteiro.delete({
    where: { id },
  }));
}
