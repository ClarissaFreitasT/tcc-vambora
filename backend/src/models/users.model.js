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

export function normalizarPersonalidade(personalidade) {
  if (typeof personalidade !== "string") {
    return null;
  }

  const valor = personalidade.trim();
  if (!valor) {
    return null;
  }

  const mapa = {
    AVENTUREIRA: "AVENTUREIRA",
    AVENTUREIRO: "AVENTUREIRA",
    AVENTUREIRA: "AVENTUREIRA",
    CULTURAL: "CULTURAL",
    CULTURAL: "CULTURAL",
    FESTEIRA: "FESTEIRA",
    FESTEIRO: "FESTEIRA",
    TRANQUILA: "TRANQUILA",
    TRANQUILO: "TRANQUILA",
  };

  const chave = valor.toUpperCase();
  return mapa[chave] ?? null;
}

// Retorna a lista completa de usuários cadastrados para uso administrativo.
export async function obterTodosUsuarios() {
  return prisma.usuario.findMany({ select: camposUsuarioAdmin });
}

export async function listarUsuariosComunidade(usuarioId) {
  const usuarios = await prisma.usuario.findMany({
    where: usuarioId ? { id: { not: usuarioId } } : {},
    select: {
      ...camposUsuarioPublicos,
      ...(usuarioId
        ? {
            seguidores: {
              where: { seguidorId: usuarioId },
              select: { id: true },
            },
          }
        : {}),
      _count: {
        select: {
          seguidores: true,
          publicacoes: true,
        },
      },
    },
    orderBy: { nome: "asc" },
  });

  return usuarios.map(({ seguidores = [], _count, ...usuario }) => ({
    ...usuario,
    seguindo: seguidores.length > 0,
    totalSeguidores: _count.seguidores,
    totalPublicacoes: _count.publicacoes,
  }));
}

// Busca um usuário pelo seu identificador único.
export async function obterUsuarioPorId(id) {
  return prisma.usuario.findUnique({
    where: { id },
    select: camposUsuarioPublicos,
  });
}

export async function obterPerfilPorId(id, viewerId = null) {
  const usuario = await prisma.usuario.findUnique({
    where: { id },
    select: {
      ...camposUsuarioPublicos,
      ...(viewerId
        ? {
            seguidores: {
              where: { seguidorId: viewerId },
              select: { id: true },
            },
          }
        : {}),
      _count: {
        select: {
          seguidores: true,
          seguindo: true,
          publicacoes: true,
        },
      },
    },
  });

  if (!usuario) return null;
  const { seguidores = [], _count, ...perfil } = usuario;
  return {
    ...perfil,
    seguindo: seguidores.length > 0,
    totalSeguidores: _count.seguidores,
    totalSeguindo: _count.seguindo,
    totalPublicacoes: _count.publicacoes,
  };
}

// Busca um usuário pelo username no perfil público.
export async function obterUsuarioPorUsername(username, viewerId = null) {
  const usernameNormalizado = normalizarUsername(username);

  if (!usernameNormalizado) {
    return null;
  }

  const usuario = await prisma.usuario.findUnique({
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
      ...(viewerId
        ? {
            seguidores: {
              where: { seguidorId: viewerId },
              select: { id: true },
            },
          }
        : {}),
      _count: {
        select: {
          seguidores: true,
          seguindo: true,
          publicacoes: true,
        },
      },
    },
  });

  if (!usuario) return null;
  const { seguidores = [], _count, ...perfil } = usuario;
  return {
    ...perfil,
    seguindo: seguidores.length > 0,
    totalSeguidores: _count.seguidores,
    totalSeguindo: _count.seguindo,
    totalPublicacoes: _count.publicacoes,
  };
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

  if (Object.hasOwn(dadosPermitidos, "personalidade")) {
    const personalidadeNormalizada = normalizarPersonalidade(
      dadosPermitidos.personalidade,
    );

    if (!personalidadeNormalizada) {
      return null;
    }

    dadosPermitidos.personalidade = personalidadeNormalizada;
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
