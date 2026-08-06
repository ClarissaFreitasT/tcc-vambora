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

export async function criarUsuario(req, res) {
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

export async function atualizarUsuario(req, res) {
  const { id } = req.params;
  const dadosAtualizados = req.body;

  const usuario = await UsuarioModel.atualizarUsuario(id, dadosAtualizados);

  if (!usuario) {
    return res.status(404).json({
      erro: "Usuário não encontrado"
    });
  }

  res.json({
    mensagem: "Usuário atualizado com sucesso",
    usuario
  });
}

export async function login(req, res) {
  const { email, senha } = req.body;  

  const usuario = await UsuarioModel.login(email, senha);

  if (!usuario) {
    return res.status(401).json({
      erro: "Email ou senha inválidos"
    });
  } 

  res.json({
    mensagem: "Login realizado com sucesso",
    usuario
  });
}

export async function deletarUsuario(req, res) {
  const { id } = req.params;  

  const usuario = await UsuarioModel.deletarUsuario(id);

  if (!usuario) {
    return res.status(404).json({
      erro: "Usuário não encontrado"
    });
  }

  res.json({
    mensagem: "Usuário deletado com sucesso",
    usuario
  });
}