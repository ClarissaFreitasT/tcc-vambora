import * as DiaModel from "../models/dia.model.js";

export async function criarDia(req, res) {
  const { roteiroId, numeroDia, titulo } = req.body;

  if (!roteiroId) {
    return res.status(400).json({
      erro: "Roteiro obrigatório"
    });
  }

  if (!Number.isInteger(Number(numeroDia)) || Number(numeroDia) < 1) {
    return res.status(400).json({ erro: "Número do dia inválido" });
  }

  if (!await DiaModel.roteiroPertenceAoUsuario(roteiroId, req.user.id)) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  const dia = await DiaModel.criarDia(
    roteiroId,
    Number(numeroDia),
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

  const permitidos = {};
  if (dadosAtualizados.numeroDia !== undefined) permitidos.numeroDia = Number(dadosAtualizados.numeroDia);
  if (dadosAtualizados.titulo !== undefined) permitidos.titulo = dadosAtualizados.titulo || null;
  const diaAtualizado = await DiaModel.atualizarDia(id, permitidos, req.user.id);
  res.json(diaAtualizado);
}

export async function deletarDia(req, res) {
  const { id } = req.params;

  const diaDeletado = await DiaModel.deletarDia(id, req.user.id);

  if (!diaDeletado) {
    return res.status(404).json({
      erro: "Dia não encontrado"
    });
  }

  res.json(diaDeletado);
}

