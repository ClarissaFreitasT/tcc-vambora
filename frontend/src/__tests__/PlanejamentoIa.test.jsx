/** @jest-environment jsdom */
import { beforeEach, afterEach, describe, expect, it, jest } from "@jest/globals";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
const apiFetch = jest.fn();
jest.unstable_mockModule("../data/api.js", () => ({ apiFetch }));
const { default: PlanejamentoIa } = await import("../pages/PlanejamentoIa.jsx");
const viagem = { cidades: [{ nome: "Lisboa", regiao: "Lisboa", pais: "Portugal" }], pessoas: 2, dataIda: "2026-12-31", dataVolta: "2026-12-31" };
const conteudo = { ...viagem, titulo: "Lisboa em um dia", descricao: "Passeio leve", dias: [{ cidadeIndice: 0, titulo: "Chegada", itens: [{ titulo: "Caminhada", descricao: "Centro", localNome: "Lisboa", horarioInicio: null }] }] };
const plano = { id: "p1", dadosIniciais: viagem, roteiroId: null, roteiro: null, mensagens: [{ id: "m1", papel: "assistente", texto: "Versão inicial pronta" }], propostas: [{ id: "v1", conteudo, resumo: "Um dia em Lisboa", revisaoBase: null }] };
function abrir(path = "/planejamentos-ia/p1") {
  return render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes>
    <Route path="/roteiros/ia/novo" element={<PlanejamentoIa />} />
    <Route path="/planejamentos-ia/:id" element={<PlanejamentoIa />} />
  </Routes></MemoryRouter>);
}
beforeEach(() => { apiFetch.mockReset(); Element.prototype.scrollIntoView = jest.fn(); });
afterEach(cleanup);

describe("fluxo da tela de planejamento", () => {
  it("permite ordenar cidades e só habilita o chat após a primeira versão", () => {
    abrir("/roteiros/ia/novo");
    expect(screen.queryByText("Ajuste com o Gemini")).toBeNull();
    fireEvent.change(screen.getByLabelText("Cidade"), { target: { value: "Lisboa" } });
    fireEvent.click(screen.getByText("+ Adicionar cidade"));
    fireEvent.change(screen.getAllByLabelText("Cidade")[1], { target: { value: "Porto" } });
    fireEvent.click(screen.getByLabelText("Mover cidade 2 para cima"));
    expect(screen.getAllByLabelText("Cidade")[0].value).toBe("Porto");
    expect(apiFetch).not.toHaveBeenCalled();
  });
  it("recupera a prévia e só salva após o clique de confirmação", async () => {
    apiFetch.mockResolvedValueOnce(plano).mockResolvedValueOnce({ id: "r1" }).mockResolvedValueOnce({ ...plano, roteiroId: "r1", roteiro: { ...conteudo, id: "r1", revisao: 1 }, propostas: [] });
    abrir();
    await screen.findByText("Lisboa em um dia");
    expect(apiFetch).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText("Salvar roteiro"));
    await screen.findByText("Versão confirmada e salva no seu roteiro.");
    expect(apiFetch).toHaveBeenCalledWith("/planejamentos-ia/p1/propostas/v1/aplicar", { method: "POST" });
    expect(screen.queryByText("Salvar roteiro")).toBeNull();
  });
  it("envia ajustes com identificador e preserva a proposta após falha", async () => {
    apiFetch.mockResolvedValueOnce(plano).mockRejectedValueOnce(Object.assign(new Error("IA indisponível"), { status: 503 }));
    abrir();
    await screen.findByText("Lisboa em um dia");
    fireEvent.change(screen.getByLabelText("O que você quer ajustar?"), { target: { value: "Mais parques" } });
    fireEvent.click(screen.getByText("Enviar pedido"));
    await screen.findByText("IA indisponível");
    expect(screen.getByText("Lisboa em um dia")).toBeTruthy();
    const payload = JSON.parse(apiFetch.mock.calls[1][1].body);
    expect(payload.mensagem).toBe("Mais parques"); expect(payload.operacaoId).toBeTruthy();
    expect(screen.getByLabelText("O que você quer ajustar?").value).toBe("Mais parques");
  });
  it("descarta a proposta sem aplicar alterações", async () => {
    apiFetch.mockResolvedValueOnce(plano).mockResolvedValueOnce({}).mockResolvedValueOnce({ ...plano, propostas: [] });
    abrir();
    fireEvent.click(await screen.findByText("Descartar proposta"));
    await waitFor(() => expect(screen.queryByText("Salvar roteiro")).toBeNull());
    expect(apiFetch).toHaveBeenCalledWith("/planejamentos-ia/p1/propostas/v1/descartar", { method: "POST" });
  });
  it("destaca mudanças e bloqueia aplicação sobre uma edição manual mais recente", async () => {
    apiFetch.mockResolvedValue({ ...plano, roteiroId: "r1", roteiro: { ...conteudo, id: "r1", pessoas: 1, revisao: 2 }, propostas: [{ ...plano.propostas[0], revisaoBase: 1 }] });
    abrir();
    const botao = await screen.findByText("Aplicar alterações");
    expect(botao.disabled).toBe(true);
    expect(screen.getByText("Quantidade de pessoas: 1 → 2")).toBeTruthy();
  });
  it("oferece nova tentativa sem abrir chat quando a primeira geração falhou", async () => {
    apiFetch.mockResolvedValue({ ...plano, propostas: [], mensagens: [] });
    abrir();
    await screen.findByText("Tentar gerar roteiro");
    expect(screen.queryByText("Ajuste com o Gemini")).toBeNull();
  });
});
