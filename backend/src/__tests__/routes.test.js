import request from "supertest";
import { jest } from "@jest/globals";

const mockObterTodasRoteiros = jest.fn();
const mockObterRoteiroPorId = jest.fn();
const mockCriarNovoRoteiro = jest.fn();
const mockAtualizarRoteiro = jest.fn();
const mockExcluirRoteiro = jest.fn();
const mockCriarDia = jest.fn();
const mockCriarItem = jest.fn();

jest.unstable_mockModule("../models/roteiro.model.js", () => ({
  obterTodasRoteiros: mockObterTodasRoteiros,
  obterRoteiroPorId: mockObterRoteiroPorId,
  criarNovoRoteiro: mockCriarNovoRoteiro,
  atualizarRoteiro: mockAtualizarRoteiro,
  excluirRoteiro: mockExcluirRoteiro
}));

jest.unstable_mockModule("../models/dia.model.js", () => ({
  criarDia: mockCriarDia,
  listarDiasDoRoteiro: jest.fn()
}));

jest.unstable_mockModule("../models/item.model.js", () => ({
  criarItem: mockCriarItem
}));

const { default: app } = await import("../app.js");

describe("Testes das rotas principais", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Roteiros", () => {
    it("deve retornar lista de roteiros", async () => {
      const roteirosMock = [
        {
          id: "1",
          usuarioId: "u1",
          titulo: "Roteiro de Fim de Semana",
          destino: "Paraty",
          descricao: "Passeio histórico e praias",
          orcamento: 1500,
          publico: true
        }
      ];

      mockObterTodasRoteiros.mockResolvedValue(roteirosMock);

      const response = await request(app).get("/roteiros");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(roteirosMock);
      expect(mockObterTodasRoteiros).toHaveBeenCalledTimes(1);
    });

    it("deve retornar um roteiro específico", async () => {
      const roteiroMock = {
        id: "1",
        usuarioId: "u1",
        titulo: "Roteiro Cultural",
        destino: "Salvador",
        descricao: "Museus e culinária",
        orcamento: 1200,
        publico: false
      };

      mockObterRoteiroPorId.mockResolvedValue(roteiroMock);

      const response = await request(app).get("/roteiros/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual(roteiroMock);
      expect(mockObterRoteiroPorId).toHaveBeenCalledWith("1");
    });

    it("deve retornar 404 quando o roteiro não existir", async () => {
      mockObterRoteiroPorId.mockResolvedValue(null);

      const response = await request(app).get("/roteiros/999");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ erro: "Roteiro não encontrado" });
      expect(mockObterRoteiroPorId).toHaveBeenCalledWith("999");
    });

    it("deve criar um novo roteiro", async () => {
      const novoRoteiro = {
        usuarioId: "u1",
        titulo: "Roteiro Gastronômico",
        destino: "São Paulo",
        descricao: "Melhores restaurantes da cidade",
        orcamento: 2000,
        publico: true
      };

      const roteiroCriado = {
        id: "2",
        ...novoRoteiro
      };

      mockCriarNovoRoteiro.mockResolvedValue(roteiroCriado);

      const response = await request(app).post("/roteiros").send(novoRoteiro);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        mensagem: "Roteiro criado com sucesso!",
        roteiro: roteiroCriado
      });
      expect(mockCriarNovoRoteiro).toHaveBeenCalledWith(novoRoteiro);
    });

    it("deve retornar 400 quando dados obrigatórios de roteiro estiverem faltando", async () => {
      const response = await request(app).post("/roteiros").send({
        usuarioId: "",
        titulo: "",
        destino: ""
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ erro: "UsuarioId é obrigatório" });
    });

    it("deve atualizar um roteiro existente", async () => {
      const roteiroAtualizado = {
        id: "1",
        usuarioId: "u1",
        titulo: "Roteiro Atualizado",
        destino: "Paraty",
        descricao: "Passeio histórico e praias",
        orcamento: 1500,
        publico: true
      };

      mockAtualizarRoteiro.mockResolvedValue(roteiroAtualizado);

      const response = await request(app)
        .patch("/roteiros/1")
        .send({ titulo: "Roteiro Atualizado" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        mensagem: "Roteiro atualizado com sucesso!",
        roteiro: roteiroAtualizado
      });
      expect(mockAtualizarRoteiro).toHaveBeenCalledWith("1", {
        titulo: "Roteiro Atualizado",
        destino: undefined,
        descricao: undefined,
        orcamento: undefined,
        publico: undefined
      });
    });

    it("deve retornar 404 ao atualizar roteiro inexistente", async () => {
      mockAtualizarRoteiro.mockResolvedValue(null);

      const response = await request(app)
        .patch("/roteiros/999")
        .send({ titulo: "Roteiro Atualizado" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ erro: "Roteiro não encontrado" });
      expect(mockAtualizarRoteiro).toHaveBeenCalledWith("999", {
        titulo: "Roteiro Atualizado",
        destino: undefined,
        descricao: undefined,
        orcamento: undefined,
        publico: undefined
      });
    });

    it("deve excluir um roteiro existente", async () => {
      const roteiroRemovido = {
        id: "1",
        usuarioId: "u1",
        titulo: "Roteiro Gastronômico",
        destino: "São Paulo"
      };

      mockExcluirRoteiro.mockResolvedValue(roteiroRemovido);

      const response = await request(app).delete("/roteiros/1");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        mensagem: "Roteiro excluído com sucesso!",
        roteiro: roteiroRemovido
      });
      expect(mockExcluirRoteiro).toHaveBeenCalledWith("1");
    });

    it("deve retornar 404 ao excluir roteiro inexistente", async () => {
      mockExcluirRoteiro.mockResolvedValue(null);

      const response = await request(app).delete("/roteiros/999");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ erro: "Roteiro não encontrado" });
      expect(mockExcluirRoteiro).toHaveBeenCalledWith("999");
    });
  });

  describe("Dias", () => {
    it("deve criar um dia para o roteiro com sucesso", async () => {
      const novoDia = {
        roteiroId: "1",
        numeroDia: 1,
        titulo: "Dia de Praias"
      };

      const diaCriado = {
        id: "10",
        ...novoDia
      };

      mockCriarDia.mockResolvedValue(diaCriado);

      const response = await request(app).post("/dias").send(novoDia);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(diaCriado);
      expect(mockCriarDia).toHaveBeenCalledWith(
        novoDia.roteiroId,
        novoDia.numeroDia,
        novoDia.titulo
      );
    });

    it("deve retornar 400 quando roteiroId não for informado", async () => {
      const response = await request(app)
        .post("/dias")
        .send({ numeroDia: 1, titulo: "Dia de Praias" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ erro: "Roteiro obrigatório" });
      expect(mockCriarDia).not.toHaveBeenCalled();
    });
  });

  describe("Itens", () => {
    it("deve criar um item para o dia com sucesso", async () => {
      const novoItem = {
        diaId: "10",
        titulo: "Visita ao Museu",
        descricao: "Museu de arte local",
        localNome: "Museu Histórico"
      };

      const itemCriado = {
        id: "100",
        ...novoItem
      };

      mockCriarItem.mockResolvedValue(itemCriado);

      const response = await request(app).post("/itens").send(novoItem);

      expect(response.status).toBe(201);
      expect(response.body).toEqual(itemCriado);
      expect(mockCriarItem).toHaveBeenCalledWith(
        novoItem.diaId,
        novoItem.titulo,
        novoItem.descricao,
        novoItem.localNome
      );
    });

    it("deve retornar 400 quando diaId estiver ausente", async () => {
      const response = await request(app)
        .post("/itens")
        .send({ titulo: "Visita ao Museu" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ erro: "Dados obrigatórios" });
      expect(mockCriarItem).not.toHaveBeenCalled();
    });

    it("deve retornar 400 quando titulo estiver ausente", async () => {
      const response = await request(app)
        .post("/itens")
        .send({ diaId: "10", descricao: "Museu de arte local" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ erro: "Dados obrigatórios" });
      expect(mockCriarItem).not.toHaveBeenCalled();
    });
  });
});
