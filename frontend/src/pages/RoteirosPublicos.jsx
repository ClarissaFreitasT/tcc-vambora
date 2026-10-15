import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "../data/api";
import RoteiroCard from "../components/RoteiroCard";

export default function RoteirosPublicos() {
  const [searchParams] = useSearchParams();
  const [roteiros, setRoteiros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState(() => searchParams.get("busca") || "");
  const [category, setCategory] = useState("");

  useEffect(() => {
    async function loadPublicRoteiros() {
      try {
        setRoteiros(await apiFetch("/roteiros/publicos"));
      } catch (requestError) {
        setError(requestError.message);
      } finally {
        setLoading(false);
      }
    }

    loadPublicRoteiros();
  }, []);

  const categories = useMemo(
    () =>
      [
        ...new Set(
          roteiros.flatMap(
            (roteiro) =>
              roteiro.categorias?.map((item) => item.categoria?.nome) || [],
          ),
        ),
      ]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [roteiros],
  );
  const visibleRoteiros = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
    return roteiros.filter((roteiro) => {
      const matchesSearch =
        !normalizedSearch ||
        [roteiro.titulo, roteiro.destino, roteiro.descricao].some((value) =>
          value?.toLocaleLowerCase("pt-BR").includes(normalizedSearch),
        );
      const matchesCategory =
        !category ||
        roteiro.categorias?.some((item) => item.categoria?.nome === category);
      return matchesSearch && matchesCategory;
    });
  }, [category, roteiros, search]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.1),_transparent_45%)] px-4 py-16 lg:px-8">
      <div className="container mx-auto">
        <header className="rounded-[36px] border border-slate-200 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] lg:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2563EB]">
            Explorar roteiros
          </p>
          <h1 className="mt-4 text-4xl font-black text-slate-900">
            Ideias de viagem compartilhadas pela comunidade
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Veja apenas roteiros publicados e abra qualquer um para consultar
            seus dias e atividades.
          </p>
          <div className="mt-7 grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="sr-only" htmlFor="buscar-roteiro">
              Buscar roteiro
            </label>
            <input
              id="buscar-roteiro"
              className="input-field bg-slate-50"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por título, destino ou descrição"
            />
            {categories.length ? (
              <label className="sr-only" htmlFor="categoria-roteiro">
                Filtrar categoria
              </label>
            ) : null}
            {categories.length ? (
              <select
                id="categoria-roteiro"
                className="input-field md:w-56"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">Todas as categorias</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
        </header>

        {loading ? (
          <div className="mt-8 rounded-3xl bg-white p-8 text-slate-500">
            Carregando roteiros públicos...
          </div>
        ) : null}
        {error ? (
          <div className="mt-8 rounded-3xl bg-red-50 p-5 text-sm text-red-800">
            {error}
          </div>
        ) : null}
        {!loading && !error && roteiros.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center text-slate-600">
            Ainda não há roteiros públicos disponíveis.
          </div>
        ) : null}
        {!loading &&
        !error &&
        roteiros.length > 0 &&
        visibleRoteiros.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-14 text-center text-slate-600">
            Nenhum roteiro corresponde à sua busca.
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visibleRoteiros.map((roteiro) => (
            <RoteiroCard key={roteiro.id} roteiro={roteiro} publicOnly />
          ))}
        </div>
      </div>
    </main>
  );
}
