import * as ItemModel from "../models/item.model.js";

export async function criarItem(req, res) {
  const {
    diaId,
    titulo,
    descricao,
    localNome
  } = req.body;

  if (!diaId || !titulo) {
    return res.status(400).json({
      erro: "Dados obrigatórios"
    });
  }

  const item = await ItemModel.criarItem(
    diaId,
    titulo,
    descricao,
    localNome
  );

  res.status(201).json(item);
}

export async function listarItensDoDia(req, res) {
  const { diaId } = req.params;

  const itens = await ItemModel.listarItensDoDia(diaId);

  res.status(200).json(itens);
}

export async function atualizarItem(req, res) {
  const { id } = req.params;
  const dadosAtualizados = req.body;

  const itemAtualizado = await ItemModel.atualizarItem(id, dadosAtualizados);

  if (!itemAtualizado) {
    return res.status(404).json({
      erro: "Item não encontrado"
    });
  } 

  res.status(200).json(itemAtualizado);
}

export async function deletarItem(req, res) {
  const { id } = req.params;
  const itemDeletado = await ItemModel.deletarItem(id);

  if (!itemDeletado) {
    return res.status(404).json({
      erro: "Item não encontrado"
    });
  }

  res.status(200).json(itemDeletado);
}
