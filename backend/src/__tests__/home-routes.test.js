import { jest } from "@jest/globals";

const mockObterRoteirosPublicos = jest.fn();
const mockObterRoteirosPopulares = jest.fn();

jest.unstable_mockModule("../models/roteiro.model.js", () => ({
  obterRoteirosPublicos: mockObterRoteirosPublicos,
  obterRoteirosPopulares: mockObterRoteirosPopulares,
}));

const { listarRoteirosPublicos, listarRoteirosPopulares } =
  await import("../controllers/roteiro.controller.js");

function response() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("Home public route endpoints", () => {
  beforeEach(() => jest.clearAllMocks());

  it("passes the Home filters to the public route model", async () => {
    const res = response();
    mockObterRoteirosPublicos.mockResolvedValue([{ id: "r1" }]);

    await listarRoteirosPublicos(
      {
        query: {
          destino: "Lisboa",
          termo: "cultural",
          orcamentoMin: "500",
          orcamentoMax: "2000",
          dias: "4",
          avaliacaoMin: "4",
          categorias: "culture,nature",
        },
      },
      res,
    );

    expect(mockObterRoteirosPublicos).toHaveBeenCalledWith({
      destino: "Lisboa",
      termo: "cultural",
      orcamentoMin: 500,
      orcamentoMax: 2000,
      dias: 4,
      avaliacaoMin: 4,
      categoriaIds: ["culture", "nature"],
    });
    expect(res.json).toHaveBeenCalledWith([{ id: "r1" }]);
  });

  it("rejects inconsistent budget bounds before querying", async () => {
    const res = response();
    await listarRoteirosPublicos(
      { query: { orcamentoMin: "3000", orcamentoMax: "1000" } },
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mockObterRoteirosPublicos).not.toHaveBeenCalled();
  });

  it("limits the number of popular routes requested by the Home", async () => {
    const res = response();
    mockObterRoteirosPopulares.mockResolvedValue([]);
    await listarRoteirosPopulares({ query: { limit: "4" } }, res);
    expect(mockObterRoteirosPopulares).toHaveBeenCalledWith(4);
  });
});
