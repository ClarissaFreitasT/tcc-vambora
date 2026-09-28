export function buildRoteiroPayload(form) {
  return {
    titulo: String(form.titulo || "").trim(),
    destino: String(form.destino || "").trim(),
    descricao: String(form.descricao || "").trim(),
    orcamento:
      form.orcamento === "" ||
      form.orcamento === null ||
      form.orcamento === undefined
        ? null
        : Number(form.orcamento),
    publico: Boolean(form.publico),
  };
}

export function serializeDiaPayload(dia) {
  return {
    numeroDia: Number(dia.numeroDia),
    titulo: String(dia.titulo || "").trim() || `Dia ${Number(dia.numeroDia)}`,
  };
}

export function serializeItemPayload(item, ordem = 0) {
  return {
    titulo: String(item.titulo || "").trim(),
    descricao: String(item.descricao || "").trim(),
    localNome: String(item.localNome || "").trim(),
    horarioInicio: item.horarioInicio || null,
    custoEstimado:
      item.custoEstimado === "" ||
      item.custoEstimado === null ||
      item.custoEstimado === undefined
        ? null
        : Number(item.custoEstimado),
    ordem: Number(ordem),
  };
}
