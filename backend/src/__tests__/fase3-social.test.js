import { jest } from "@jest/globals";

const mockCriarPublicacao = jest.fn();
const mockEncontrarPublicacao = jest.fn();
const mockCurtirPublicacao = jest.fn();
const mockAdicionarComentario = jest.fn();
const mockObterCurtidaPublicacao = jest.fn();
const mockContarCurtidasPublicacao = jest.fn();
const mockSeguirUsuario = jest.fn();
const mockObterUsuarioPorId = jest.fn();
const mockListarTimelinePublica = jest.fn();

jest.unstable_mockModule("../models/publicacao.model.js", () => ({
  criarPublicacao: mockCriarPublicacao,
  obterPublicacaoPorId: mockEncontrarPublicacao,
  obterCurtidaPublicacao: mockObterCurtidaPublicacao,
  criarCurtidaPublicacao: mockCurtirPublicacao,
  contarCurtidasPublicacao: mockContarCurtidasPublicacao,
  criarComentarioPublicacao: mockAdicionarComentario,
  listarTimelinePublica: mockListarTimelinePublica,
}));

jest.unstable_mockModule("../models/users.model.js", () => ({
  seguirUsuario: mockSeguirUsuario,
  obterUsuarioPorId: mockObterUsuarioPorId,
  obterTodosUsuarios: jest.fn(),
  atualizarUsuario: jest.fn(),
  deletarUsuario: jest.fn(),
  obterSeguidor: jest.fn(),
  deixarDeSeguirUsuario: jest.fn(),
  listarSeguidores: jest.fn(),
  listarSeguindo: jest.fn(),
}));

const {
  criarPublicacao,
  curtirPublicacao,
  adicionarComentarioPublicacao,
  listarTimelinePublica,
} = await import("../controllers/publicacao.controller.js");
const { seguirUsuario } = await import("../controllers/users.controller.js");

describe("Fase 3 - comunidade social", () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockObterUsuarioPorId.mockResolvedValue({ id: "u2", nome: "Maria" });
    mockObterCurtidaPublicacao.mockResolvedValue(null);
    mockContarCurtidasPublicacao.mockResolvedValue(1);
  });

  it("cria uma publicação de um usuário autenticado", async () => {
    mockCriarPublicacao.mockResolvedValue({
      id: "p1",
      texto: "Viagem incrível",
      usuarioId: "u1",
    });

    await criarPublicacao(
      {
        body: { texto: "Viagem incrível" },
        user: { id: "u1" },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockCriarPublicacao).toHaveBeenCalledWith(
      "u1",
      "Viagem incrível",
      null,
    );
  });

  it("lista a timeline pública e informa se o usuário autenticado curtiu", async () => {
    mockListarTimelinePublica.mockResolvedValue([
      {
        id: "p1",
        texto: "Roteiro incrível",
        curtidas: [{ id: "like-1" }],
      },
      { id: "p2", texto: "Dica de viagem", curtidas: [] },
    ]);

    await listarTimelinePublica({ user: { id: "u1" } }, res);

    expect(mockListarTimelinePublica).toHaveBeenCalledWith("u1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([
      { id: "p1", texto: "Roteiro incrível", curtiu: true },
      { id: "p2", texto: "Dica de viagem", curtiu: false },
    ]);
  });

  it("curte uma publicação pública", async () => {
    mockEncontrarPublicacao.mockResolvedValue({ id: "p1", usuarioId: "u2" });
    mockCurtirPublicacao.mockResolvedValue({
      id: "cp1",
      usuarioId: "u1",
      publicacaoId: "p1",
    });

    await curtirPublicacao({ params: { id: "p1" }, user: { id: "u1" } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockCurtirPublicacao).toHaveBeenCalledWith("u1", "p1");
  });

  it("adiciona comentário em uma publicação", async () => {
    mockEncontrarPublicacao.mockResolvedValue({ id: "p1", usuarioId: "u2" });
    mockAdicionarComentario.mockResolvedValue({
      id: "c1",
      texto: "Parabéns!",
      usuarioId: "u1",
      publicacaoId: "p1",
    });

    await adicionarComentarioPublicacao(
      {
        params: { id: "p1" },
        body: { texto: "Parabéns!" },
        user: { id: "u1" },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockAdicionarComentario).toHaveBeenCalledWith(
      "u1",
      "p1",
      "Parabéns!",
      null,
    );
  });

  it("segue um usuário sem repetir relacionamento", async () => {
    mockSeguirUsuario.mockResolvedValue({
      id: "s1",
      seguidorId: "u1",
      seguidoId: "u2",
    });

    await seguirUsuario({ params: { id: "u2" }, user: { id: "u1" } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockSeguirUsuario).toHaveBeenCalledWith("u1", "u2");
  });
});
