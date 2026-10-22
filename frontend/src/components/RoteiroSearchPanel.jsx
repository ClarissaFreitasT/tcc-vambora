import { useMemo, useState } from "react";
import { normalizeHomeSearch } from "../utils/homeRoutes";

export default function RoteiroSearchPanel({
  destinations = [],
  categories = [],
  value,
  onChange,
  onSubmit,
  busy = false,
  submitLabel = "Buscar roteiros",
}) {
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const normalized = normalizeHomeSearch(value.destino);
  const suggestions = useMemo(() => {
    if (!normalized) return [];
    return destinations
      .filter((destination) =>
        normalizeHomeSearch(destination).includes(normalized),
      )
      .sort((a, b) => {
        const aStarts = normalizeHomeSearch(a).startsWith(normalized);
        const bStarts = normalizeHomeSearch(b).startsWith(normalized);
        return Number(bStarts) - Number(aStarts) || a.localeCompare(b, "pt-BR");
      })
      .slice(0, 6);
  }, [destinations, normalized]);

  function updateField(name, nextValue) {
    onChange({ ...value, [name]: nextValue });
  }

  function toggleCategory(id) {
    const selected = value.categoriaIds.includes(id);
    updateField(
      "categoriaIds",
      selected
        ? value.categoriaIds.filter((categoryId) => categoryId !== id)
        : [...value.categoriaIds, id],
    );
  }

  function renderFilters(idSuffix, compact = false) {
    const inputClass = compact
      ? "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-blue-400"
      : "w-full min-w-0 border-0 bg-transparent px-0 py-1 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400 focus:ring-0";
    const labelClass = compact
      ? "grid min-w-0 gap-1 text-xs font-bold text-slate-600"
      : "grid min-w-0 gap-0.5 text-[11px] font-bold text-slate-700";
    return (
      <>
        <label className={labelClass} htmlFor={`route-budget-min-${idSuffix}`}>
          {compact ? "Orçamento mínimo · R$" : "Orçamento"}
          <input
            id={`route-budget-min-${idSuffix}`}
            className={inputClass}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder={compact ? "Mínimo" : "Mín."}
            value={value.orcamentoMin}
            onChange={(event) =>
              updateField("orcamentoMin", event.target.value)
            }
          />
        </label>
        <label
          className={`${labelClass} ${compact ? "" : "border-l border-slate-200 pl-3"}`}
          htmlFor={`route-budget-max-${idSuffix}`}
        >
          {compact ? (
            "Orçamento máximo · R$"
          ) : (
            <span className="invisible" aria-hidden="true">
              Orçamento
            </span>
          )}
          <input
            id={`route-budget-max-${idSuffix}`}
            className={inputClass}
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder={compact ? "Máximo" : "Máx."}
            value={value.orcamentoMax}
            onChange={(event) =>
              updateField("orcamentoMax", event.target.value)
            }
          />
        </label>
        <label className={labelClass} htmlFor={`route-days-${idSuffix}`}>
          {compact ? "Quantidade exata de dias" : "Dias"}
          <input
            id={`route-days-${idSuffix}`}
            className={inputClass}
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            placeholder={compact ? "Qualquer duração" : "Qualquer"}
            value={value.dias}
            onChange={(event) => updateField("dias", event.target.value)}
          />
        </label>
        <label className={labelClass} htmlFor={`route-rating-${idSuffix}`}>
          {compact ? "Avaliação mínima" : "Nota mínima"}
          <select
            id={`route-rating-${idSuffix}`}
            className={inputClass}
            value={value.avaliacaoMin}
            onChange={(event) =>
              updateField("avaliacaoMin", event.target.value)
            }
          >
            <option value="">Qualquer avaliação</option>
            {[1, 2, 3, 4, 5].map((rating) => (
              <option key={rating} value={rating}>
                {rating}+ estrelas
              </option>
            ))}
          </select>
        </label>
      </>
    );
  }

  function renderCategories() {
    if (!categories.length) return null;
    return (
      <fieldset className="min-w-0">
        <legend className="sr-only">Tipos de viagem</legend>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Tipo
          </span>
          {categories.map((category) => {
            const active = value.categoriaIds.includes(category.id);
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggleCategory(category.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${active ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 bg-white/90 text-slate-600 hover:border-blue-300 hover:text-blue-700"}`}
              >
                {category.nome}
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const minimum = Number(value.orcamentoMin);
        const maximum = Number(value.orcamentoMax);
        if (value.orcamentoMin && value.orcamentoMax && minimum > maximum) {
          setValidationError(
            "O orçamento mínimo não pode ser maior que o máximo.",
          );
          return;
        }
        setValidationError(null);
        setSuggestionsOpen(false);
        onSubmit(value);
      }}
      className="grid gap-3"
    >
      <div className="relative rounded-[24px] border border-white/30 bg-white/95 p-3 text-slate-900 shadow-[0_18px_52px_rgba(1,12,31,.28)] backdrop-blur-xl sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
          <div className="relative min-w-0">
            <label
              className="block text-xs font-extrabold uppercase tracking-[.12em] text-slate-500"
              htmlFor="route-destination-search"
            >
              Destino, país ou roteiro
            </label>
            <input
              id="route-destination-search"
              className="mt-1 w-full border-0 bg-transparent px-0 py-2 text-base font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={suggestionsOpen && suggestions.length > 0}
              aria-controls="route-destination-suggestions"
              placeholder="Para onde você quer ir?"
              value={value.destino}
              onFocus={() => setSuggestionsOpen(true)}
              onBlur={() =>
                window.setTimeout(() => setSuggestionsOpen(false), 120)
              }
              onKeyDown={(event) => {
                if (event.key === "Escape") setSuggestionsOpen(false);
                if (event.key === "ArrowDown" && suggestions.length) {
                  event.preventDefault();
                  document
                    .getElementById("route-destination-suggestions")
                    ?.querySelector("button")
                    ?.focus();
                }
              }}
              onChange={(event) => {
                updateField("destino", event.target.value);
                setSuggestionsOpen(true);
              }}
            />
          </div>
          <button
            type="button"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((open) => !open)}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
          >
            Filtros
            {value.categoriaIds.length ||
            value.orcamentoMin ||
            value.orcamentoMax ||
            value.dias ||
            value.avaliacaoMin
              ? " · ativos"
              : ""}
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-extrabold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 disabled:opacity-60"
          >
            {busy ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : null}
            {busy ? "Buscando" : submitLabel}
          </button>
        </div>
        {filtersOpen ? (
          <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2 lg:grid-cols-4">
            {renderFilters("panel", true)}
            <div className="sm:col-span-2 lg:col-span-4">
              {renderCategories()}
            </div>
          </div>
        ) : null}
        {suggestionsOpen && suggestions.length ? (
          <div
            id="route-destination-suggestions"
            role="listbox"
            aria-label="Sugestões de destinos"
            className="absolute left-3 right-3 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 text-slate-900 shadow-xl sm:left-5 sm:right-5 lg:left-4 lg:right-auto lg:w-[min(360px,45vw)]"
          >
            {suggestions.map((destination) => (
              <button
                key={destination}
                type="button"
                role="option"
                aria-selected={value.destino === destination}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  updateField("destino", destination);
                  setSuggestionsOpen(false);
                }}
                className="block w-full rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-blue-50"
              >
                {destination}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {validationError ? (
        <p className="text-sm font-medium text-red-700" role="alert">
          {validationError}
        </p>
      ) : null}
    </form>
  );
}
