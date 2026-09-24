import * as ItemModel from "../models/item.model.js";
import * as DiaModel from "../models/dia.model.js";
import * as RoteiroModel from "../models/roteiro.model.js";

function normalizarHorario(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return valor;
  if (/^\d{2}:\d{2}$/.test(valor)) {
    return new Date(`1970-01-01T${valor}:00.000Z`);
  }
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
    ordem,
  } = req.body;

  if (!diaId || typeof diaId !== "string") {
    return res.status(400).json({ erro: "Dia obrigatório" });
  }

  if (typeof titulo !== "string" || titulo.trim() === "") {
    return res.status(400).json({ erro: "Título obrigatório" });
  }

  const dia = await DiaModel.obterDiaPorId(diaId);

  if (!dia) {
    return res.status(404).json({ erro: "Dia não encontrado" });
  }

  const roteiro = await RoteiroModel.obterRoteiroPorId(dia.roteiroId);

  if (!roteiro) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  if (roteiro.usuarioId !== req.user.id) {
    return res.status(403).json({
      erro: "Você não tem permissão para adicionar um item a este roteiro",
    });
  }

  const item = await ItemModel.criarItem(
    diaId,
    titulo.trim(),
    descricao || null,
    localNome || null,
    custoEstimado === "" || custoEstimado === undefined
      ? null
      : Number(custoEstimado),
    normalizarHorario(horarioInicio),
    Number.isInteger(Number(ordem)) ? Number(ordem) : 0,
  );

  return res.status(201).json(item);
}

export async function listarItensDoDia(req, res) {
  const { diaId } = req.params;

  if (!diaId || typeof diaId !== "string") {
    return res.status(400).json({ erro: "ID do dia inválido" });
  }

  const itens = await ItemModel.listarItensDoDia(diaId);

  return res.status(200).json(itens);
}

export async function atualizarItem(req, res) {
  const { id } = req.params;
  const dadosAtualizados = { ...req.body };

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  if (dadosAtualizados.custoEstimado !== undefined) {
    dadosAtualizados.custoEstimado =
      dadosAtualizados.custoEstimado === ""
        ? null
        : Number(dadosAtualizados.custoEstimado);
  }

  if (dadosAtualizados.horarioInicio !== undefined) {
    if (dadosAtualizados.horarioInicio === "") {
      dadosAtualizados.horarioInicio = null;
    } else {
      dadosAtualizados.horarioInicio = normalizarHorario(
        dadosAtualizados.horarioInicio,
      );
    }
  }

  if (dadosAtualizados.ordem !== undefined) {
    dadosAtualizados.ordem = Number(dadosAtualizados.ordem);
  }

  const itemExistente = await ItemModel.obterItemPorId(id);

  if (!itemExistente) {
    return res.status(404).json({ erro: "Item não encontrado" });
  }

  const dia = await DiaModel.obterDiaPorId(itemExistente.diaId);

  if (!dia) {
    return res.status(404).json({ erro: "Dia não encontrado" });
  }

  const roteiro = await RoteiroModel.obterRoteiroPorId(dia.roteiroId);

  if (!roteiro) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  if (roteiro.usuarioId !== req.user.id) {
    return res.status(403).json({
      erro: "Você não tem permissão para atualizar este item",
    });
  }

  const itemAtualizado = await ItemModel.atualizarItem(
    id,
    dadosAtualizados,
    req.user.id,
  );

  if (!itemAtualizado) {
    return res.status(404).json({ erro: "Item não encontrado" });
  }

  return res.status(200).json(itemAtualizado);
}

export async function deletarItem(req, res) {
  const { id } = req.params;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ erro: "ID inválido" });
  }

  const itemExistente = await ItemModel.obterItemPorId(id);

  if (!itemExistente) {
    return res.status(404).json({ erro: "Item não encontrado" });
  }

  const dia = await DiaModel.obterDiaPorId(itemExistente.diaId);

  if (!dia) {
    return res.status(404).json({ erro: "Dia não encontrado" });
  }

  const roteiro = await RoteiroModel.obterRoteiroPorId(dia.roteiroId);

  if (!roteiro) {
    return res.status(404).json({ erro: "Roteiro não encontrado" });
  }

  if (roteiro.usuarioId !== req.user.id) {
    return res.status(403).json({
      erro: "Você não tem permissão para excluir este item",
    });
  }

  const itemDeletado = await ItemModel.deletarItem(id, req.user.id);

  if (!itemDeletado) {
    return res.status(404).json({ erro: "Item não encontrado" });
  }

  return res.status(200).json(itemDeletado);
}
