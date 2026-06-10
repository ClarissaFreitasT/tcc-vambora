import * as UsuarioModel from "../models/users.model.js";

export async function listarUsuarios(req, res) {
  const usuarios = await UsuarioModel.obterTodosUsuarios();

  res.json(usuarios);
}

export async function obterUsuario(req, res) {
  const { id } = req.params;

  const usuario = await UsuarioModel.obterUsuarioPorId(id);

  if (!usuario) {
    return res.status(404).json({
      erro: "Usuário não encontrado"
    });
  }

  res.json(usuario);
}

export async function cadastrarUsuario(req, res) {
  const {
    nome,
    email,
    senhaHash,
    fotoUrl,
    bio,
    personalidade,
    orcamentoPerfil
  } = req.body;

  if (!nome || !email || !senhaHash) {
    return res.status(400).json({
      erro: "Nome, email e senha são obrigatórios"
    });
  }

  const usuario = await UsuarioModel.criarUsuario(
    nome,
    email,
    senhaHash,
    fotoUrl,
    bio,
    personalidade,
    orcamentoPerfil
  );

  if (!usuario) {
    return res.status(409).json({
      erro: "Email já cadastrado"
    });
  }

  res.status(201).json({
    mensagem: "Usuário criado com sucesso",
    usuario
  });
}