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

export async function listarDiasDoRoteiro(req, res) {
  const { roteiroId } = req.params; 

  const dias = await DiaModel.listarDiasDoRoteiro(roteiroId);

  res.json(dias);
}   

export async function atualizarDia(req, res) {
  const { id } = req.params;
  const dadosAtualizados = req.body;    

  const diaAtualizado = await DiaModel.atualizarDia(id, dadosAtualizados);  
  res.json(diaAtualizado);
}

export async function deletarDia(req, res) {
  const { id } = req.params;

  const diaDeletado = await DiaModel.deletarDia(id);

  if (!diaDeletado) {
    return res.status(404).json({
      erro: "Dia não encontrado"
    });
  }

  res.json(diaDeletado);
}

