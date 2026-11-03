import * as UsuarioModel from "../models/users.model.js";
import * as PublicacaoModel from "../models/publicacao.model.js";
import * as RoteiroModel from "../models/roteiro.model.js";
import {
  deleteManagedImage,
  managedObjectKey,
  uploadImage,
} from "../config/storage.js";

const extensionByMime = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const PERSONALIDADES_VALIDAS = new Set([
  "AVENTUREIRA",
  "CULTURAL",
  "FESTEIRA",
  "TRANQUILA",
]);

function normalizarPersonalidadeController(valor) {
  if (typeof valor !== "string") {
    return null;
  }

  const mapa = {
    AVENTUREIRA: "AVENTUREIRA",
    AVENTUREIRO: "AVENTUREIRA",
    CULTURAL: "CULTURAL",
    FESTEIRA: "FESTEIRA",
    FESTEIRO: "FESTEIRA",
    TRANQUILA: "TRANQUILA",
    TRANQUILO: "TRANQUILA",
  };

  const chave = valor.trim();
  if (!chave) {
    return null;
  }

  const valorNormalizado = mapa[chave.toUpperCase()] ?? null;
  if (!valorNormalizado || !PERSONALIDADES_VALIDAS.has(valorNormalizado)) {
    return null;
  }

  return valorNormalizado;
}

export async function listarUsuarios(req, res) {
  const usuarios =
    req.user?.role === "ADMIN"
      ? await UsuarioModel.obterTodosUsuarios()
      : await UsuarioModel.listarUsuariosComunidade(req.user?.id);

  res.json(usuarios);
}

export async function listarComunidade(req, res) {
  const usuarios = await UsuarioModel.listarUsuariosComunidade(req.user.id);
  return res.status(200).json(usuarios);
}

export async function obterMeuPerfil(req, res) {
  const usuario = await UsuarioModel.obterPerfilPorId(req.user.id, req.user.id);

  if (!usuario) {
    return res.status(404).json({ erro: "Usuário não encontrado" });
  }

  return res.status(200).json(usuario);
}

export async function listarCurtidasDoUsuario(req, res) {
  const [publicacoes, roteiros] = await Promise.all([
    PublicacaoModel.listarPublicacoesCurtidasUsuario(req.user.id),
    RoteiroModel.listarRoteirosCurtidosUsuario(req.user.id),
  ]);

  return res.status(200).json({ publicacoes, roteiros });
}

export async function atualizarMeuPerfil(req, res) {
  req.params.id = req.user.id;
  return atualizarUsuario(req, res);
}

export async function enviarFotoPerfil(req, res) {
  if (!req.file)
    return res.status(400).json({ erro: "Selecione uma imagem de perfil" });
  const usuarioAtual = await UsuarioModel.obterUsuarioComFoto(req.user.id);
  const key = managedObjectKey(
    "profiles/",
    extensionByMime[req.file.detectedType],
  );
  let novaUrl;
  try {
    novaUrl = await uploadImage({
      key,
      body: req.file.buffer,
      contentType: req.file.detectedType,
    });
    const atualizado = await UsuarioModel.atualizarFotoPerfil(
      req.user.id,
      usuarioAtual?.fotoUrl || null,
      novaUrl,
    );
    if (!atualizado) {
      await deleteManagedImage(novaUrl).catch(() => {});
      return res
        .status(409)
        .json({ erro: "A foto do perfil foi alterada. Tente novamente." });
    }
    if (
      usuarioAtual?.fotoUrl &&
      usuarioAtual.fotoUrl !== novaUrl &&
      !(await PublicacaoModel.imagemAindaReferenciada(usuarioAtual.fotoUrl))
    ) {
      await deleteManagedImage(usuarioAtual.fotoUrl).catch(() => {});
    }
    return res.status(200).json({ usuario: atualizado });
  } catch (error) {
    if (novaUrl) await deleteManagedImage(novaUrl).catch(() => {});
    throw error;
  }
}

export async function removerFotoPerfil(req, res) {
  const usuarioAtual = await UsuarioModel.obterUsuarioComFoto(req.user.id);
  if (!usuarioAtual)
    return res.status(404).json({ erro: "Usuário não encontrado" });
  const atualizado = await UsuarioModel.atualizarFotoPerfil(
    req.user.id,
    usuarioAtual.fotoUrl || null,
    null,
  );
  if (!atualizado)
    return res
      .status(409)
      .json({ erro: "A foto do perfil foi alterada. Tente novamente." });
  if (
    usuarioAtual.fotoUrl &&
    !(await PublicacaoModel.imagemAindaReferenciada(usuarioAtual.fotoUrl))
  ) {
    await deleteManagedImage(usuarioAtual.fotoUrl).catch(() => {});
  }
  return res.status(200).json({ usuario: atualizado });
}

