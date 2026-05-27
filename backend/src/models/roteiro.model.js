import { prisma } from "../config/prisma.js";

export async function obterTodasRoteiros() {
  return prisma.roteiro.findMany();
}

export async function obterRoteiroPorId(id) {
  return prisma.roteiro.findUnique({
    where: { id }
  });
}

export async function criarNovoRoteiro(nome, data, genero, lugares = null) {
  return prisma.roteiro.create({
    data: {
      nome,
      data,
      genero,
      lugares
    }
  });
}

export async function atualizarRoteiro(id, nome, data, genero, lugares) {
  const roteiroExistente = await prisma.roteiro.findUnique({
    where: { id }
  });

  if (!roteiroExistente) {
    return null;
  }

  return prisma.roteiro.update({
    where: { id },
    data: {
      nome: nome ?? roteiroExistente.nome,
      data: data ?? roteiroExistente.data,
      genero: genero ?? roteiroExistente.genero,
      lugares: lugares ?? roteiroExistente.lugares
    }
  });
}

export async function excluirRoteiro(id) {
  const roteiroExistente = await prisma.roteiro.findUnique({
    where: { id }
  });

  if (!roteiroExistente) {
    return null;
  }

  return prisma.roteiro.delete({
    where: { id }
  });
}

