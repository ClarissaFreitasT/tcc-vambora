import { jest } from "@jest/globals";

const mockObterPublicacao = jest.fn();
const mockExcluirPublicacao = jest.fn();
const mockObterComentario = jest.fn();
const mockExcluirComentario = jest.fn();

jest.unstable_mockModule("../models/publicacao.model.js", () => ({
  obterPublicacaoPorId: mockObterPublicacao,
  excluirPublicacao: mockExcluirPublicacao,
  obterComentarioPorId: mockObterComentario,
  excluirComentario: mockExcluirComentario,
}));

const { excluirPublicacaoAdmin, excluirComentarioAdmin } =
  await import("../controllers/publicacao.controller.js");

describe("Fase 5 - administração", () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("remove uma publicação quando o usuário é admin", async () => {
    mockObterPublicacao.mockResolvedValue({ id: "p1", texto: "Teste" });
    mockExcluirPublicacao.mockResolvedValue({ id: "p1", texto: "Teste" });

    await excluirPublicacaoAdmin(
      { params: { id: "p1" }, user: { role: "ADMIN" } },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockExcluirPublicacao).toHaveBeenCalledWith("p1");
  });

  it("remove um comentário quando o usuário é admin", async () => {
    mockObterComentario.mockResolvedValue({ id: "c1", texto: "Comentário" });
    mockExcluirComentario.mockResolvedValue({ id: "c1", texto: "Comentário" });

    await excluirComentarioAdmin(
      { params: { comentarioId: "c1" }, user: { role: "ADMIN" } },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockExcluirComentario).toHaveBeenCalledWith("c1");
  });
});
