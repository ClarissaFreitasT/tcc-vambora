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