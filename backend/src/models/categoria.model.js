import { prisma } from "../config/prisma.js";

export async function listarCategorias() {
  return prisma.categoria.findMany({
    orderBy: { nome: "asc" },
  });
}

export async function obterCategoriaPorId(id) {
  return prisma.categoria.findUnique({
    where: { id },
  });
}

export async function criarCategoria(nome) {
  return prisma.categoria.create({
    data: {
      nome,
    },
  });
}

export async function associarCategoriaAoRoteiro(roteiroId, categoriaId) {
  return prisma.roteiroCategoria.upsert({
    where: {
      roteiroId_categoriaId: {
        roteiroId,
        categoriaId,
      },
    },
    update: {},
    create: {
      roteiroId,
      categoriaId,
    },
  });
}

export async function removerCategoriaDoRoteiro(roteiroId, categoriaId) {
  return prisma.roteiroCategoria.delete({
    where: {
      roteiroId_categoriaId: {
        roteiroId,
        categoriaId,
      },
    },
  });
}
