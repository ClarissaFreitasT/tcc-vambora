import { prisma } from "../config/prisma.js";

const camposUsuarioPublicos = {
  id: true,
  nome: true,
  email: true,
  role: true,
  fotoUrl: true,
  bio: true,
  personalidade: true,
  criadoEm: true,
};

// Retorna a lista completa de usuários cadastrados.
export async function obterTodosUsuarios() {
  return prisma.usuario.findMany({ select: camposUsuarioPublicos });
}

// Busca um usuário pelo seu identificador único.
export async function obterUsuarioPorId(id) {
  return prisma.usuario.findUnique({
    where: { id },
    select: camposUsuarioPublicos,
  });
}

// Busca um usuário pelo endereço de e-mail.
export async function obterUsuarioPorEmail(email) {
  return prisma.usuario.findUnique({
    where: { email },
  });
}

// Atualiza os dados de um usuário existente com as informações fornecidas.
export async function atualizarUsuario(id, dadosAtualizados) {
  const usuarioExistente = await prisma.usuario.findUnique({
    where: { id },
  });

  if (!usuarioExistente) {
    return null;
  }

  const camposProtegidos = new Set(["role", "senhaHash"]);
  const dadosPermitidos = Object.fromEntries(
    Object.entries(dadosAtualizados).filter(
      ([campo]) => !camposProtegidos.has(campo),
    ),
  );

  return prisma.usuario.update({
    where: { id },
    data: dadosPermitidos,
    select: camposUsuarioPublicos,
  });
}

// Remove um usuário do banco de dados pelo seu identificador.
export async function deletarUsuario(id) {
  const usuarioExistente = await prisma.usuario.findUnique({
    where: { id },
  });

  if (!usuarioExistente) {
    return null;
  }
  return prisma.usuario.delete({
    where: {
      id,
    },
    select: camposUsuarioPublicos,
  });
}
