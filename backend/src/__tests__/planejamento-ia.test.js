import { beforeEach, describe, expect, it, jest } from "@jest/globals";
jest.unstable_mockModule("../config/prisma.js", () => ({ prisma: {} }));
const { criarServicoIa } = await import("../services/planejamento-ia.js");

const viagem = { cidades: [{ nome: "Lisboa", regiao: "Lisboa", pais: "Portugal" }], pessoas: 2, dataIda: "2026-12-31", dataVolta: "2026-12-31" };
const conteudo = { ...viagem, titulo: "Lisboa", descricao: "Viagem", dias: [{ cidadeIndice: 0, titulo: "Chegada", itens: [{ titulo: "Passeio", descricao: "Leve", localNome: "Centro", horarioInicio: null }] }] };

// In-memory transactional adapter: verifies rollback and persisted lifecycle, without a paid API or real database.
function banco() {
  let state = { planos: [], propostas: [], mensagens: [], operacoes: [], roteiros: [], dias: [] };
  let seq = 0;
  const criar = (table, data) => { const row = { id: `id-${++seq}`, criadoEm: new Date(), ...structuredClone(data) }; state[table].push(row); return structuredClone(row); };
  const match = (row, where = {}) => Object.entries(where).every(([k, v]) => v && typeof v === "object" && "gte" in v ? row[k] >= v.gte : row[k] === v);
  const update = (table, where, data) => {
    const row = state[table].find((r) => match(r, where));
    if (!row) throw new Error("Registro ausente");
    for (const [k, v] of Object.entries(data)) row[k] = v && typeof v === "object" && "increment" in v ? row[k] + v.increment : structuredClone(v);
    return structuredClone(row);
  };
  const many = (table, where, data) => { const rows = state[table].filter((r) => match(r, where)); rows.forEach((r) => update(table, { id: r.id }, data)); return { count: rows.length }; };
  const hydrate = (row) => row ? structuredClone({ ...row,
    mensagens: state.mensagens.filter((m) => m.planejamentoId === row.id),
    propostas: state.propostas.filter((p) => p.planejamentoId === row.id && p.estado === "pendente"),
    roteiro: state.roteiros.find((r) => r.id === row.roteiroId) || null,
  }) : null;
  const db = {
    $queryRaw: jest.fn().mockResolvedValue([]),
    $transaction: async (fn) => { const before = structuredClone(state); try { return await fn(db); } catch (e) { state = before; throw e; } },
    planejamentoIa: {
      findFirst: jest.fn(async ({ where }) => hydrate(state.planos.find((p) => match(p, where)))),
      findMany: jest.fn(async ({ where }) => state.planos.filter((p) => match(p, where)).map(hydrate)),
      create: jest.fn(async ({ data }) => hydrate(criar("planos", { roteiroId: null, ...data }))),
      update: jest.fn(async ({ where, data }) => update("planos", where, data)),
      updateMany: jest.fn(async ({ where, data }) => many("planos", where, data)),
      delete: jest.fn(async ({ where }) => { state.planos = state.planos.filter((p) => !match(p, where)); }),
    },
    operacaoIa: {
      findUnique: jest.fn(async ({ where }) => structuredClone(state.operacoes.find((o) => match(o, where.usuarioId_chave)) || null)),
      count: jest.fn(async ({ where }) => state.operacoes.filter((o) => match(o, where)).length),
      create: jest.fn(async ({ data }) => criar("operacoes", { estado: "processando", ...data })),
      update: jest.fn(async ({ where, data }) => update("operacoes", where, data)),
    },
    mensagemIa: { create: jest.fn(async ({ data }) => criar("mensagens", data)) },
    propostaIa: {
      create: jest.fn(async ({ data }) => criar("propostas", { estado: "pendente", ...data })),
      findFirst: jest.fn(async ({ where }) => structuredClone(state.propostas.find((p) => match(p, where)) || null)),
      updateMany: jest.fn(async ({ where, data }) => many("propostas", where, data)),
      update: jest.fn(async ({ where, data }) => update("propostas", where, data)),
    },
    roteiro: {
      create: jest.fn(async ({ data }) => criar("roteiros", { revisao: 0, dias: [], ...data })),
      updateMany: jest.fn(async ({ where, data }) => many("roteiros", where, data)),
      findUnique: jest.fn(async ({ where }) => structuredClone(state.roteiros.find((r) => match(r, where)))),
    },
    diaDoRoteiro: {
      create: jest.fn(async ({ data }) => criar("dias", data)),
      deleteMany: jest.fn(async ({ where }) => { state.dias = state.dias.filter((d) => !match(d, where)); }),
    },
    estado: () => state,
  };
  return db;
}

