import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../data/api";

export default function PlanejamentosIaLista({ roteiroId = null }) {
  const [lista, setLista] = useState([]);
  const [erro, setErro] = useState("");
  useEffect(() => {
    let ativo = true;
    apiFetch("/planejamentos-ia").then((dados) => {
      if (ativo) setLista(dados.filter((p) => roteiroId ? p.roteiroId === roteiroId : true));
    }).catch((e) => { if (ativo) setErro(e.message); });
    return () => { ativo = false; };
  }, [roteiroId]);
  if (roteiroId) return lista.map((p) => <Link key={p.id} className="btn-secondary" to={`/planejamentos-ia/${p.id}`}>Ajustar com IA</Link>);
  return <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6" aria-label="Planejamentos com IA">
    <h2 className="text-xl font-bold">Planejamentos com IA</h2>
    <p className="mt-2 text-sm text-slate-600">Retome suas prévias e conversas. Somente versões confirmadas entram nos seus roteiros.</p>
    {erro && <p role="alert" className="mt-3 text-red-700">{erro}</p>}
    {!lista.length && !erro && <p className="mt-3 text-sm text-slate-500">Nenhum planejamento em andamento.</p>}
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">{lista.map((p) => <li key={p.id} className="rounded-2xl bg-slate-50 p-4">
      <Link className="font-semibold text-blue-700 hover:underline" to={`/planejamentos-ia/${p.id}`}>
        {p.propostas[0]?.conteudo?.titulo || p.roteiro?.titulo || p.dadosIniciais.cidades.map((c) => c.nome).join(" → ")}
      </Link>
      <p className="mt-1 text-sm text-slate-500">{p.roteiroId ? "Roteiro salvo · continuar conversa" : "Prévia · ainda não salva"}</p>
    </li>)}</ul>
  </section>;
}
