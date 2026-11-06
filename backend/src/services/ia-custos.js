import { cidadeLabel, falha } from "./ia-validation.js";

const normalizar = (value) => (value || "").trim().toLocaleLowerCase("pt-BR");
const chave = (cidade, item) => JSON.stringify(
  [cidade, item.titulo, item.localNome].map(normalizar),
);

// Os valores vêm exclusivamente do roteiro persistido, nunca da resposta da IA.
export function preservarCustos(proposta, roteiro) {
  const anteriores = (roteiro?.dias || []).flatMap((dia) =>
    dia.itens.map((item) => ({ ...item, chave: chave(dia.cidadePrincipal, item) })),
  );
  const usados = new Set();
  const dias = proposta.dias.map((dia) => ({
    ...dia,
    itens: dia.itens.map((item) => {
      const { itemOriginalId, ...dados } = item;
      let original;
      if (itemOriginalId) {
        original = anteriores.find((entry) => entry.id === itemOriginalId);
        if (!original || usados.has(original)) {
          throw falha(409, "A proposta contém uma referência de atividade inválida ou repetida. Peça uma nova proposta.");
        }
      } else {
        // Compatibilidade com propostas antigas, que ainda não possuem referências.
        const identidade = chave(cidadeLabel(proposta.cidades[dia.cidadeIndice]), item);
        const candidatos = anteriores.filter((entry) => entry.chave === identidade && !usados.has(entry));
        if (candidatos.length === 1) original = candidatos[0];
      }
      if (original) usados.add(original);
      return { ...dados, custoEstimado: original?.custoEstimado ?? null };
    }),
  }));
  if (anteriores.some((item) => item.custoEstimado != null && !usados.has(item))) {
    throw falha(409, "A proposta remove ou não identifica uma atividade com custo manual. Peça para preservar a atividade ou remova seu custo manualmente antes de gerar uma nova proposta.");
  }
  return dias;
}
