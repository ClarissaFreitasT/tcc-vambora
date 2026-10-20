import { jest } from "@jest/globals";

const mockFindMany = jest.fn();
jest.unstable_mockModule("../config/prisma.js", () => ({
  prisma: { roteiro: { findMany: mockFindMany } },
}));

const { obterRoteirosPublicos, obterRoteirosPopulares } =
  await import("../models/roteiro.model.js");

function route({
  id,
  destino,
  titulo,
  budget,
  days,
  likes = 0,
  reviews = [],
  copies = 0,
  category = "cultura",
  createdAt = "2026-10-18T12:00:00.000Z",
}) {
  return {
    id,
    titulo,
    destino,
    descricao: "Passeio cultural",
    publico: true,
    criadoEm: new Date(createdAt),
    orcamento: budget,
    imagemUrl: null,
    usuario: { id: "u1", nome: "Viajante" },
    categorias: [
      { categoriaId: category, categoria: { id: category, nome: category } },
    ],
    dias: Array.from({ length: days }, (_, index) => ({
      id: `${id}-day-${index}`,
      numeroDia: index + 1,
    })),
    favoritos: Array.from({ length: likes }, (_, index) => ({
      id: `${id}-like-${index}`,
    })),
    reviews: reviews.map((nota, index) => ({
      nota,
      id: `${id}-review-${index}`,
    })),
    _count: { roteirosDuplicados: copies },
  };
}

const dataset = [
  route({
    id: "lisbon-good",
    destino: "Lisboa",
    titulo: "Lisboa cultural",
    budget: 1200,
    days: 4,
    likes: 2,
    reviews: [5, 4],
    copies: 1,
    category: "culture",
  }),
  route({
    id: "lisbon-unrated",
    destino: "Lisboa",
    titulo: "Lisboa econômica",
    budget: 700,
    days: 3,
    category: "budget",
    createdAt: "2026-10-19T08:00:00.000Z",
  }),
  route({
    id: "paris",
    destino: "Paris",
    titulo: "Paris",
    budget: null,
    days: 4,
    reviews: [5],
    category: "culture",
  }),
];

describe("public route search model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindMany.mockResolvedValue(dataset);
  });

  it("combines all filters while allowing routes without ratings", async () => {
    const results = await obterRoteirosPublicos({
      destino: "lis",
      orcamentoMin: 500,
      orcamentoMax: 1300,
      dias: 3,
      avaliacaoMin: 4,
      categoriaIds: ["budget", "culture"],
    });
    expect(results.map(({ id }) => id)).toEqual(["lisbon-unrated"]);
    expect(results[0]).toMatchObject({
      totalDias: 3,
      totalAvaliacoes: 0,
      totalCurtidas: 0,
      imagemUrl: null,
    });
    expect(results[0]).not.toHaveProperty("favoritos");
    expect(results[0]).not.toHaveProperty("reviews");
  });

  it("does not treat a missing budget as a match for a budget range", async () => {
    const results = await obterRoteirosPublicos({ orcamentoMax: 1500 });
    expect(results.map(({ id }) => id)).not.toContain("paris");
  });

  it("sorts exact destination matches before partial matches and then by popularity", async () => {
    const results = await obterRoteirosPublicos({ destino: "Lisboa" });
    expect(results.slice(0, 2).map(({ id }) => id)).toEqual([
      "lisbon-good",
      "lisbon-unrated",
    ]);
  });

  it("counts copies as usage and excludes routes without engagement from popular", async () => {
    const results = await obterRoteirosPopulares(4);
    expect(results.map(({ id }) => id)).not.toContain("lisbon-unrated");
    expect(results[0].totalUsos).toBe(1);
    expect(results[0].popularidade).toBeGreaterThan(0);
    expect(results[0]).not.toHaveProperty("_count");
  });
});
