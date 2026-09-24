import * as DiaModel from "../models/dia.model.js";
import * as RoteiroModel from "../models/roteiro.model.js";

export async function criarDia(req, res) {
  const { roteiroId, numeroDia, titulo } = req.body;

  if (!roteiroId || typeof roteiroId !== "string") {
    return res.status(400).json({ erro: "Roteiro obrigatório" });
  }

  if (numeroDia === undefined || numeroDia === null) {
    return res.status(400).json({ erro: "Número do dia obrigatório" });
  }

  const roteiro = await RoteiroModel.obterRoteiroPorId(roteiroId);

  if (!roteiro) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  if (roteiro.usuarioId !== req.user.id) {
    return res.status(403).json({
      erro: "Você não tem permissão para adicionar um dia a este roteiro",
    });
  }

  if (!Number.isInteger(Number(numeroDia)) || Number(numeroDia) < 1) {
    return res.status(400).json({ erro: "Número do dia inválido" });
  }

  const dia = await DiaModel.criarDia(roteiroId, Number(numeroDia), titulo);

  return res.status(201).json(dia);
}

export async function listarDiasDoRoteiro(req, res) {
  const { roteiroId } = req.params;

  if (!roteiroId || typeof roteiroId !== "string") {
    return res.status(400).json({ erro: "ID do roteiro inválido" });
  }

  const dias = await DiaModel.listarDiasDoRoteiro(roteiroId);

  return res.json(dias);
}

export async function atualizarDia(req, res) {
  const { id } = req.params;
  const dadosAtualizados = req.body;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  const diaExistente = await DiaModel.obterDiaPorId(id);

  if (!diaExistente) {
    return res.status(404).json({ erro: "Dia não encontrado" });
  }

  const roteiro = await RoteiroModel.obterRoteiroPorId(diaExistente.roteiroId);

  if (!roteiro || roteiro.usuarioId !== req.user.id) {
    return res.status(403).json({
      erro: "Você não tem permissão para atualizar este dia",
    });
  }

  const diaAtualizado = await DiaModel.atualizarDia(id, dadosAtualizados);

  return res.json(diaAtualizado);
}

export async function deletarDia(req, res) {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  const diaExistente = await DiaModel.obterDiaPorId(id);

  if (!diaExistente) {
    return res.status(404).json({ erro: "Dia não encontrado" });
  }

  const roteiro = await RoteiroModel.obterRoteiroPorId(diaExistente.roteiroId);

  if (!roteiro || roteiro.usuarioId !== req.user.id) {
    return res.status(403).json({
      erro: "Você não tem permissão para excluir este dia",
    });
  }

  const diaDeletado = await DiaModel.deletarDia(id);

  return res.json(diaDeletado);
}
