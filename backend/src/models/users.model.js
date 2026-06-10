import { prisma } from "../config/prisma.js";

export async function obterTodosUsuarios() {
  return prisma.usuario.findMany();
}

export async function obterUsuarioPorId(id) {
  return prisma.usuario.findUnique({
    where: { id }
  });
}

export async function obterUsuarioPorEmail(email) {
  return prisma.usuario.findUnique({
    where: { email }
  });
}

export async function criarUsuario(
  nome,
  email,
  senhaHash,
  fotoUrl,
  bio,
  personalidade,
  orcamentoPerfil
) {
  const usuarioExistente = await obterUsuarioPorEmail(email);

  if (usuarioExistente) {
    return null;
  }

  return prisma.usuario.create({
    data: {
      nome,
      email,
      senhaHash,
      fotoUrl,
      bio,
      personalidade,
      orcamentoPerfil
    }
  });
}

