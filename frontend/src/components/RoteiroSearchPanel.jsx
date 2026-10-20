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
      <div className="relative rounded-[28px] border border-slate-200/90 bg-white p-2 text-slate-900 shadow-[0_14px_42px_rgba(15,23,42,.13)] sm:rounded-full sm:p-2 lg:rounded-full lg:px-2 lg:py-2">
        <div className="grid items-center gap-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.8fr)_minmax(76px,.7fr)_minmax(115px,1fr)_52px]">
          <div className="relative min-w-0 px-2 py-1.5 sm:px-4 lg:py-2">
            <label
              className="block text-[11px] font-bold text-slate-700"
              htmlFor="route-destination-search"
            >
              Onde
            </label>
            <input
              id="route-destination-search"
              className="w-full border-0 bg-transparent p-0 pr-12 pt-1 text-sm text-slate-600 outline-none placeholder:text-slate-400 focus:ring-0 lg:pr-0"
              autoComplete="off"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={suggestionsOpen && suggestions.length > 0}
              aria-controls="route-destination-suggestions"
              placeholder="Buscar destinos"
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
          <div className="hidden min-w-0 border-l border-slate-200 px-2 py-1 lg:grid lg:grid-cols-2 lg:gap-2 xl:px-3">
            {renderFilters("desktop").props.children.slice(0, 2)}
          </div>
          <div className="hidden min-w-0 border-l border-slate-200 px-2 py-1 lg:block xl:px-3">
            {renderFilters("desktop").props.children[2]}
          </div>
          <div className="hidden min-w-0 border-l border-slate-200 px-2 py-1 lg:block xl:px-3">
            {renderFilters("desktop").props.children[3]}
          </div>
          <button
            type="submit"
            disabled={busy}
            aria-label={submitLabel}
            className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-900/20 transition hover:bg-rose-700 disabled:opacity-60 lg:static lg:h-12 lg:w-12 lg:translate-y-0"
          >
            {busy ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <svg
                aria-hidden="true"
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="10.8"
                  cy="10.8"
                  r="6.8"
                  stroke="currentColor"
                  strokeWidth="2.2"
                />
                <path
                  d="m16 16 4.3 4.3"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>
        </div>
        <details className="border-t border-slate-100 px-3 pt-2 lg:hidden">
          <summary className="cursor-pointer list-none text-xs font-semibold text-slate-500 hover:text-blue-700">
            {value.categoriaIds.length ||
            value.orcamentoMin ||
            value.orcamentoMax ||
            value.dias ||
            value.avaliacaoMin
              ? "Filtros selecionados · editar"
              : "Adicionar filtros"}
          </summary>
          <div className="mt-3 grid gap-3 rounded-2xl bg-slate-50 p-3 sm:grid-cols-2">
            {renderFilters("mobile", true)}
            {renderCategories()}
          </div>
        </details>
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
      <div className="hidden lg:block">{renderCategories()}</div>
      {validationError ? (
        <p className="text-sm font-medium text-red-700" role="alert">
          {validationError}
        </p>
      ) : null}
    </form>
  );
}
