import { jest } from "@jest/globals";

const mockListarPublicacoesCurtidasUsuario = jest.fn();
const mockListarRoteirosCurtidosUsuario = jest.fn();
const mockObterRoteiroPorId = jest.fn();
const mockContarCurtidas = jest.fn();
const mockObterCurtida = jest.fn();

jest.unstable_mockModule("../models/users.model.js", () => ({}));
jest.unstable_mockModule("../models/publicacao.model.js", () => ({
  listarPublicacoesCurtidasUsuario: mockListarPublicacoesCurtidasUsuario,
}));
jest.unstable_mockModule("../models/roteiro.model.js", () => ({
  listarRoteirosCurtidosUsuario: mockListarRoteirosCurtidosUsuario,
  obterRoteiroPorId: mockObterRoteiroPorId,
  contarCurtidas: mockContarCurtidas,
  obterCurtida: mockObterCurtida,
}));

const { listarCurtidasDoUsuario } =
  await import("../controllers/users.controller.js");
const { obterCurtidasRoteiro } =
  await import("../controllers/roteiro.controller.js");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("Consultas de curtidas", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lista as publicações e os roteiros curtidos pelo usuário autenticado", async () => {
    const publicacoes = [{ id: "p1", texto: "Praia" }];
    const roteiros = [{ id: "r1", titulo: "Fim de semana" }];
    mockListarPublicacoesCurtidasUsuario.mockResolvedValue(publicacoes);
    mockListarRoteirosCurtidosUsuario.mockResolvedValue(roteiros);
    const res = createResponse();

    await listarCurtidasDoUsuario({ user: { id: "u1" } }, res);

    expect(mockListarPublicacoesCurtidasUsuario).toHaveBeenCalledWith("u1");
    expect(mockListarRoteirosCurtidosUsuario).toHaveBeenCalledWith("u1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ publicacoes, roteiros });
  });

  it("retorna contagem e estado pessoal de curtida para roteiro público", async () => {
    mockObterRoteiroPorId.mockResolvedValue({ id: "r1", publico: true });
    mockContarCurtidas.mockResolvedValue(3);
    mockObterCurtida.mockResolvedValue({ id: "like-1" });
    const res = createResponse();

    await obterCurtidasRoteiro(
      { params: { id: "r1" }, user: { id: "u1" } },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      roteiroId: "r1",
      totalCurtidas: 3,
      curtiu: true,
    });
  });

  it("não revela a contagem de roteiro privado de outro usuário", async () => {
    mockObterRoteiroPorId.mockResolvedValue({
      id: "r1",
      publico: false,
      usuarioId: "u2",
    });
    const res = createResponse();

    await obterCurtidasRoteiro(
      { params: { id: "r1" }, user: { id: "u1" } },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ erro: "Roteiro não encontrado" });
    expect(mockContarCurtidas).not.toHaveBeenCalled();
  });
});
