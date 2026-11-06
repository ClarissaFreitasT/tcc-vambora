import { preservarCustos } from "../services/ia-custos.js";

const atividade = { id: "atividade-1", titulo: "Museu", localNome: "Centro", custoEstimado: "150.00" };
const roteiro = { dias: [{ cidadePrincipal: "Lisboa, Portugal", itens: [atividade] }] };
const proposta = (itens) => ({
  cidades: [{ nome: "Lisboa", pais: "Portugal" }],
  dias: [{ cidadeIndice: 0, itens }],
});

describe("custos manuais em propostas da IA", () => {
  it("preserva custo mesmo com mudança de título e horário usando a referência", () => {
    const dias = preservarCustos(proposta([{
      itemOriginalId: atividade.id, titulo: "Visita cultural", localNome: "Museu",
      horarioInicio: "14:00", custoEstimado: 999,
    }]), roteiro);
    expect(dias[0].itens[0].custoEstimado).toBe("150.00");
    expect(dias[0].itens[0]).not.toHaveProperty("itemOriginalId");
  });
  it("preserva atividades de propostas legadas sem referência e mantém novas sem custo", () => {
    const dias = preservarCustos(proposta([
      { titulo: "Museu", localNome: "Centro" },
      { titulo: "Parque", localNome: "Jardim", custoEstimado: 999 },
    ]), roteiro);
    expect(dias[0].itens.map((item) => item.custoEstimado)).toEqual(["150.00", null]);
  });
  it("não aceita referência de outro roteiro nem reutiliza a mesma atividade", () => {
    expect(() => preservarCustos(proposta([{ itemOriginalId: "outro-roteiro" }]), roteiro)).toThrow("referência");
    expect(() => preservarCustos(proposta([
      { itemOriginalId: atividade.id }, { itemOriginalId: atividade.id },
    ]), roteiro)).toThrow("repetida");
  });
  it("bloqueia remoção e correspondências ambíguas de atividades com custo", () => {
    expect(() => preservarCustos(proposta([]), roteiro)).toThrow("custo manual");
    const duplicadas = { dias: [{ cidadePrincipal: "Lisboa, Portugal", itens: [atividade, { ...atividade, id: "atividade-2" }] }] };
    expect(() => preservarCustos(proposta([{ titulo: "Museu", localNome: "Centro" }]), duplicadas)).toThrow("custo manual");
  });
  it("preserva custo zero e permite remover atividades sem custo", () => {
    const dias = preservarCustos(proposta([{ itemOriginalId: atividade.id }]), {
      dias: [{ itens: [{ ...atividade, custoEstimado: 0 }, { id: "livre", custoEstimado: null }] }],
    });
    expect(dias[0].itens[0].custoEstimado).toBe(0);
  });
});
