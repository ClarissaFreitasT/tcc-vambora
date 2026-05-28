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