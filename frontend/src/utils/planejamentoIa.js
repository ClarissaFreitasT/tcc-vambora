export function dataViagem(value) {
  return value ? value.slice(0, 10).split("-").reverse().join("/") : "";
}
export function dataDoDia(dataIda, indice) {
  const date = new Date(`${dataIda.slice(0, 10)}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + indice);
  return dataViagem(date.toISOString());
}
export function distribuicao(proposta) {
  return (proposta?.cidades || []).map((cidade, indice) => ({ ...cidade, dias: proposta.dias.filter((d) => d.cidadeIndice === indice || d.cidadePrincipal === `${cidade.nome}, ${cidade.regiao}, ${cidade.pais}`).length }));
}
export function mudancasViagem(antes, depois) {
  if (!antes || !depois) return [];
  const mudancas = [];
  if (JSON.stringify(antes.cidades) !== JSON.stringify(depois.cidades)) mudancas.push("Cidades ou ordem de visita alteradas");
  if (antes.dataIda?.slice(0, 10) !== depois.dataIda || antes.dataVolta?.slice(0, 10) !== depois.dataVolta) mudancas.push(`Novas datas: ${dataViagem(depois.dataIda)} a ${dataViagem(depois.dataVolta)}`);
  if (antes.pessoas !== depois.pessoas) mudancas.push(`Quantidade de pessoas: ${antes.pessoas} → ${depois.pessoas}`);
  return mudancas;
}
export function validarFormularioIa(form) {
  if (!form.cidades.length || form.cidades.length > 10 || form.cidades.some((c) => !c.nome.trim() || !c.regiao.trim() || !c.pais.trim())) return "Preencha nome, estado/região e país de todas as cidades.";
  if (!Number.isInteger(Number(form.pessoas)) || Number(form.pessoas) < 1 || Number(form.pessoas) > 50) return "Informe de 1 a 50 pessoas.";
  const dias = (Date.parse(form.dataVolta) - Date.parse(form.dataIda)) / 86400000 + 1;
  if (!Number.isFinite(dias) || dias < form.cidades.length || dias > 30) return "Escolha até 30 dias de viagem, com pelo menos um dia por cidade.";
  return null;
}
