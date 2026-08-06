import { prisma } from "../config/prisma.js";

// Retorna a lista completa de usuários cadastrados.
export async function obterTodosUsuarios() {
  return prisma.usuario.findMany();
}

// Busca um usuário pelo seu identificador único.
export async function obterUsuarioPorId(id) {
  return prisma.usuario.findUnique({
    where: { id }
  });
}

// Busca um usuário pelo endereço de e-mail.
export async function obterUsuarioPorEmail(email) {
  return prisma.usuario.findUnique({
    where: { email }
  });
}

// Cria um novo usuário no banco de dados, verificando se já existe um e-mail igual.
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

// Atualiza os dados de um usuário existente com as informações fornecidas.
export async function atualizarUsuario(id, dadosAtualizados) {
  const usuarioExistente = await prisma.usuario.findUnique({
    where: { id }
  });

  if (!usuarioExistente) {
    return null;
  }

  return prisma.usuario.update({
    where: { id },
    data: dadosAtualizados
  });
}

// Realiza a autenticação de um usuário verificando e-mail e senha.
export async function login(email, senha) {
  const usuario = await obterUsuarioPorEmail(email);

  if (!usuario) {
    return null;
  }

  if (usuario.senhaHash !== senha) {
    return null;
  }
  return usuario;
}

// Remove um usuário do banco de dados pelo seu identificador.
export async function deletarUsuario(id) {
  const usuarioExistente = await prisma.usuario.findUnique({
    where: { id }
  });

  if (!usuarioExistente) {
    return null;
  }
  return prisma.usuario.delete({
    where: {
      id
    }
  });
}