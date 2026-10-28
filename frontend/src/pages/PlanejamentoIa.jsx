import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../data/api";
import { dataDoDia, dataViagem, distribuicao, mudancasViagem, validarFormularioIa } from "../utils/planejamentoIa";

const cidadeVazia = () => ({ nome: "", regiao: "", pais: "" });

function Previa({ conteudo }) {
  const divisao = distribuicao(conteudo);
  return <>
    <h2 className="text-2xl font-black">{conteudo.titulo}</h2>
    <p className="mt-2 text-sm text-slate-600">{dataViagem(conteudo.dataIda)} a {dataViagem(conteudo.dataVolta)} · {conteudo.pessoas} pessoa(s)</p>
    <p className="mt-3 whitespace-pre-wrap text-slate-700">{conteudo.descricao}</p>
    <ul className="my-5 flex flex-wrap gap-2">{divisao.map((c, i) => <li key={i} className="rounded-full bg-blue-50 px-3 py-2 text-sm text-blue-800">{c.nome}: {c.dias} dia(s)</li>)}</ul>
    <div className="grid gap-4">{conteudo.dias.map((dia, i) => <article key={dia.id || i} className="rounded-2xl border border-slate-200 p-5">
      <p className="text-sm font-semibold text-blue-700">Dia {dia.numeroDia || i + 1} · {dataDoDia(conteudo.dataIda, i)}</p>
      <h3 className="mt-1 text-lg font-bold">{dia.titulo}</h3>
      <p className="text-sm text-slate-500">{dia.cidadePrincipal || conteudo.cidades?.[dia.cidadeIndice]?.nome}</p>
      <ol className="mt-4 grid gap-4">{dia.itens.map((item, index) => <li key={item.id || index}>
        <p className="font-semibold">{item.horarioInicio ? `${item.horarioInicio.length > 5 ? item.horarioInicio.slice(11, 16) : item.horarioInicio} · ` : ""}{item.titulo}</p>
        {item.localNome && <p className="text-sm text-blue-700">{item.localNome}</p>}
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.descricao}</p>
      </li>)}</ol>
    </article>)}</div>
  </>;
}