describe("planejamento IA: ciclo de vida", () => {
  let db, gerar, service;
  const pedido = { ...viagem, operacaoId: "operacao-inicial-0001" };
  beforeEach(() => {
    db = banco(); gerar = jest.fn().mockResolvedValue({ resposta: "Primeira versão", proposta: conteudo });
    service = criarServicoIa(db, gerar, () => {});
  });
  it("cria prévia privada sem roteiro e reenvia sem nova chamada", async () => {
    const p = await service.gerarProposta("u1", null, pedido);
    expect(p.roteiroId).toBeNull(); expect(p.propostas).toHaveLength(1);
    expect(db.estado().roteiros).toHaveLength(0);
    expect((await service.gerarProposta("u1", null, pedido)).id).toBe(p.id);
    expect(gerar).toHaveBeenCalledTimes(1);
    await expect(service.gerarProposta("u1", null, { ...pedido, pessoas: 3 })).rejects.toMatchObject({ status: 409 });
  });
  it("confirma uma única vez e grava dias e atividades", async () => {
    const p = await service.gerarProposta("u1", null, pedido);
    const r = await service.aplicar("u1", p.id, p.propostas[0].id);
    expect(r.publico).toBe(false); expect(r.pessoas).toBe(2);
    expect(db.estado().dias[0].cidadePrincipal).toBe("Lisboa, Lisboa, Portugal");
    await service.aplicar("u1", p.id, p.propostas[0].id);
    expect(db.estado().roteiros).toHaveLength(1); expect(db.estado().dias).toHaveLength(1);
    expect((await service.obter("u1", p.id)).propostas).toHaveLength(0);
  });
  it("reverte a confirmação inteira se a gravação de dias falhar", async () => {
    const p = await service.gerarProposta("u1", null, pedido);
    db.diaDoRoteiro.create.mockRejectedValueOnce(new Error("Falha de banco"));
    await expect(service.aplicar("u1", p.id, p.propostas[0].id)).rejects.toThrow();
    expect(db.estado().roteiros).toHaveLength(0);
    expect((await service.obter("u1", p.id)).propostas).toHaveLength(1);
  });
  it("refina proposta pendente sem alterar roteiro salvo, depois descarta", async () => {
    const p = await service.gerarProposta("u1", null, pedido);
    const novo = await service.gerarProposta("u1", p.id, { mensagem: "Mais parques", operacaoId: "mensagem-parques-0001" });
    expect(gerar.mock.calls[1][0].propostaPendente.titulo).toBe("Lisboa");
    expect(novo.propostas[0].id).not.toBe(p.propostas[0].id);
    expect(db.estado().roteiros).toHaveLength(0);
    await service.descartar("u1", p.id, novo.propostas[0].id);
    await service.gerarProposta("u1", p.id, { mensagem: "Gerar novamente", operacaoId: "mensagem-parques-0002" });
    expect(gerar.mock.calls[2][0].propostaPendente).toBeNull();
  });
  it("aceita mudanças de datas, pessoas e cidades pelo chat somente após confirmação", async () => {
    const p = await service.gerarProposta("u1", null, pedido);
    await service.aplicar("u1", p.id, p.propostas[0].id);
    gerar.mockResolvedValueOnce({ resposta: "Mudança", proposta: { ...conteudo, pessoas: 4, dataIda: "2027-02-01", dataVolta: "2027-02-01", cidades: [{ nome: "Porto", regiao: "Porto", pais: "Portugal" }] } });
    const novo = await service.gerarProposta("u1", p.id, { mensagem: "Mude para Porto em fevereiro, 4 pessoas", operacaoId: "mensagem-mudanca-0001" });
    expect(db.estado().roteiros[0].pessoas).toBe(2);
    const atualizado = await service.aplicar("u1", p.id, novo.propostas[0].id);
    expect(atualizado.pessoas).toBe(4); expect(atualizado.destino).toBe("Porto");
  });
  it("impede que proposta antiga sobrescreva edição manual e gera sobre estado atual", async () => {
    const p = await service.gerarProposta("u1", null, pedido);
    await service.aplicar("u1", p.id, p.propostas[0].id);
    const novo = await service.gerarProposta("u1", p.id, { mensagem: "Mais parques", operacaoId: "mensagem-parques-0001" });
    db.estado().roteiros[0].revisao++;
    db.estado().roteiros[0].titulo = "Edição manual";
    await expect(service.aplicar("u1", p.id, novo.propostas[0].id)).rejects.toMatchObject({ status: 409 });
    await service.gerarProposta("u1", p.id, { mensagem: "Atualize a proposta", operacaoId: "mensagem-atualizada-01" });
    expect(gerar.mock.calls[2][0].propostaPendente).toBeNull();
    expect(gerar.mock.calls[2][0].roteiroSalvo.titulo).toBe("Edição manual");
  });
  it("preserva a proposta em esclarecimentos e falhas do provedor", async () => {
    const p = await service.gerarProposta("u1", null, pedido);
    gerar.mockResolvedValueOnce({ resposta: "Qual passeio?", proposta: null });
    await service.gerarProposta("u1", p.id, { mensagem: "Pode mudar?", operacaoId: "mensagem-pergunta-001" });
    gerar.mockRejectedValueOnce(Object.assign(new Error("Tempo excedido"), { status: 504 }));
    await expect(service.gerarProposta("u1", p.id, { mensagem: "Praia", operacaoId: "mensagem-praia-000001" })).rejects.toMatchObject({ status: 504, planejamentoId: p.id });
    const atual = await service.obter("u1", p.id);
    expect(atual.propostas[0].id).toBe(p.propostas[0].id); expect(atual.gerandoAte).toBeNull();
    expect(db.estado().operacoes.at(-1).estado).toBe("falhou");
  });
  it("bloqueia acesso por outro usuário em leitura, chat, confirmação, descarte e exclusão", async () => {
    const p = await service.gerarProposta("u1", null, pedido);
    for (const action of [() => service.obter("u2", p.id), () => service.aplicar("u2", p.id, p.propostas[0].id), () => service.descartar("u2", p.id, p.propostas[0].id), () => service.excluir("u2", p.id), () => service.gerarProposta("u2", p.id, { mensagem: "Mude", operacaoId: "mensagem-invasor-0001" })]) await expect(action()).rejects.toMatchObject({ status: 404 });
    expect(gerar).toHaveBeenCalledTimes(1);
  });
  it("limita chamadas, bloqueia geração simultânea e não remove roteiro ao excluir conversa", async () => {
    const p = await service.gerarProposta("u1", null, pedido);
    db.operacaoIa.count.mockResolvedValueOnce(20);
    await expect(service.gerarProposta("u1", p.id, { mensagem: "Mude", operacaoId: "mensagem-limite-00001" })).rejects.toMatchObject({ status: 429 });
    db.estado().planos[0].gerandoAte = new Date(Date.now() + 60000);
    await expect(service.gerarProposta("u1", p.id, { mensagem: "Mude", operacaoId: "mensagem-limite-00002" })).rejects.toMatchObject({ status: 409 });
    db.estado().planos[0].gerandoAte = null;
    await service.aplicar("u1", p.id, p.propostas[0].id);
    await service.excluir("u1", p.id);
    expect(db.estado().roteiros).toHaveLength(1);
  });
  it("não aceita primeira geração que altere as restrições informadas", async () => {
    gerar.mockResolvedValueOnce({ resposta: "Mudança indevida", proposta: { ...conteudo, pessoas: 4 } });
    await expect(service.gerarProposta("u1", null, pedido)).rejects.toMatchObject({ status: 502 });
    expect(db.estado().propostas).toHaveLength(0);
  });
});