export async function obterUsuario(req, res) {
  const { id } = req.params;

  const usuario = await UsuarioModel.obterUsuarioPorId(id);

  if (!usuario) {
    return res.status(404).json({
      erro: "Usuário não encontrado",
    });
  }

  res.json(usuario);
}

export async function obterUsuarioPorUsername(req, res) {
  const { username } = req.params;

  const usuario = await UsuarioModel.obterUsuarioPorUsername(
    username,
    req.user?.id,
  );

  if (!usuario) {
    return res.status(404).json({
      erro: "Perfil não encontrado",
    });
  }

  res.json(usuario);
}

export async function atualizarUsuario(req, res) {
  const { id } = req.params;
  const dadosAtualizados = { ...req.body };

  if (Object.hasOwn(dadosAtualizados, "personalidade")) {
    const personalidadeNormalizada = normalizarPersonalidadeController(
      dadosAtualizados.personalidade,
    );

    if (!personalidadeNormalizada) {
      return res.status(400).json({ erro: "Personalidade inválida" });
    }

    dadosAtualizados.personalidade = personalidadeNormalizada;
  }

  const usuarioAutenticado = req.user;

  if (
    !usuarioAutenticado ||
    (usuarioAutenticado.id !== id && usuarioAutenticado.role !== "ADMIN")
  ) {
    return res.status(403).json({
      erro: "Você não tem permissão para atualizar este perfil",
    });
  }

  const usuario = await UsuarioModel.atualizarUsuario(id, dadosAtualizados);

  if (!usuario) {
    return res.status(404).json({
      erro: "Usuário não encontrado",
    });
  }

  res.json({
    mensagem: "Usuário atualizado com sucesso",
    usuario,
  });
}

export async function deletarUsuario(req, res) {
  const { id } = req.params;
  const usuarioAutenticado = req.user;

  if (
    !usuarioAutenticado ||
    (usuarioAutenticado.id !== id && usuarioAutenticado.role !== "ADMIN")
  ) {
    return res.status(403).json({
      erro: "Você não tem permissão para excluir este usuário",
    });
  }

  const usuario = await UsuarioModel.deletarUsuario(id);

  if (!usuario) {
    return res.status(404).json({
      erro: "Usuário não encontrado",
    });
  }

  res.json({
    mensagem: "Usuário deletado com sucesso",
    usuario,
  });
}

export async function seguirUsuario(req, res) {
  const { id } = req.params;
  const usuarioAutenticado = req.user;

  if (!usuarioAutenticado) {
    return res.status(401).json({ erro: "Autenticação necessária" });
  }

  if (usuarioAutenticado.id === id) {
    return res.status(400).json({ erro: "Você não pode seguir a si mesmo" });
  }

  const usuarioAlvo = await UsuarioModel.obterUsuarioPorId(id);

  if (!usuarioAlvo) {
    return res.status(404).json({ erro: "Usuário não encontrado" });
  }

  const relacionamento = await UsuarioModel.seguirUsuario(
    usuarioAutenticado.id,
    id,
  );

  if (!relacionamento) {
    return res
      .status(400)
      .json({ erro: "Não foi possível seguir este usuário" });
  }

  return res.status(201).json({
    mensagem: "Usuário seguido com sucesso",
    relacionamento,
  });
}

export async function deixarDeSeguirUsuario(req, res) {
  const { id } = req.params;
  const usuarioAutenticado = req.user;

  if (!usuarioAutenticado) {
    return res.status(401).json({ erro: "Autenticação necessária" });
  }

  const relacionamentoExistente = await UsuarioModel.obterSeguidor(
    usuarioAutenticado.id,
    id,
  );

  if (!relacionamentoExistente) {
    return res
      .status(404)
      .json({ erro: "Relacionamento de seguir não encontrado" });
  }

  const relacionamento = await UsuarioModel.deixarDeSeguirUsuario(
    usuarioAutenticado.id,
    id,
  );

  return res.status(200).json({
    mensagem: "Relacionamento removido com sucesso",
    relacionamento,
  });
}

export async function listarSeguidores(req, res) {
  const { id } = req.params;

  const usuario = await UsuarioModel.obterUsuarioPorId(id);

  if (!usuario) {
    return res.status(404).json({ erro: "Usuário não encontrado" });
  }

  const seguidores = await UsuarioModel.listarSeguidores(id);

  return res.status(200).json(seguidores);
}

export async function listarSeguindo(req, res) {
  const { id } = req.params;

  const usuario = await UsuarioModel.obterUsuarioPorId(id);

  if (!usuario) {
    return res.status(404).json({ erro: "Usuário não encontrado" });
  }

  const seguindo = await UsuarioModel.listarSeguindo(id);

  return res.status(200).json(seguindo);
}
