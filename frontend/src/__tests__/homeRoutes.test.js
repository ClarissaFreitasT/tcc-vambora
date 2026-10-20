import { describe, expect, it } from "@jest/globals";
import {
  filterHomeRoutes,
  getRecentRouteSuggestions,
  getRouteCategories,
  getRouteDestinations,
  normalizeHomeSearch,
} from "../utils/homeRoutes.js";

const routes = [
  {
    id: "lisbon-popular",
    destino: "Lisboa",
    titulo: "Lisboa cultural",
    orcamento: 1200,
    totalDias: 4,
    mediaAvaliacao: 4.5,
    totalAvaliacoes: 2,
    popularidade: 9,
    criadoEm: "2026-10-01T00:00:00.000Z",
    categorias: [
      {
        categoriaId: "culture",
        categoria: { id: "culture", nome: "Cultural" },
      },
    ],
  },
  {
    id: "lisbon-unrated",
    destino: "Lisboa",
    titulo: "Lisboa econômica",
    orcamento: 700,
    totalDias: 3,
    mediaAvaliacao: 0,
    totalAvaliacoes: 0,
    popularidade: 2,
    criadoEm: "2026-10-18T00:00:00.000Z",
    categorias: [
      { categoriaId: "budget", categoria: { id: "budget", nome: "Econômica" } },
    ],
  },
  {
    id: "paris",
    destino: "Paris",
    orcamento: null,
    totalDias: 4,
    mediaAvaliacao: 5,
    totalAvaliacoes: 1,
    popularidade: 4,
    criadoEm: "2026-10-12T00:00:00.000Z",
    categorias: [
      {
        categoriaId: "culture",
        categoria: { id: "culture", nome: "Cultural" },
      },
    ],
  },
];

describe("Home route search helpers", () => {
  it("normalizes accents and case for destination suggestions", () => {
    expect(normalizeHomeSearch("  LISBÔA ")).toBe("lisboa");
    expect(getRouteDestinations(routes)).toEqual(["Lisboa", "Paris"]);
  });

  it("collects trip categories from actual public route data", () => {
    expect(getRouteCategories(routes)).toEqual([
      { id: "culture", nome: "Cultural" },
      { id: "budget", nome: "Econômica" },
    ]);
  });

  it("respects all active filters and keeps unrated routes eligible", () => {
    const result = filterHomeRoutes(routes, {
      destino: "lis",
      orcamentoMin: "500",
      orcamentoMax: "1300",
      dias: "3",
      avaliacaoMin: "4",
      categoriaIds: ["budget", "culture"],
    });
    expect(result.map((route) => route.id)).toEqual(["lisbon-unrated"]);
  });

  it("excludes routes without budget when budget bounds are active", () => {
    expect(
      filterHomeRoutes(routes, { orcamentoMax: "1500" }).map(
        (route) => route.id,
      ),
    ).toEqual(["lisbon-popular", "lisbon-unrated"]);
  });

  it("offers recent, clearly separate alternatives without duplicating matches", () => {
    expect(
      getRecentRouteSuggestions(routes, ["lisbon-unrated"], 2).map(
        (route) => route.id,
      ),
    ).toEqual(["paris", "lisbon-popular"]);
  });
});
