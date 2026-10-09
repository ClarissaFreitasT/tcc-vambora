import * as CategoriaModel from "../models/categoria.model.js";
import * as RoteiroModel from "../models/roteiro.model.js";

export async function listarCategorias(req, res) {
  const categorias = await CategoriaModel.listarCategorias();

  return res.status(200).json(categorias);
}

export async function criarCategoria(req, res) {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ erro: "Acesso restrito a administradores" });
  }

  const { nome } = req.body;

  if (typeof nome !== "string" || nome.trim() === "") {
    return res.status(400).json({ erro: "Nome da categoria é obrigatório" });
  }

  try {
    const categoria = await CategoriaModel.criarCategoria(nome.trim());

    return res.status(201).json({
      mensagem: "Categoria criada com sucesso",
      categoria,
    });
  } catch (error) {
    console.error("Erro ao criar categoria:", error);

    return res.status(500).json({
      erro: "Não foi possível criar a categoria",
      detalhe: error.message,
    });
  }
}

export async function associarCategoriaAoRoteiro(req, res) {
  const { id, categoriaId } = req.params;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID do roteiro inválido" });
  }

  if (!categoriaId || typeof categoriaId !== "string") {
    return res.status(400).json({ erro: "ID da categoria inválido" });
  }

  const roteiro = await RoteiroModel.obterRoteiroPorId(id);

  if (!roteiro) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  if (roteiro.usuarioId !== req.user.id) {
    return res.status(403).json({
      erro: "Você não tem permissão para alterar este roteiro",
    });
  }

  const categoria = await CategoriaModel.obterCategoriaPorId(categoriaId);

  if (!categoria) {
    return res.status(404).json({ erro: "Categoria não encontrada" });
  }

  const associacao = await CategoriaModel.associarCategoriaAoRoteiro(
    id,
    categoriaId,
  );

  return res.status(201).json({
    mensagem: "Categoria associada ao roteiro com sucesso",
    associacao,
  });
}

export async function removerCategoriaDoRoteiro(req, res) {
  const { id, categoriaId } = req.params;

  const roteiro = await RoteiroModel.obterRoteiroPorId(id);

  if (!roteiro) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  if (roteiro.usuarioId !== req.user.id) {
    return res.status(403).json({
      erro: "Você não tem permissão para alterar este roteiro",
    });
  }

  const associacao = await CategoriaModel.removerCategoriaDoRoteiro(
    id,
    categoriaId,
  );

  return res.status(200).json({
    mensagem: "Categoria removida do roteiro com sucesso",
    associacao,
  });
}