export default function PlanejamentoIa() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ cidades: [cidadeVazia()], pessoas: 1, dataIda: "", dataVolta: "" });
  const [planejamento, setPlanejamento] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [carregando, setCarregando] = useState(Boolean(id));
  const [aba, setAba] = useState("roteiro");
  const [aviso, setAviso] = useState("");
  const operacao = useRef(null);
  const emExecucao = useRef(false);
  const ultimaMensagem = useRef(null);

  useEffect(() => {
    let ativo = true;
    if (id) apiFetch(`/planejamentos-ia/${id}`).then((p) => { if (ativo) { setPlanejamento(p); setCarregando(false); } })
      .catch((e) => { if (ativo) { setErro(e.message); setCarregando(false); } });
    return () => { ativo = false; };
  }, [id]);

  useEffect(() => { ultimaMensagem.current?.scrollIntoView({ block: "nearest" }); }, [planejamento?.mensagens.length]);

  const proposta = planejamento?.propostas[0];
  const temVersao = Boolean(proposta || planejamento?.roteiro || planejamento?.mensagens.some((m) => m.papel === "assistente"));
  const conteudo = proposta?.conteudo || planejamento?.roteiro;
  const mudancas = mudancasViagem(planejamento?.roteiro || planejamento?.dadosIniciais, proposta?.conteudo);
  const gerando = ocupado || (planejamento?.gerandoAte && new Date(planejamento.gerandoAte) > new Date());

  function cidadeCampo(index, campo, valor) {
    setForm((f) => ({ ...f, cidades: f.cidades.map((c, i) => i === index ? { ...c, [campo]: valor } : c) }));
  }
  function mover(index, passo) {
    setForm((f) => { const cidades = [...f.cidades]; [cidades[index], cidades[index + passo]] = [cidades[index + passo], cidades[index]]; return { ...f, cidades }; });
  }

  async function gerar(event) {
    event.preventDefault();
    if (emExecucao.current) return;
    const textoPedido = mensagem.trim() || (!temVersao ? "Gere a primeira versão com os dados iniciais da viagem." : "");
    const validacao = id ? (!textoPedido ? "Escreva o ajuste desejado." : null) : validarFormularioIa(form);
    if (validacao) { setErro(validacao); return; }
    emExecucao.current = true;
    setOcupado(true); setErro(""); setAviso("");
    const payload = id ? { mensagem: textoPedido } : { ...form, pessoas: Number(form.pessoas) };
    const assinatura = JSON.stringify({ id, payload });
    if (operacao.current?.assinatura !== assinatura) operacao.current = { assinatura, chave: crypto.randomUUID() };
    try {
      const p = await apiFetch(id ? `/planejamentos-ia/${id}/mensagens` : "/planejamentos-ia", { method: "POST", body: JSON.stringify({ ...payload, operacaoId: operacao.current.chave }) });
      operacao.current = null;
      setPlanejamento(p); setMensagem(""); setAba("roteiro");
      if (!id) navigate(`/planejamentos-ia/${p.id}`, { replace: true });
    } catch (e) {
      setErro(e.message);
      // Preserve the key after ambiguous network failures to avoid paying twice.
      if (e.novaTentativa || (e.status && e.status !== 409)) operacao.current = null;
      if (e.planejamentoId) {
        const p = await apiFetch(`/planejamentos-ia/${e.planejamentoId}`).catch(() => null);
        if (p) { setPlanejamento(p); if (!id) navigate(`/planejamentos-ia/${p.id}`, { replace: true }); }
      }
    } finally { setOcupado(false); emExecucao.current = false; }
  }

  async function acao(tipo) {
    if (emExecucao.current) return;
    if (tipo === "excluir" && !window.confirm("Excluir este planejamento e a conversa? Um roteiro já salvo será preservado.")) return;
    emExecucao.current = true; setOcupado(true); setErro(""); setAviso("");
    try {
      if (tipo === "atualizar") setPlanejamento(await apiFetch(`/planejamentos-ia/${id}`));
      else if (tipo === "excluir") { await apiFetch(`/planejamentos-ia/${id}`, { method: "DELETE" }); navigate("/roteiros"); }
      else {
        await apiFetch(`/planejamentos-ia/${id}/propostas/${proposta.id}/${tipo}`, { method: "POST" });
        setPlanejamento(await apiFetch(`/planejamentos-ia/${id}`));
        setAviso(tipo === "aplicar" ? "Versão confirmada e salva no seu roteiro." : "Proposta descartada. Os próximos ajustes partirão do roteiro salvo ou dos dados iniciais.");
      }
    } catch (e) { setErro(e.message); } finally { setOcupado(false); emExecucao.current = false; }
  }

  return <main className="min-h-screen bg-slate-50 px-4 py-10 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <Link className="text-sm font-semibold text-blue-700" to="/roteiros">← Meus roteiros</Link>
      <header className="my-6"><p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Vambora com IA</p>
        <h1 className="mt-2 text-3xl font-black">{id ? "Sua viagem, do seu jeito" : "Vamos planejar sua próxima viagem?"}</h1>
        <p className="mt-3 text-slate-600">Receba uma sugestão de dias, passeios e deslocamentos. Ajuste pelo chat e confirme quando estiver pronto.</p>
      </header>
      {erro && <p role="alert" className="mb-5 rounded-2xl bg-red-50 p-4 text-red-800">{erro}</p>}
      {aviso && <p role="status" className="mb-5 rounded-2xl bg-green-50 p-4 text-green-800">{aviso}</p>}
      {carregando && <p role="status">Carregando planejamento…</p>}
      {!id && <form onSubmit={gerar} className="max-w-3xl rounded-3xl bg-white p-6 shadow-sm sm:p-8">
        <fieldset disabled={ocupado}>
          <legend className="text-xl font-bold">Para onde vamos?</legend>
          <p className="mt-2 text-sm text-slate-500">Informe as cidades na ordem da viagem. A IA distribui os dias entre elas.</p>
          <div className="mt-5 grid gap-4">{form.cidades.map((c, i) => <div key={i} className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-3 flex flex-wrap items-center gap-3"><strong>Cidade {i + 1}</strong>
              <button type="button" className="text-sm text-blue-700 disabled:opacity-40" disabled={i === 0 || ocupado} onClick={() => mover(i, -1)} aria-label={`Mover cidade ${i + 1} para cima`}>↑ Subir</button>
              <button type="button" className="text-sm text-blue-700 disabled:opacity-40" disabled={i === form.cidades.length - 1 || ocupado} onClick={() => mover(i, 1)} aria-label={`Mover cidade ${i + 1} para baixo`}>↓ Descer</button>
              {form.cidades.length > 1 && <button type="button" className="text-sm text-red-700" onClick={() => setForm((f) => ({ ...f, cidades: f.cidades.filter((_, index) => index !== i) }))}>Remover</button>}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">{[["nome", "Cidade"], ["regiao", "Estado/região"], ["pais", "País"]].map(([campo, label]) => <label className="grid gap-1 text-sm" key={campo}>{label}<input className="input-field" required maxLength={80} value={c[campo]} onChange={(e) => cidadeCampo(i, campo, e.target.value)} /></label>)}</div>
          </div>)}</div>
          <button type="button" className="btn-secondary mt-4" disabled={form.cidades.length >= 10 || ocupado} onClick={() => setForm((f) => ({ ...f, cidades: [...f.cidades, cidadeVazia()] }))}>+ Adicionar cidade</button>
          <div className="my-6 grid gap-4 sm:grid-cols-3">
            <label className="grid gap-1 text-sm">Pessoas<input className="input-field" type="number" min="1" max="50" required value={form.pessoas} onChange={(e) => setForm({ ...form, pessoas: e.target.value })} /></label>
            <label className="grid gap-1 text-sm">Ida<input className="input-field" type="date" required value={form.dataIda} onChange={(e) => setForm({ ...form, dataIda: e.target.value })} /></label>
            <label className="grid gap-1 text-sm">Volta<input className="input-field" type="date" min={form.dataIda} required value={form.dataVolta} onChange={(e) => setForm({ ...form, dataVolta: e.target.value })} /></label>
          </div>
          <p className="mb-5 text-sm text-slate-500">Até 30 dias, incluindo ida e volta. Pelo menos um dia por cidade. As sugestões não consultam preços ou disponibilidade em tempo real.</p>
          <button className="btn-primary" disabled={ocupado}>{ocupado ? "Criando sua primeira versão…" : "Gerar roteiro com IA"}</button>
          <Link className="ml-4 inline-block text-sm text-blue-700" to="/roteiros/novo">Criar manualmente</Link>
        </fieldset>
      </form>}
      {id && planejamento && <>
        <div className="mb-5 flex flex-wrap gap-3">
          <button className="btn-secondary" disabled={ocupado} onClick={() => acao("atualizar")}>Atualizar</button>
          {planejamento.roteiroId && <Link className="btn-secondary" to={`/roteiros/${planejamento.roteiroId}`}>Abrir roteiro salvo</Link>}
          <button className="btn-secondary text-red-700" disabled={gerando} onClick={() => acao("excluir")}>Excluir planejamento</button>
        </div>
        <div className="mb-4 flex gap-2 lg:hidden" role="tablist" aria-label="Planejamento">
          {(temVersao ? ["roteiro", "chat"] : ["roteiro"]).map((tab) => <button key={tab} role="tab" aria-selected={aba === tab} className={aba === tab ? "btn-primary" : "btn-secondary"} onClick={() => setAba(tab)}>{tab === "roteiro" ? "Roteiro" : "Chat"}</button>)}
        </div>
        {gerando && <p role="status" className="mb-4 rounded-xl bg-blue-50 p-4 text-blue-800">Preparando a resposta… Isso pode levar até um minuto. Se você saiu da página, use Atualizar para recuperar o resultado.</p>}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <section className={`${aba !== "roteiro" ? "hidden lg:block" : ""} min-w-0 rounded-3xl bg-white p-6 shadow-sm`}>
            {proposta && <div className="mb-5 rounded-2xl bg-amber-50 p-4">
              <h2 className="font-bold text-amber-900">Prévia — aguardando sua confirmação</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-amber-900">{proposta.resumo}</p>
              {mudancas.length > 0 && <ul className="mt-3 list-inside list-disc text-sm font-semibold">{mudancas.map((m) => <li key={m}>{m}</li>)}</ul>}
              {planejamento.roteiro && proposta.revisaoBase !== planejamento.roteiro.revisao && <p className="mt-3 text-sm font-bold text-red-800">O roteiro foi editado. Peça ao chat uma proposta atualizada antes de aplicar.</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn-primary" disabled={gerando || Boolean(planejamento.roteiro && proposta.revisaoBase !== planejamento.roteiro.revisao)} onClick={() => acao("aplicar")}>{planejamento.roteiroId ? "Aplicar alterações" : "Salvar roteiro"}</button>
                <button className="btn-secondary" disabled={gerando} onClick={() => acao("descartar")}>Descartar proposta</button>
              </div>
            </div>}
            {conteudo ? <Previa conteudo={conteudo} /> : <div><p className="text-slate-600">Nenhuma proposta disponível. {temVersao ? "Peça uma nova versão no chat." : "Tente gerar novamente com os dados da viagem. O chat ficará disponível após a primeira versão."}</p><p className="my-3 text-sm">{planejamento.dadosIniciais.cidades.map((c) => c.nome).join(" → ")} · {dataViagem(planejamento.dadosIniciais.dataIda)} a {dataViagem(planejamento.dadosIniciais.dataVolta)} · {planejamento.dadosIniciais.pessoas} pessoa(s)</p>{!temVersao && <button className="btn-primary" disabled={gerando} onClick={gerar}>Tentar gerar roteiro</button>}</div>}
          </section>
          {temVersao && <section className={`${aba !== "chat" ? "hidden lg:block" : ""} min-w-0 rounded-3xl bg-white p-6 shadow-sm lg:sticky lg:top-6`}>
            <h2 className="text-xl font-bold">Ajuste com o Gemini</h2>
            <p className="mt-2 text-sm text-slate-500">Peça mudanças em atividades, cidades, datas ou pessoas. O roteiro salvo só muda com sua confirmação.</p>
            <div className="my-5 max-h-[55vh] space-y-3 overflow-y-auto" role="log" aria-label="Conversa com a IA" aria-live="polite">
              {planejamento.mensagens.map((m) => <div key={m.id} className={`rounded-2xl p-4 ${m.papel === "usuario" ? "ml-5 bg-blue-50" : "mr-5 bg-slate-100"}`}>
                <p className="mb-1 text-xs font-bold text-slate-500">{m.papel === "usuario" ? "Você" : "Gemini"}</p><p className="whitespace-pre-wrap break-words text-sm leading-6">{m.texto}</p>
              </div>)}<div ref={ultimaMensagem} />
            </div>
            <form onSubmit={gerar}>
              <label className="grid gap-2 text-sm font-medium">O que você quer ajustar?<textarea className="input-field min-h-28" maxLength={2000} required value={mensagem} disabled={gerando} onChange={(e) => setMensagem(e.target.value)} placeholder="Quero mais atividades ao ar livre e um dia extra na segunda cidade." /></label>
              <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs text-slate-500">{mensagem.length}/2000</span><button className="btn-primary" disabled={gerando || !mensagem.trim()}>{ocupado ? "Enviando…" : "Enviar pedido"}</button></div>
            </form>
          </section>}
        </div>
      </>}
    </div>
  </main>;
}
