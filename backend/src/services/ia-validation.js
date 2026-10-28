export function falha(status, message) {
  return Object.assign(new Error(message), { status });
}

function texto(value, nome, max, vazio = false) {
  if (typeof value !== "string" || (!vazio && !value.trim()) || value.length > max) {
    throw falha(400, `${nome}: informe um texto válido de até ${max} caracteres.`);
  }
  return value.trim();
}

export function dataCivil(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw falha(400, "Data inválida.");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value || value < "1900-01-01") {
    throw falha(400, "Data inválida.");
  }
  return date;
}

export function validarViagem(input) {
  if (!input || !Array.isArray(input.cidades) || input.cidades.length < 1 || input.cidades.length > 10) {
    throw falha(400, "Informe de 1 a 10 cidades.");
  }
  const cidades = input.cidades.map((c) => ({
    nome: texto(c?.nome, "Cidade", 80),
    regiao: texto(c?.regiao, "Estado/região", 80),
    pais: texto(c?.pais, "País", 80),
  }));
  if (new Set(cidades.map((c) => cidadeLabel(c).toLocaleLowerCase("pt-BR"))).size !== cidades.length) {
    throw falha(400, "Remova cidades repetidas.");
  }
  if (!Number.isInteger(input.pessoas) || input.pessoas < 1 || input.pessoas > 50) throw falha(400, "Informe de 1 a 50 pessoas.");
  const inicio = dataCivil(input.dataIda);
  const fim = dataCivil(input.dataVolta);
  const totalDias = (fim - inicio) / 86400000 + 1;
  if (totalDias < cidades.length || totalDias > 30) throw falha(400, "A viagem deve ter até 30 dias e pelo menos um dia por cidade.");
  return { cidades, pessoas: input.pessoas, dataIda: input.dataIda, dataVolta: input.dataVolta };
}

export const cidadeLabel = (c) => `${c.nome}, ${c.regiao}, ${c.pais}`;
export const validarMensagem = (v) => texto(v, "Mensagem", 2000);
export function validarChave(v) {
  if (typeof v !== "string" || !/^[\w-]{16,80}$/.test(v)) throw falha(400, "Identificador da operação inválido.");
  return v;
}

export function validarProposta(input) {
  const viagem = validarViagem(input);
  const total = (dataCivil(viagem.dataVolta) - dataCivil(viagem.dataIda)) / 86400000 + 1;
  if (!Array.isArray(input.dias) || input.dias.length !== total) throw falha(400, "A programação precisa cobrir todos os dias da viagem.");
  let anterior = 0;
  const visitadas = new Set();
  const dias = input.dias.map((dia, i) => {
    const cidadeIndice = dia.cidadeIndice;
    if (!Number.isInteger(cidadeIndice) || cidadeIndice < anterior || cidadeIndice < 0 || cidadeIndice >= viagem.cidades.length) {
      throw falha(400, "A programação deve respeitar a ordem das cidades.");
    }
    anterior = cidadeIndice;
    visitadas.add(cidadeIndice);
    if (!Array.isArray(dia.itens) || !dia.itens.length || dia.itens.length > 12) throw falha(400, "Cada dia precisa ter de 1 a 12 atividades.");
    return {
      numeroDia: i + 1,
      cidadeIndice,
      titulo: texto(dia.titulo, "Título do dia", 255),
      itens: dia.itens.map((item, ordem) => {
        if (item.horarioInicio !== null && !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.horarioInicio)) throw falha(400, "Horário inválido.");
        return {
          titulo: texto(item.titulo, "Título da atividade", 255),
          descricao: texto(item.descricao, "Descrição", 4000, true),
          localNome: texto(item.localNome, "Local", 255, true),
          horarioInicio: item.horarioInicio,
          custoEstimado: null,
          ordem,
        };
      }),
    };
  });
  if (visitadas.size !== viagem.cidades.length) throw falha(400, "Todas as cidades precisam receber pelo menos um dia.");
  return { ...viagem, titulo: texto(input.titulo, "Título", 255), descricao: texto(input.descricao, "Descrição", 8000, true), dias };
}

export function validarResposta(input, inicial = false) {
  const resposta = texto(input?.resposta, "Resposta", 8000);
  if (inicial && !input.proposta) throw falha(502, "A IA não gerou um roteiro. Tente novamente com cidades mais específicas.");
  return { resposta, proposta: input.proposta ? validarProposta(input.proposta) : null };
}

const string = { type: "string" };
const object = (properties) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });
const array = (items) => ({ type: "array", items });
export const respostaSchema = object({
  resposta: string,
  proposta: { anyOf: [{ type: "null" }, object({
    titulo: string, descricao: string, dataIda: string, dataVolta: string, pessoas: { type: "integer" },
    cidades: array(object({ nome: string, regiao: string, pais: string })),
    dias: array(object({ titulo: string, cidadeIndice: { type: "integer" }, itens: array(object({
      titulo: string, descricao: string, localNome: string, horarioInicio: { anyOf: [string, { type: "null" }] },
    })) })),
  })] },
});
