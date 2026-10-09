import { jest } from "@jest/globals";

const mockListarCategorias = jest.fn();
const mockCriarCategoria = jest.fn();
const mockObterCategoria = jest.fn();
const mockAssociarCategoria = jest.fn();
const mockObterRoteiroPorId = jest.fn();

jest.unstable_mockModule("../models/categoria.model.js", () => ({
  listarCategorias: mockListarCategorias,
  criarCategoria: mockCriarCategoria,
  obterCategoriaPorId: mockObterCategoria,
  associarCategoriaAoRoteiro: mockAssociarCategoria,
}));

jest.unstable_mockModule("../models/roteiro.model.js", () => ({
  obterRoteiroPorId: mockObterRoteiroPorId,
  usuarioPodeEditar: jest.fn(),
}));

const { listarCategorias, criarCategoria, associarCategoriaAoRoteiro } =
  await import("../controllers/categoria.controller.js");

describe("Fase 4 - categorias de roteiro", () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockObterRoteiroPorId.mockResolvedValue({ id: "r1", usuarioId: "u1" });
    mockObterCategoria.mockResolvedValue({ id: "c1", nome: "Natureza" });
  });

  it("lista as categorias disponíveis", async () => {
    mockListarCategorias.mockResolvedValue([{ id: "c1", nome: "Natureza" }]);

    await listarCategorias({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockListarCategorias).toHaveBeenCalled();
  });

  it("cria uma categoria com permissão de admin", async () => {
    mockCriarCategoria.mockResolvedValue({ id: "c2", nome: "Cultural" });

    await criarCategoria(
      {
        body: { nome: "Cultural" },
        user: { role: "ADMIN" },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockCriarCategoria).toHaveBeenCalledWith("Cultural");
  });

  it("associa uma categoria ao roteiro do usuário autenticado", async () => {
    mockAssociarCategoria.mockResolvedValue({
      roteiroId: "r1",
      categoriaId: "c1",
    });

    await associarCategoriaAoRoteiro(
      {
        params: { id: "r1", categoriaId: "c1" },
        user: { id: "u1" },
      },
      res,
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockAssociarCategoria).toHaveBeenCalledWith("r1", "c1");
  });
});
