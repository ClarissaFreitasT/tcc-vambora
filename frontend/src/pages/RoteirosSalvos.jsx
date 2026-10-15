import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Feedback from "../components/Feedback";
import RoteiroCard from "../components/RoteiroCard";
import { apiFetch } from "../data/api";

export default function RoteirosSalvos() {
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    queueMicrotask(async () => {
      try {
        const entries = await apiFetch("/roteiros/salvos");
        setSavedRoutes(entries.map((entry) => entry.roteiro).filter(Boolean));
      } catch (error) {
        setStatus({ type: "error", message: error.message });
      } finally {
        setLoading(false);
      }
    });
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.1),_transparent_40%)] px-4 py-12 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <header className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
          <p className="eyebrow">Sua biblioteca de viagem</p>
          <h1 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            Roteiros salvos
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Guarde ideias úteis e volte a elas quando estiver organizando sua
            próxima viagem. Esta lista é privada e só aparece na sua conta.
          </p>
        </header>

        {status ? (
          <div className="mt-5">
            <Feedback status={status} onDismiss={() => setStatus(null)} />
          </div>
        ) : null}
        {loading ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 text-slate-500">
            Carregando seus roteiros salvos…
          </div>
        ) : null}
        {!loading && !status && savedRoutes.length === 0 ? (
          <section className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-2xl">
              🔖
            </span>
            <h2 className="mt-4 text-xl font-black text-slate-950">
              Sua biblioteca ainda está vazia
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              Ao encontrar um roteiro público interessante, salve-o aqui para
              consultar depois.
            </p>
            <Link to="/roteiros/publicos" className="btn-primary mt-5">
              Explorar roteiros
            </Link>
          </section>
        ) : null}
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {savedRoutes.map((roteiro) => (
            <RoteiroCard key={roteiro.id} roteiro={roteiro} publicOnly />
          ))}
        </div>
      </div>
    </main>
  );
}
