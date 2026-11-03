export function dataViagem(value) {
  return value ? value.slice(0, 10).split("-").reverse().join("/") : "";
}
export function dataDoDia(dataIda, indice) {
  const date = new Date(`${dataIda.slice(0, 10)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + indice);
  return dataViagem(date.toISOString());
}
export function distribuicao(proposta) {
  return (proposta?.cidades || []).map((cidade, indice) => {
    const label = cidade.regiao
      ? `${cidade.nome}, ${cidade.regiao}, ${cidade.pais}`
      : `${cidade.nome}, ${cidade.pais}`;
    return {
      ...cidade,
      dias: (proposta?.dias || []).filter(
        (dia) => dia.cidadeIndice === indice || dia.cidadePrincipal === label,
      ).length,
    };
  });
}
export function mudancasViagem(antes, depois) {
  if (!antes || !depois) return [];
  const mudancas = [];
  if (JSON.stringify(antes.cidades) !== JSON.stringify(depois.cidades))
    mudancas.push("Cidades ou ordem de visita alteradas");
  if (
    antes.dataIda?.slice(0, 10) !== depois.dataIda ||
    antes.dataVolta?.slice(0, 10) !== depois.dataVolta
  )
    mudancas.push(
      `Novas datas: ${dataViagem(depois.dataIda)} a ${dataViagem(depois.dataVolta)}`,
    );
  return mudancas;
}
export function validarFormularioIa(form) {
  if (
    !Array.isArray(form.cidades) ||
    !form.cidades.length ||
    form.cidades.length > 10 ||
    form.cidades.some((c) => !c.nome?.trim() || !c.pais?.trim())
  )
    return "Preencha nome e país de todas as cidades.";
  const dias =
    (Date.parse(form.dataVolta) - Date.parse(form.dataIda)) / 86400000 + 1;
  if (!Number.isFinite(dias) || dias < form.cidades.length || dias > 30)
    return "Escolha até 30 dias de viagem, com pelo menos um dia por cidade.";
  return null;
}
