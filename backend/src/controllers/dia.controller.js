import * as DiaModel from "../models/dia.model.js";

export async function criarDia(req, res) {
  const { roteiroId, numeroDia, titulo } = req.body;

  if (!roteiroId) {
    return res.status(400).json({
      erro: "Roteiro obrigatório"
    });
  }

  const dia = await DiaModel.criarDia(
    roteiroId,
    numeroDia,
    titulo
  );

  res.status(201).json(dia);
}