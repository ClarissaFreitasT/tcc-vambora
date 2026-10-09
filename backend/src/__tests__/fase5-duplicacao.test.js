import { jest } from "@jest/globals";

const mockObterRoteiroPorId = jest.fn();
const mockDuplicarRoteiro = jest.fn();

jest.unstable_mockModule("../models/roteiro.model.js", () => ({
  obterRoteiroPorId: mockObterRoteiroPorId,
  duplicarRoteiro: mockDuplicarRoteiro,
}));

const { duplicarRoteiro } =
  await import("../controllers/roteiro.controller.js");

describe("Fase 5 - duplicação de roteiro", () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("duplica um roteiro público para o usuário autenticado", async () => {
    mockObterRoteiroPorId.mockResolvedValue({
      id: "r1",
      usuarioId: "u2",
      publico: true,
      titulo: "Roteiro base",
      destino: "Paris",
      descricao: "Descrição",
      orcamento: 5000,
    });
    mockDuplicarRoteiro.mockResolvedValue({
      id: "r2",
      usuarioId: "u1",
      roteiroOriginalId: "r1",
      titulo: "Roteiro base (Cópia)",
      publico: false,
    });

    await duplicarRoteiro({ params: { id: "r1" }, user: { id: "u1" } }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockDuplicarRoteiro).toHaveBeenCalledWith("r1", "u1");
  });
});
