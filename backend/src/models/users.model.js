import { prisma } from "../config/prisma.js";

const camposUsuarioAdmin = {
  id: true,
  nome: true,
  email: true,
  username: true,
  role: true,
  fotoUrl: true,
  bio: true,
  personalidade: true,
  criadoEm: true,
};

const camposUsuarioPublicos = {
  id: true,
  nome: true,
  username: true,
  fotoUrl: true,
  bio: true,
  personalidade: true,
  criadoEm: true,
};

function normalizarUsername(username) {
  if (typeof username !== "string") return null;

  const valorNormalizado = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");
  return valorNormalizado || null;
}

// Retorna a lista completa de usuários cadastrados para uso administrativo.
export async function obterTodosUsuarios() {
  return prisma.usuario.findMany({ select: camposUsuarioAdmin });
}

// Busca um usuário pelo seu identificador único.
export async function obterUsuarioPorId(id) {
  return prisma.usuario.findUnique({
    where: { id },
    select: camposUsuarioPublicos,
  });
}

// Busca um usuário pelo username no perfil público.
export async function obterUsuarioPorUsername(username) {
  const usernameNormalizado = normalizarUsername(username);

  if (!usernameNormalizado) {
    return null;
  }

  return prisma.usuario.findUnique({
    where: { username: usernameNormalizado },
    select: {
      ...camposUsuarioPublicos,
      roteiros: {
        where: { publico: true },
        select: {
          id: true,
          titulo: true,
          descricao: true,
          destino: true,
          criadoEm: true,
        },
        orderBy: { criadoEm: "desc" },
      },
      publicacoes: {
        select: {
          id: true,
          texto: true,
          criadoEm: true,
        },
        orderBy: { criadoEm: "desc" },
      },
    },
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

  const camposProtegidos = new Set(["email", "role", "senhaHash"]);
  const dadosPermitidos = Object.fromEntries(
    Object.entries(dadosAtualizados).filter(
      ([campo]) => !camposProtegidos.has(campo),
    ),
  );

  if (Object.hasOwn(dadosPermitidos, "username")) {
    const usernameNormalizado = normalizarUsername(dadosPermitidos.username);

    if (!usernameNormalizado) {
      return null;
    }

    const usuarioComUsername = await prisma.usuario.findUnique({
      where: { username: usernameNormalizado },
    });

    if (usuarioComUsername && usuarioComUsername.id !== id) {
      return null;
    }

    dadosPermitidos.username = usernameNormalizado;
  }

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
    select: camposUsuarioAdmin,
  });
}

export async function obterSeguidor(seguidorId, seguidoId) {
  return prisma.seguidor.findUnique({
    where: {
      seguidorId_seguidoId: {
        seguidorId,
        seguidoId,
      },
    },
  });
}

export async function seguirUsuario(seguidorId, seguidoId) {
  if (seguidorId === seguidoId) {
    return null;
  }

  const relacionamentoExistente = await prisma.seguidor.findUnique({
    where: {
      seguidorId_seguidoId: {
        seguidorId,
        seguidoId,
      },
    },
  });

  if (relacionamentoExistente) {
    return relacionamentoExistente;
  }

  return prisma.seguidor.create({
    data: {
      seguidorId,
      seguidoId,
    },
  });
}

export async function deixarDeSeguirUsuario(seguidorId, seguidoId) {
  return prisma.seguidor.delete({
    where: {
      seguidorId_seguidoId: {
        seguidorId,
        seguidoId,
      },
    },
  });
}

export async function listarSeguidores(id) {
  return prisma.seguidor.findMany({
    where: { seguidoId: id },
    include: {
      seguidor: {
        select: camposUsuarioPublicos,
      },
    },
  });
}

export async function listarSeguindo(id) {
  return prisma.seguidor.findMany({
    where: { seguidorId: id },
    include: {
      seguido: {
        select: camposUsuarioPublicos,
      },
    },
  });
}

export async function contarSeguidores(id) {
  return prisma.seguidor.count({
    where: { seguidoId: id },
  });
}

export async function contarSeguindo(id) {
  return prisma.seguidor.count({
    where: { seguidorId: id },
  });
}
