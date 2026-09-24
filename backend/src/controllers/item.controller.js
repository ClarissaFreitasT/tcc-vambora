import * as ItemModel from "../models/item.model.js";

function normalizarHorario(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  if (/^\d{2}:\d{2}$/.test(valor)) return new Date(`1970-01-01T${valor}:00.000Z`);
  return valor;
}

export async function criarItem(req, res) {
  const {
    diaId,
    titulo,
    descricao,
    localNome,
    custoEstimado,
    horarioInicio,
    ordem
  } = req.body;

  if (!diaId || typeof titulo !== "string" || !titulo.trim()) {
    return res.status(400).json({
      erro: "Dados obrigatórios"
    });
  }

  if (!await ItemModel.diaPertenceAoUsuario(diaId, req.user.id)) {
    return res.status(404).json({ erro: "Dia não encontrado" });
  }

  const item = await ItemModel.criarItem(diaId, {
    titulo: titulo.trim(),
    descricao: descricao || null,
    localNome: localNome || null,
    custoEstimado: custoEstimado === "" || custoEstimado === undefined ? null : Number(custoEstimado),
    horarioInicio: normalizarHorario(horarioInicio),
    ordem: Number.isInteger(Number(ordem)) ? Number(ordem) : 0
  });

  res.status(201).json(item);
}

export async function listarItensDoDia(req, res) {
  const { diaId } = req.params;

  const itens = await ItemModel.listarItensDoDia(diaId);

  res.status(200).json(itens);
}

export async function atualizarItem(req, res) {
  const { id } = req.params;
  const dadosAtualizados = { ...req.body };
  if (dadosAtualizados.custoEstimado !== undefined) {
    dadosAtualizados.custoEstimado = dadosAtualizados.custoEstimado === "" ? null : Number(dadosAtualizados.custoEstimado);
  }
  if (dadosAtualizados.horarioInicio !== undefined && dadosAtualizados.horarioInicio === "") {
    dadosAtualizados.horarioInicio = null;
  } else if (dadosAtualizados.horarioInicio !== undefined) {
    dadosAtualizados.horarioInicio = normalizarHorario(dadosAtualizados.horarioInicio);
  }
  if (dadosAtualizados.ordem !== undefined) dadosAtualizados.ordem = Number(dadosAtualizados.ordem);

  const itemAtualizado = await ItemModel.atualizarItem(id, dadosAtualizados, req.user.id);

  if (!itemAtualizado) {
    return res.status(404).json({
      erro: "Item não encontrado"
    });
  } 

  res.status(200).json(itemAtualizado);
}

export async function deletarItem(req, res) {
  const { id } = req.params;
  const itemDeletado = await ItemModel.deletarItem(id, req.user.id);

  if (!itemDeletado) {
    return res.status(404).json({
      erro: "Item não encontrado"
    });
  }

  res.status(200).json(itemDeletado);
}
