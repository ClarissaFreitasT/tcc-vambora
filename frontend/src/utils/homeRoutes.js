export const emptyRouteFilters = {
  destino: "",
  orcamentoMin: "",
  orcamentoMax: "",
  dias: "",
  avaliacaoMin: "",
  categoriaIds: [],
};

export function normalizeHomeSearch(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

export function getRouteCategories(routes = []) {
  const categories = new Map();
  routes.forEach((route) => {
    route.categorias?.forEach(({ categoria }) => {
      if (categoria?.id && categoria?.nome)
        categories.set(categoria.id, categoria.nome);
    });
  });
  return [...categories]
    .map(([id, nome]) => ({ id, nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export function getRouteDestinations(routes = []) {
  return [
    ...new Set(routes.map((route) => route.destino?.trim()).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function filterHomeRoutes(routes = [], filters = {}) {
  const destination = normalizeHomeSearch(filters.destino);
  const minBudget =
    filters.orcamentoMin == null || filters.orcamentoMin === ""
      ? null
      : Number(filters.orcamentoMin);
  const maxBudget =
    filters.orcamentoMax == null || filters.orcamentoMax === ""
      ? null
      : Number(filters.orcamentoMax);
  const days =
    filters.dias == null || filters.dias === "" ? null : Number(filters.dias);
  const minRating =
    filters.avaliacaoMin == null || filters.avaliacaoMin === ""
      ? null
      : Number(filters.avaliacaoMin);
  const categoryIds = new Set(filters.categoriaIds || []);

  return routes
    .filter((route) => {
      const routeDestination = normalizeHomeSearch(route.destino);
      if (destination && !routeDestination.includes(destination)) return false;
      const budget = route.orcamento == null ? null : Number(route.orcamento);
      if (minBudget !== null && (budget === null || budget < minBudget))
        return false;
      if (maxBudget !== null && (budget === null || budget > maxBudget))
        return false;
      const routeDays = route.totalDias ?? route.dias?.length ?? 0;
      if (days !== null && routeDays !== days) return false;
      const reviews = Number(route.totalAvaliacoes || 0);
      if (
        minRating !== null &&
        reviews > 0 &&
        Number(route.mediaAvaliacao || 0) < minRating
      )
        return false;
      if (categoryIds.size) {
        const matchesCategory = route.categorias?.some(
          ({ categoriaId, categoria }) =>
            categoryIds.has(categoriaId || categoria?.id),
        );
        if (!matchesCategory) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const routeRank = (route) => {
        if (!destination) return 0;
        const value = normalizeHomeSearch(route.destino);
        return value === destination
          ? 4
          : value.startsWith(destination)
            ? 3
            : 2;
      };
      return (
        routeRank(b) - routeRank(a) ||
        Number(b.popularidade || 0) - Number(a.popularidade || 0) ||
        new Date(b.criadoEm || 0).getTime() -
          new Date(a.criadoEm || 0).getTime()
      );
    });
}

export function getRecentRouteSuggestions(
  routes = [],
  excludedIds = [],
  limit = 4,
) {
  const excluded = new Set(excludedIds);
  return [...routes]
    .filter((route) => !excluded.has(route.id))
    .sort(
      (a, b) =>
        new Date(b.criadoEm || 0).getTime() -
        new Date(a.criadoEm || 0).getTime(),
    )
    .slice(0, limit);
}
