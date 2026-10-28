import { beforeEach, describe, expect, it, jest } from "@jest/globals";
const tx = { roteiro: { update: jest.fn() }, diaDoRoteiro: { create: jest.fn(), update: jest.fn(), delete: jest.fn() }, itemDoRoteiro: { create: jest.fn(), update: jest.fn(), delete: jest.fn() } };
const db = { $transaction: jest.fn((fn) => fn(tx)), diaDoRoteiro: { findUnique: jest.fn() }, itemDoRoteiro: { findUnique: jest.fn() }, roteiro: { findUnique: jest.fn(), update: jest.fn() } };
jest.unstable_mockModule("../config/prisma.js", () => ({ prisma: db }));
const dias = await import("../models/dia.model.js");
const itens = await import("../models/item.model.js");
const roteiros = await import("../models/roteiro.model.js");
describe("revisão nas edições manuais", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.diaDoRoteiro.findUnique.mockResolvedValue({ id: "d1", roteiroId: "r1", roteiro: { usuarioId: "u1" } });
    db.itemDoRoteiro.findUnique.mockResolvedValue({ id: "i1", dia: { roteiroId: "r1", roteiro: { usuarioId: "u1" } } });
    db.roteiro.findUnique.mockResolvedValue({ id: "r1", usuarioId: "u1" });
  });
  it("incrementa revisão e altera filhos na mesma transação, sempre bloqueando o pai antes", async () => {
    await dias.criarDia("r1", 1, "Dia"); await dias.atualizarDia("d1", { titulo: "Novo" }, "u1"); await dias.deletarDia("d1", "u1");
    await itens.criarItem("d1", "Atividade"); await itens.atualizarItem("i1", { titulo: "Nova" }, "u1"); await itens.deletarItem("i1", "u1");
    expect(db.$transaction).toHaveBeenCalledTimes(6);
    expect(tx.roteiro.update).toHaveBeenCalledTimes(6);
    expect(tx.roteiro.update).toHaveBeenCalledWith({ where: { id: "r1" }, data: { revisao: { increment: 1 } } });
    expect(tx.roteiro.update.mock.invocationCallOrder[0]).toBeLessThan(tx.diaDoRoteiro.create.mock.invocationCallOrder[0]);
  });
  it("não permite mover registros para outro roteiro ou injetar relações", async () => {
    await dias.atualizarDia("d1", { titulo: "Novo", roteiroId: "outro", roteiro: { connect: { id: "outro" } } }, "u1");
    await itens.atualizarItem("i1", { titulo: "Nova", diaId: "outro" }, "u1");
    expect(tx.diaDoRoteiro.update).toHaveBeenCalledWith({ where: { id: "d1" }, data: { titulo: "Novo" } });
    expect(tx.itemDoRoteiro.update).toHaveBeenCalledWith({ where: { id: "i1" }, data: { titulo: "Nova" } });
  });
  it("não incrementa a revisão para usuário sem permissão", async () => {
    expect(await dias.atualizarDia("d1", {}, "u2")).toBeNull();
    expect(await itens.deletarItem("i1", "u2")).toBeNull();
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it("atualiza dados e revisão do roteiro juntos", async () => {
    await roteiros.atualizarRoteiro("r1", { titulo: "Novo" });
    expect(db.roteiro.update).toHaveBeenCalledWith({ where: { id: "r1" }, data: { titulo: "Novo", revisao: { increment: 1 } } });
  });
});
