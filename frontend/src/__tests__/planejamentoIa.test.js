import { describe, expect, it } from "@jest/globals";
import { dataDoDia, distribuicao, mudancasViagem, validarFormularioIa } from "../utils/planejamentoIa.js";

const cidades = [{ nome: "Lisboa", regiao: "Lisboa", pais: "Portugal" }, { nome: "Porto", regiao: "Porto", pais: "Portugal" }];
const viagem = { cidades, pessoas: 2, dataIda: "2026-12-31", dataVolta: "2027-01-02" };
describe("planejamento IA", () => {
  it("formata datas civis sem deslocamento de fuso e cruza mês/ano", () => {
    expect(dataDoDia("2026-12-31", 0)).toBe("31/12/2026");
    expect(dataDoDia("2026-12-31", 1)).toBe("01/01/2027");
    expect(dataDoDia("2028-02-28", 1)).toBe("29/02/2028");
  });
  it("resume distribuição tanto na prévia quanto no roteiro salvo", () => {
    expect(distribuicao({ cidades, dias: [{ cidadeIndice: 0 }, { cidadeIndice: 0 }, { cidadeIndice: 1 }] }).map((c) => c.dias)).toEqual([2, 1]);
    expect(distribuicao({ cidades, dias: [{ cidadePrincipal: "Lisboa, Lisboa, Portugal" }] }).map((c) => c.dias)).toEqual([1, 0]);
  });
  it("destaca alteração de datas, cidades e pessoas para confirmação", () => {
    expect(mudancasViagem(viagem, { ...viagem, cidades: [...cidades].reverse(), pessoas: 4, dataVolta: "2027-01-03" })).toHaveLength(3);
    expect(mudancasViagem({ ...viagem, dataIda: "2026-12-31T00:00:00.000Z" }, viagem)).toEqual([]);
  });
  it("valida o formulário antes de chamar a IA", () => {
    expect(validarFormularioIa(viagem)).toBeNull();
    expect(validarFormularioIa({ ...viagem, dataVolta: "2026-12-31" })).toBeTruthy();
    expect(validarFormularioIa({ ...viagem, pessoas: 51 })).toBeTruthy();
    expect(validarFormularioIa({ ...viagem, dataVolta: "" })).toBeTruthy();
    expect(validarFormularioIa({ ...viagem, cidades: [{ ...cidades[0], pais: "" }] })).toBeTruthy();
  });
});
