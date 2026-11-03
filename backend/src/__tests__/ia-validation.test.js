import { describe, expect, it } from "@jest/globals";
import {
  validarViagem,
  validarProposta,
  validarResposta,
  validarMensagem,
  dataCivil,
} from "../services/ia-validation.js";

export const viagem = {
  cidades: [
    { nome: "Lisboa", regiao: "Lisboa", pais: "Portugal" },
    { nome: "Porto", regiao: "Porto", pais: "Portugal" },
  ],
  dataIda: "2026-12-31",
  dataVolta: "2027-01-02",
};
export const proposta = {
  ...viagem,
  titulo: "Portugal",
  descricao: "Passeios e deslocamentos",
  dias: [0, 0, 1].map((cidadeIndice) => ({
    cidadeIndice,
    titulo: "Passeio",
    itens: [
      {
        titulo: "Caminhada",
        descricao: "Passeio leve",
        localNome: "Centro",
        horarioInicio: "10:00",
      },
    ],
  })),
};

describe("validação do planejamento IA", () => {
  it("conta datas inclusivas na virada de ano e mantém a ordem das cidades", () => {
    const p = validarProposta(proposta);
    expect(p.dias).toHaveLength(3);
    expect(p.dias.map((d) => d.numeroDia)).toEqual([1, 2, 3]);
    expect(p.dias[0].itens[0].custoEstimado).toBeNull();
  });
  it("aceita viagem de um dia e ano bissexto", () => {
    expect(
      validarViagem({
        ...viagem,
        cidades: viagem.cidades.slice(0, 1),
        dataIda: "2028-02-29",
        dataVolta: "2028-02-29",
      }).dataIda,
    ).toBe("2028-02-29");
  });
  it("aceita uma cidade com um dia ou vários dias sem pessoas nem região", () => {
    const umaCidade = [{ nome: "Lisboa", regiao: "", pais: "Portugal" }];
    expect(
      validarViagem({
        cidades: umaCidade,
        dataIda: "2026-12-31",
        dataVolta: "2026-12-31",
      }).cidades[0].regiao,
    ).toBe("");
    expect(
      validarViagem({
        cidades: umaCidade,
        dataIda: "2026-12-31",
        dataVolta: "2027-01-03",
      }).dataVolta,
    ).toBe("2027-01-03");
  });
  it("aceita o limite de 30 dias para uma cidade", () => {
    expect(
      validarViagem({
        cidades: [{ nome: "Lisboa", pais: "Portugal" }],
        dataIda: "2026-01-01",
        dataVolta: "2026-01-30",
      }).dataVolta,
    ).toBe("2026-01-30");
  });
  it("aceita várias cidades quando há ao menos um dia para cada", () => {
    expect(
      validarViagem({
        cidades: viagem.cidades,
        dataIda: "2026-12-31",
        dataVolta: "2027-01-01",
      }).cidades,
    ).toHaveLength(2);
  });
  it.each([
    { cidades: [{ nome: "", pais: "Portugal" }] },
    { cidades: [{ nome: "Lisboa", pais: "" }] },
  ])("exige nome e país da cidade: %j", (dados) => {
    expect(() =>
      validarViagem({ ...viagem, cidades: dados.cidades }),
    ).toThrow();
  });
  it.each([
    "2027-02-29",
    "2026-02-30",
    "2026-13-01",
    "2026-01-01T00:00:00Z",
    null,
  ])("recusa data civil inválida: %s", (data) =>
    expect(() => dataCivil(data)).toThrow(),
  );
  it.each([
    { dataVolta: "2026-12-30" },
    { dataVolta: "2027-02-01" },
    { cidades: [] },
    { cidades: [viagem.cidades[0], viagem.cidades[0]] },
    {
      cidades: Array.from({ length: 11 }, (_, i) => ({
        nome: `Cidade ${i}`,
        pais: `País ${i}`,
      })),
    },
    { cidades: viagem.cidades, dataVolta: "2027-02-01" },
  ])("recusa limites inválidos %j", (dados) =>
    expect(() => validarViagem({ ...viagem, ...dados })).toThrow(),
  );
  it("exige pelo menos um dia por cidade", () =>
    expect(() =>
      validarViagem({ ...viagem, dataVolta: viagem.dataIda }),
    ).toThrow());
  it("ignora pessoas legadas e não as inclui nos dados normalizados", () => {
    const normalizada = validarViagem({ ...viagem, pessoas: 45 });
    expect(normalizada).not.toHaveProperty("pessoas");
  });
  it("valida proposta de uma cidade com vários dias", () => {
    const umaCidade = { nome: "Lisboa", regiao: "", pais: "Portugal" };
    const propostaLonga = {
      cidades: [umaCidade],
      dataIda: "2026-12-31",
      dataVolta: "2027-01-02",
      pessoas: 4,
      titulo: "Lisboa",
      descricao: "",
      dias: [0, 0, 0].map((cidadeIndice) => ({
        cidadeIndice,
        titulo: "Dia",
        itens: [
          {
            titulo: "Passeio",
            descricao: "",
            localNome: "",
            horarioInicio: null,
          },
        ],
      })),
    };
    const validada = validarProposta(propostaLonga);
    expect(validada.dias).toHaveLength(3);
    expect(validada.cidades[0].regiao).toBe("");
    expect(validada).not.toHaveProperty("pessoas");
  });
  it("recusa programação incompleta, cidade omitida e ordem invertida", () => {
    expect(() =>
      validarProposta({ ...proposta, dias: proposta.dias.slice(0, 2) }),
    ).toThrow();
    expect(() =>
      validarProposta({
        ...proposta,
        dias: proposta.dias.map((d) => ({ ...d, cidadeIndice: 0 })),
      }),
    ).toThrow();
    expect(() =>
      validarProposta({ ...proposta, dias: [...proposta.dias].reverse() }),
    ).toThrow();
  });
  it("recusa atividades vazias, texto excessivo e horário inválido", () => {
    for (const itens of [
      [],
      [{ ...proposta.dias[0].itens[0], horarioInicio: "25:00" }],
      [{ ...proposta.dias[0].itens[0], titulo: "x".repeat(256) }],
    ]) {
      expect(() =>
        validarProposta({
          ...proposta,
          dias: proposta.dias.map((d) => ({ ...d, itens })),
        }),
      ).toThrow();
    }
  });
  it("permite esclarecimento sem proposta, exceto na geração inicial", () => {
    expect(
      validarResposta({ resposta: "Qual passeio?", proposta: null }).proposta,
    ).toBeNull();
    expect(() =>
      validarResposta({ resposta: "Qual passeio?", proposta: null }, true),
    ).toThrow();
    expect(() => validarMensagem(" ")).toThrow();
    expect(() => validarMensagem("x".repeat(2001))).toThrow();
  });
});
