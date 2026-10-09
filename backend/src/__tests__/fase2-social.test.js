import { jest } from "@jest/globals";

const mockObterRoteiroPorId = jest.fn();
const mockObterCurtida = jest.fn();
const mockCriarCurtida = jest.fn();
const mockRemoverCurtida = jest.fn();
const mockContarCurtidas = jest.fn();
const mockObterSalvo = jest.fn();
const mockSalvarRoteiro = jest.fn();
const mockRemoverSalvo = jest.fn();
const mockListarSalvos = jest.fn();
const mockObterReview = jest.fn();
const mockCriarReview = jest.fn();
const mockListarReviews = jest.fn();
const mockObterResumoAvaliacao = jest.fn();

jest.unstable_mockModule("../models/roteiro.model.js", () => ({
  obterRoteiroPorId: mockObterRoteiroPorId,
  obterCurtida: mockObterCurtida,
  criarCurtida: mockCriarCurtida,
  removerCurtida: mockRemoverCurtida,
  contarCurtidas: mockContarCurtidas,
  obterRoteiroSalvo: mockObterSalvo,
  salvarRoteiro: mockSalvarRoteiro,
  removerRoteiroSalvo: mockRemoverSalvo,
  listarRoteirosSalvos: mockListarSalvos,
  obterReviewUsuarioRoteiro: mockObterReview,
  criarReview: mockCriarReview,
  listarReviewsDoRoteiro: mockListarReviews,
  obterResumoAvaliacao: mockObterResumoAvaliacao,
}));

const {
  adicionarCurtidaRoteiro,
  removerCurtidaRoteiro,
  listarRoteirosSalvos,
  salvarRoteiroUsuario,
  removerRoteiroSalvoUsuario,
  criarAvaliacaoRoteiro,
} = await import("../controllers/roteiro.controller.js");

describe("Fase 2 - roteiro social", () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("curte um roteiro público apenas uma vez", async () => {
    mockObterRoteiroPorId.mockResolvedValue({
      id: "r1",
      publico: true,
      usuarioId: "u2",
    });
    mockObterCurtida.mockResolvedValue(null);
    mockCriarCurtida.mockResolvedValue({
      id: "c1",
      usuarioId: "u1",
      roteiroId: "r1",
    });
    mockContarCurtidas.mockResolvedValue(1);

    await adicionarCurtidaRoteiro(
      { params: { id: "r1" }, user: { id: "u1" } },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockCriarCurtida).toHaveBeenCalledWith("u1", "r1");
  });

  it("salva um roteiro público uma única vez", async () => {
    mockObterRoteiroPorId.mockResolvedValue({
      id: "r1",
      publico: true,
      usuarioId: "u2",
    });
    mockObterSalvo.mockResolvedValue(null);
    mockSalvarRoteiro.mockResolvedValue({
      id: "s1",
      usuarioId: "u1",
      roteiroId: "r1",
    });

    await salvarRoteiroUsuario(
      { params: { id: "r1" }, user: { id: "u1" } },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockSalvarRoteiro).toHaveBeenCalledWith("u1", "r1");
  });

  it("cria uma avaliação pública para um roteiro", async () => {
    mockObterRoteiroPorId.mockResolvedValue({
      id: "r1",
      publico: true,
      usuarioId: "u2",
    });
    mockObterReview.mockResolvedValue(null);
    mockCriarReview.mockResolvedValue({
      id: "a1",
      usuarioId: "u1",
      roteiroId: "r1",
      nota: 5,
      comentario: "Excelente",
    });
    mockObterResumoAvaliacao.mockResolvedValue({ media: 4.8, total: 1 });

    await criarAvaliacaoRoteiro(
      {
        params: { id: "r1" },
        body: { nota: 5, comentario: "Excelente" },
        user: { id: "u1" },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockCriarReview).toHaveBeenCalledWith("u1", "r1", 5, "Excelente");
  });

  it("lista os roteiros salvos do usuário autenticado", async () => {
    mockListarSalvos.mockResolvedValue([{ id: "s1", roteiroId: "r1" }]);

    await listarRoteirosSalvos({ user: { id: "u1" } }, res);

    expect(mockListarSalvos).toHaveBeenCalledWith("u1");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
