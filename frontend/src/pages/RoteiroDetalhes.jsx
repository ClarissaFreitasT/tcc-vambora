import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../data/api";
import { useAuth } from "../context/useAuth";
import { profilePath } from "../utils/profile";

const emptyItem = {
  titulo: "",
  descricao: "",
  localNome: "",
  horarioInicio: "",
  custoEstimado: "",
};

function money(value) {
  if (value === null || value === undefined || value === "")
    return "Não informado";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value));
}

function formatTime(value) {
  if (!value) return "";
  const time = String(value);
  return time.match(/(?:T|\s|^)(\d{2}:\d{2})/)?.[1] || time.slice(0, 5);
}

function Field({ label, children }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}

export default function RoteiroDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [roteiro, setRoteiro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [editingRoteiro, setEditingRoteiro] = useState(false);
  const [roteiroForm, setRoteiroForm] = useState({});
  const [newDayTitle, setNewDayTitle] = useState("");
  const [editingDay, setEditingDay] = useState(null);
  const [itemDay, setItemDay] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState(emptyItem);
  const [copying, setCopying] = useState(false);
  const [totalCurtidas, setTotalCurtidas] = useState(0);
  const [curtido, setCurtido] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [resumoAvaliacoes, setResumoAvaliacoes] = useState({
    media: 0,
    total: 0,
  });
  const [nota, setNota] = useState(0);
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState("");
  const [socialBusy, setSocialBusy] = useState(false);

  const isOwner = Boolean(user?.id && roteiro?.usuarioId === user.id);

  async function loadRoteiro() {
    try {
      const data = await apiFetch(`/roteiros/${id}`);
      setRoteiro(data);
      setRoteiroForm({
        titulo: data.titulo,
        destino: data.destino,
        descricao: data.descricao || "",
        imagemUrl: data.imagemUrl || "",
        orcamento: data.orcamento ?? "",
        publico: data.publico,
      });
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialRoteiro() {
      if (!localStorage.getItem("vambora_token")) {
        navigate("/login", { state: { from: `/roteiros/${id}` } });
        return;
      }
      try {
        const data = await apiFetch(`/roteiros/${id}`);
        setRoteiro(data);
        setRoteiroForm({
          titulo: data.titulo,
          destino: data.destino,
          descricao: data.descricao || "",
          imagemUrl: data.imagemUrl || "",
          orcamento: data.orcamento ?? "",
          publico: data.publico,
        });

        if (data.publico) {
          const [likesResult, reviewsResult, savedResult] =
            await Promise.allSettled([
              apiFetch(`/roteiros/${id}/curtidas`),
              apiFetch(`/roteiros/${id}/avaliacoes`),
              isAuthenticated
                ? apiFetch("/roteiros/salvos")
                : Promise.resolve([]),
            ]);

          if (likesResult.status === "fulfilled") {
            setTotalCurtidas(likesResult.value?.totalCurtidas || 0);
            setCurtido(Boolean(likesResult.value?.curtiu));
          }
          if (reviewsResult.status === "fulfilled") {
            setAvaliacoes(reviewsResult.value?.avaliacoes || []);
            setResumoAvaliacoes(
              reviewsResult.value?.resumo || { media: 0, total: 0 },
            );
            const ownReview = reviewsResult.value?.avaliacoes?.find(
              (review) => review.usuarioId === user?.id,
            );
            if (ownReview) setNota(ownReview.nota);
          }
          if (savedResult.status === "fulfilled") {
            setSalvo(
              savedResult.value.some(
                (entry) => entry.roteiroId === id || entry.roteiro?.id === id,
              ),
            );
          }
        }
      } catch (error) {
        setStatus(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadInitialRoteiro();
  }, [id, navigate, isAuthenticated, user?.id]);

  async function saveRoteiro(event) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await apiFetch(`/roteiros/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...roteiroForm,
          orcamento:
            roteiroForm.orcamento === "" ? null : Number(roteiroForm.orcamento),
        }),
      });
      await loadRoteiro();
      setEditingRoteiro(false);
      setStatus("Roteiro atualizado.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function addDay(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const nextNumber =
        (roteiro.dias?.reduce((max, day) => Math.max(max, day.numeroDia), 0) ||
          0) + 1;
      await apiFetch("/dias", {
        method: "POST",
        body: JSON.stringify({
          roteiroId: id,
          numeroDia: nextNumber,
          titulo: newDayTitle || `Dia ${nextNumber}`,
        }),
      });
      setNewDayTitle("");
      await loadRoteiro();
      setStatus("Dia adicionado.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveDay(event, day) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const updatedDay = await apiFetch(`/dias/${day.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          numeroDia: day.numeroDia,
          titulo: editingDay.titulo,
        }),
      });
      setRoteiro((current) =>
        current
          ? {
              ...current,
              dias: current.dias.map((item) =>
                item.id === day.id
                  ? {
                      ...item,
                      ...updatedDay,
                      titulo: updatedDay.titulo || item.titulo,
                    }
                  : item,
              ),
            }
          : current,
      );
      setEditingDay(null);
      setStatus("Dia atualizado.");
      await loadRoteiro();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteDay(day) {
    if (
      !window.confirm(
        `Excluir o Dia ${day.numeroDia} e todas as suas atividades?`,
      )
    )
      return;
    try {
      setSaving(true);
      setStatus(null);
      await apiFetch(`/dias/${day.id}`, { method: "DELETE" });
      setRoteiro((current) =>
        current
          ? {
              ...current,
              dias: current.dias.filter((item) => item.id !== day.id),
            }
          : current,
      );
      setStatus("Dia excluído.");
      await loadRoteiro();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  }

  function startItem(dayId, item = null) {
    setItemDay(dayId);
    setEditingItem(item?.id || null);
    setItemForm(
      item
        ? {
            titulo: item.titulo,
            descricao: item.descricao || "",
            localNome: item.localNome || "",
            horarioInicio: formatTime(item.horarioInicio),
            custoEstimado: item.custoEstimado ?? "",
          }
        : emptyItem,
    );
  }

  async function saveItem(event, day) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    const payload = {
      ...itemForm,
      custoEstimado:
        itemForm.custoEstimado === "" ? null : Number(itemForm.custoEstimado),
      ordem: editingItem ? undefined : day.itens.length,
    };
    try {
      let savedItem;
      if (editingItem) {
        savedItem = await apiFetch(`/itens/${editingItem}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        savedItem = await apiFetch("/itens", {
          method: "POST",
          body: JSON.stringify({ ...payload, diaId: day.id }),
        });
      }

      setRoteiro((current) =>
        current
          ? {
              ...current,
              dias: current.dias.map((dia) => {
                if (dia.id !== day.id) return dia;

                if (editingItem) {
                  return {
                    ...dia,
                    itens: dia.itens.map((item) =>
                      item.id === editingItem
                        ? { ...item, ...savedItem }
                        : item,
                    ),
                  };
                }

                return {
                  ...dia,
                  itens: [...dia.itens, savedItem],
                };
              }),
            }
          : current,
      );

      setItemDay(null);
      setEditingItem(null);
      setStatus("Atividade salva.");
      await loadRoteiro();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item) {
    if (!window.confirm("Excluir esta atividade?")) return;
    try {
      setSaving(true);
      setStatus(null);
      await apiFetch(`/itens/${item.id}`, { method: "DELETE" });
      setRoteiro((current) =>
        current
          ? {
              ...current,
              dias: current.dias.map((dia) =>
                dia.id === item.diaId
                  ? {
                      ...dia,
                      itens: dia.itens.filter((entry) => entry.id !== item.id),
                    }
                  : dia,
              ),
            }
          : current,
      );
      setStatus("Atividade excluída.");
      await loadRoteiro();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function moveItem(day, index, direction) {
    const target = index + direction;
    if (target < 0 || target >= day.itens.length) return;
    const current = day.itens[index];
    const next = day.itens[target];
    try {
      setSaving(true);
      setStatus(null);
      await Promise.all([
        apiFetch(`/itens/${current.id}`, {
          method: "PATCH",
          body: JSON.stringify({ ordem: next.ordem }),
        }),
        apiFetch(`/itens/${next.id}`, {
          method: "PATCH",
          body: JSON.stringify({ ordem: current.ordem }),
        }),
      ]);
      setRoteiro((prev) =>
        prev
          ? {
              ...prev,
              dias: prev.dias.map((dia) =>
                dia.id === day.id
                  ? {
                      ...dia,
                      itens: dia.itens.map((item) =>
                        item.id === current.id
                          ? { ...item, ordem: next.ordem }
                          : item.id === next.id
                            ? { ...item, ordem: current.ordem }
                            : item,
                      ),
                    }
                  : dia,
              ),
            }
          : prev,
      );
      await loadRoteiro();
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteRoteiro() {
    if (!window.confirm("Deseja realmente excluir este roteiro?")) return;
    try {
      await apiFetch(`/roteiros/${id}`, { method: "DELETE" });
      navigate("/roteiros");
    } catch (error) {
      setStatus(error.message);
    }
  }

  function requireLogin() {
    if (isAuthenticated) return true;
    navigate("/login", { state: { from: `/roteiros/${id}` } });
    return false;
  }

  async function toggleCurtida() {
    if (!requireLogin() || socialBusy) return;
    setSocialBusy(true);
    setStatus(null);
    try {
      const result = await apiFetch(`/roteiros/${id}/curtir`, {
        method: curtido ? "DELETE" : "POST",
      });
      setCurtido(!curtido);
      setTotalCurtidas(result.totalCurtidas ?? totalCurtidas);
    } catch (error) {
      if (!curtido && error.status === 409) {
        setCurtido(true);
        setStatus(
          "Você já curtiu este roteiro. Toque novamente para remover a curtida.",
        );
      } else {
        setStatus(error.message);
      }
    } finally {
      setSocialBusy(false);
    }
  }

  async function toggleSalvo() {
    if (!requireLogin() || socialBusy) return;
    setSocialBusy(true);
    setStatus(null);
    try {
      await apiFetch(`/roteiros/${id}/salvar`, {
        method: salvo ? "DELETE" : "POST",
      });
      setSalvo(!salvo);
      setStatus(
        salvo
          ? "Roteiro removido dos salvos."
          : "Roteiro salvo para consultar depois.",
      );
    } catch (error) {
      if (!salvo && error.status === 409) {
        setSalvo(true);
        setStatus("Este roteiro já está nos seus salvos.");
      } else {
        setStatus(error.message);
      }
    } finally {
      setSocialBusy(false);
    }
  }

  async function submitReview(event) {
    event.preventDefault();
    if (!requireLogin() || socialBusy) return;
    if (!nota) {
      setStatus("Escolha uma nota de 1 a 5 estrelas.");
      return;
    }

    setSocialBusy(true);
    setStatus(null);
    try {
      const result = await apiFetch(`/roteiros/${id}/avaliar`, {
        method: "POST",
        body: JSON.stringify({
          nota,
          comentario: comentarioAvaliacao.trim() || null,
        }),
      });
      setResumoAvaliacoes(result.resumo || resumoAvaliacoes);
      setComentarioAvaliacao("");
      await refreshReviews();
      setStatus("Sua avaliação foi publicada.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSocialBusy(false);
    }
  }

  async function refreshReviews() {
    const result = await apiFetch(`/roteiros/${id}/avaliacoes`);
    setAvaliacoes(result.avaliacoes || []);
    setResumoAvaliacoes(result.resumo || { media: 0, total: 0 });
  }

  async function deleteReview() {
    if (!requireLogin() || socialBusy) return;
    if (
      !window.confirm(
        "Excluir sua avaliação? Para avaliar novamente, você poderá criar outra depois.",
      )
    )
      return;
    setSocialBusy(true);
    setStatus(null);
    try {
      const result = await apiFetch(`/roteiros/${id}/avaliar`, {
        method: "DELETE",
      });
      setResumoAvaliacoes(result.resumo || resumoAvaliacoes);
      setNota(0);
      await refreshReviews();
      setStatus("Sua avaliação foi excluída.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSocialBusy(false);
    }
  }

  async function copyRoteiro() {
    if (!user) {
      navigate("/login", { state: { from: `/roteiros/${id}` } });
      return;
    }
    if (copying) return;

    setCopying(true);
    setStatus(null);
    try {
      const response = await apiFetch(`/roteiros/${id}/duplicar`, {
        method: "POST",
      });
      const copiedId = response?.roteiro?.id;
      if (!copiedId) throw new Error("A cópia do roteiro não foi localizada.");
      navigate(`/roteiros/${copiedId}`);
    } catch (error) {
      setStatus(error.message || "Não foi possível copiar este roteiro.");
    } finally {
      setCopying(false);
    }
  }

  if (loading)
    return (
      <main className="container mx-auto px-4 py-16">
        Carregando roteiro...
      </main>
    );
  if (!roteiro)
    return (
      <main className="container mx-auto px-4 py-16">
        {status || "Roteiro não encontrado."}
      </main>
    );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_42%)] px-4 py-16 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <button
          type="button"
          className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-[#2563EB]"
          onClick={() => navigate("/")}
        >
          <span aria-hidden="true" className="text-lg leading-none">
            ←
          </span>
          Voltar à tela inicial
        </button>
        <header className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2563EB]">
                {isOwner ? "Meu roteiro" : "Roteiro de viagem"}
              </p>
              <h1 className="mt-3 text-4xl font-black text-slate-900">
                {roteiro.titulo}
              </h1>
              <p className="mt-2 text-slate-600">{roteiro.destino}</p>
              <p className="mt-3 text-sm text-slate-500">
                Criado por{" "}
                {roteiro.usuario?.id ? (
                  <Link
                    to={profilePath(roteiro.usuario)}
                    className="font-semibold text-slate-800 hover:text-blue-700 hover:underline"
                  >
                    {roteiro.usuario.nome || "Viajante"}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-800">
                    {roteiro.usuario?.nome || "Viajante"}
                  </span>
                )}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  {roteiro.publico ? "Público" : "Privado"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  Orçamento: {money(roteiro.orcamento)}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {isOwner ? (
                <>
                  <button
                    className="btn-primary"
                    onClick={() => setEditingRoteiro((value) => !value)}
                  >
                    {editingRoteiro ? "Concluir edição" : "Editar meu roteiro"}
                  </button>
                  <button
                    className="btn-secondary border-red-200 text-red-700 hover:bg-red-50"
                    onClick={deleteRoteiro}
                  >
                    Excluir roteiro
                  </button>
                </>
              ) : roteiro.publico ? (
                <div className="max-w-xs">
                  <button
                    className="btn-primary w-full"
                    onClick={copyRoteiro}
                    disabled={copying}
                  >
                    {copying ? "Copiando…" : "Copiar para editar"}
                  </button>
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Será criada uma cópia privada nos seus roteiros. O original
                    continua intacto.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
          {editingRoteiro ? (
            <form
              className="mt-8 grid gap-5 border-t border-slate-200 pt-8"
              onSubmit={saveRoteiro}
            >
              <Field label="Título">
                <input
                  className="input-field"
                  value={roteiroForm.titulo || ""}
                  onChange={(e) =>
                    setRoteiroForm({ ...roteiroForm, titulo: e.target.value })
                  }
                  required
                />
              </Field>
              <Field label="Destino">
                <input
                  className="input-field"
                  value={roteiroForm.destino || ""}
                  onChange={(e) =>
                    setRoteiroForm({ ...roteiroForm, destino: e.target.value })
                  }
                  required
                />
              </Field>
              <Field label="Descrição">
                <textarea
                  className="input-field"
                  rows={3}
                  value={roteiroForm.descricao || ""}
                  onChange={(e) =>
                    setRoteiroForm({
                      ...roteiroForm,
                      descricao: e.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Fotografia do roteiro (opcional)">
                <input
                  className="input-field"
                  type="url"
                  maxLength={500}
                  placeholder="https://…"
                  value={roteiroForm.imagemUrl || ""}
                  onChange={(event) =>
                    setRoteiroForm({
                      ...roteiroForm,
                      imagemUrl: event.target.value,
                    })
                  }
                />
              </Field>
              <Field label="Orçamento (R$)">
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  step="0.01"
                  value={roteiroForm.orcamento ?? ""}
                  onChange={(e) =>
                    setRoteiroForm({
                      ...roteiroForm,
                      orcamento: e.target.value,
                    })
                  }
                />
              </Field>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={Boolean(roteiroForm.publico)}
                  onChange={(e) =>
                    setRoteiroForm({
                      ...roteiroForm,
                      publico: e.target.checked,
                    })
                  }
                />
                Roteiro público
              </label>
              <button className="btn-primary w-fit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar informações"}
              </button>
            </form>
          ) : null}
        </header>
        {status ? (
          <div className="mt-6 rounded-3xl bg-blue-50 p-4 text-sm text-[#1d4ed8]">
            {status}
          </div>
        ) : null}

        {roteiro.publico ? (
          <section className="mt-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">
                  Comunidade Vambora
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-black text-slate-950">
                    {resumoAvaliacoes.media > 0
                      ? resumoAvaliacoes.media.toFixed(1)
                      : "—"}
                  </h2>
                  <span
                    className="text-xl tracking-wider text-amber-400"
                    aria-label={`${resumoAvaliacoes.media.toFixed(1)} de 5 estrelas`}
                  >
                    {"★".repeat(Math.round(resumoAvaliacoes.media))}
                    {"☆".repeat(5 - Math.round(resumoAvaliacoes.media))}
                  </span>
                  <span className="text-sm text-slate-500">
                    {resumoAvaliacoes.total}{" "}
                    {resumoAvaliacoes.total === 1 ? "avaliação" : "avaliações"}
                  </span>
                  <span className="text-sm text-slate-500">
                    · {totalCurtidas} curtidas
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={toggleCurtida}
                  disabled={socialBusy}
                  aria-pressed={curtido}
                  className={`rounded-full px-5 py-2.5 text-sm font-bold transition disabled:opacity-50 ${curtido ? "border border-rose-200 bg-rose-50 text-rose-700" : "btn-secondary"}`}
                >
                  {curtido ? "♥ Curtido" : "♡ Curtir roteiro"}
                </button>
                <button
                  type="button"
                  onClick={toggleSalvo}
                  disabled={socialBusy}
                  aria-pressed={salvo}
                  className={`rounded-full px-5 py-2.5 text-sm font-bold transition disabled:opacity-50 ${salvo ? "border border-blue-200 bg-blue-50 text-blue-700" : "btn-secondary"}`}
                >
                  {salvo ? "✓ Salvo" : "Salvar roteiro"}
                </button>
              </div>
            </div>

            <div className="mt-7 grid gap-8 border-t border-slate-100 pt-7 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <h3 className="text-lg font-black text-slate-950">
                  Sua avaliação
                </h3>
                {isAuthenticated ? (
                  (() => {
                    const ownReview = avaliacoes.find(
                      (review) => review.usuarioId === user?.id,
                    );
                    return ownReview ? (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <p className="text-lg tracking-wider text-amber-400">
                          {"★".repeat(ownReview.nota)}
                          {"☆".repeat(5 - ownReview.nota)}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {ownReview.comentario ||
                            "Você não adicionou um comentário."}
                        </p>
                        <button
                          type="button"
                          onClick={deleteReview}
                          disabled={socialBusy}
                          className="mt-3 text-sm font-semibold text-red-600 hover:underline disabled:opacity-50"
                        >
                          Excluir avaliação
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={submitReview} className="mt-4 grid gap-3">
                        <fieldset>
                          <legend className="text-sm text-slate-600">
                            Como foi esse roteiro?
                          </legend>
                          <div
                            className="mt-2 flex gap-1"
                            role="radiogroup"
                            aria-label="Nota de 1 a 5 estrelas"
                          >
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                role="radio"
                                aria-checked={nota === star}
                                aria-label={`${star} ${star === 1 ? "estrela" : "estrelas"}`}
                                onClick={() => setNota(star)}
                                className={`text-3xl transition hover:scale-110 ${star <= nota ? "text-amber-400" : "text-slate-300"}`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </fieldset>
                        <label className="grid gap-2 text-sm font-medium text-slate-700">
                          Comentário (opcional)
                          <textarea
                            className="input-field rounded-2xl"
                            rows={3}
                            maxLength={1000}
                            value={comentarioAvaliacao}
                            onChange={(event) =>
                              setComentarioAvaliacao(event.target.value)
                            }
                            placeholder="O que foi útil? O que outros viajantes deveriam saber?"
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={socialBusy || nota === 0}
                          className="btn-primary w-fit disabled:opacity-50"
                        >
                          Publicar avaliação
                        </button>
                        <p className="text-xs leading-5 text-slate-500">
                          Você pode avaliar uma vez. Para alterar depois, exclua
                          a avaliação e publique outra.
                        </p>
                      </form>
                    );
                  })()
                ) : (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    <Link
                      to="/login"
                      state={{ from: `/roteiros/${id}` }}
                      className="font-bold text-blue-600 hover:underline"
                    >
                      Entre na sua conta
                    </Link>{" "}
                    para curtir, salvar ou avaliar este roteiro.
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-950">
                  O que dizem os viajantes
                </h3>
                {avaliacoes.length ? (
                  <div className="mt-4 space-y-3">
                    {avaliacoes.map((review) => (
                      <article
                        key={review.id}
                        className="rounded-2xl border border-slate-100 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Link
                            to={profilePath(review.usuario)}
                            className="text-sm font-bold text-slate-900 hover:text-blue-700 hover:underline"
                          >
                            {review.usuario?.nome || "Viajante"}
                          </Link>
                          <span
                            className="text-sm tracking-wider text-amber-400"
                            aria-label={`${review.nota} de 5 estrelas`}
                          >
                            {"★".repeat(review.nota)}
                            {"☆".repeat(5 - review.nota)}
                          </span>
                        </div>
                        {review.comentario ? (
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {review.comentario}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Ainda não há avaliações. Seja a primeira pessoa a
                    compartilhar uma opinião.
                  </p>
                )}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">
                Planejamento
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                Dias e atividades
              </h2>
            </div>
            {isOwner && editingRoteiro ? (
              <form className="flex flex-wrap gap-2" onSubmit={addDay}>
                <input
                  className="input-field"
                  value={newDayTitle}
                  onChange={(e) => setNewDayTitle(e.target.value)}
                  placeholder="Título do novo dia"
                />
                <button className="btn-primary" disabled={saving}>
                  Adicionar dia
                </button>
              </form>
            ) : null}
          </div>
        </section>

        <div className="mt-6 space-y-6">
          {roteiro.dias?.map((day) => (
            <article
              key={day.id}
              className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm lg:p-8"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#2563EB]">
                    Dia {day.numeroDia}
                  </p>
                  {isOwner && editingRoteiro && editingDay?.id === day.id ? (
                    <form
                      className="mt-2 flex flex-wrap gap-2"
                      onSubmit={(e) => saveDay(e, day)}
                    >
                      <input
                        className="input-field"
                        value={editingDay.titulo}
                        onChange={(e) =>
                          setEditingDay({
                            ...editingDay,
                            titulo: e.target.value,
                          })
                        }
                        required
                      />
                      <button className="btn-primary">Salvar</button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setEditingDay(null)}
                      >
                        Cancelar
                      </button>
                    </form>
                  ) : (
                    <h3 className="mt-2 text-xl font-bold text-slate-900">
                      {day.titulo || `Dia ${day.numeroDia}`}
                    </h3>
                  )}
                </div>
                {isOwner && editingRoteiro ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="btn-secondary"
                      onClick={() =>
                        setEditingDay({ id: day.id, titulo: day.titulo || "" })
                      }
                    >
                      Editar dia
                    </button>
                    <button
                      className="btn-secondary border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => deleteDay(day)}
                    >
                      Excluir dia
                    </button>
                  </div>
                ) : null}
              </div>
              <div className="mt-6 space-y-3">
                {day.itens?.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h4 className="font-semibold text-slate-900">
                          {item.titulo}
                        </h4>
                        <p className="mt-2 text-sm text-slate-600">
                          {item.descricao || "Sem descrição."}
                        </p>
                        <p className="mt-3 text-sm text-slate-500">
                          {item.localNome || "Local não informado"}{" "}
                          {item.horarioInicio
                            ? `· ${formatTime(item.horarioInicio)}`
                            : ""}{" "}
                          · {money(item.custoEstimado)}
                        </p>
                      </div>
                      {isOwner && editingRoteiro ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="btn-secondary px-4 py-2"
                            onClick={() => startItem(day.id, item)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn-secondary px-4 py-2"
                            onClick={() => moveItem(day, index, -1)}
                            disabled={index === 0}
                          >
                            ↑
                          </button>
                          <button
                            className="btn-secondary px-4 py-2"
                            onClick={() => moveItem(day, index, 1)}
                            disabled={index === day.itens.length - 1}
                          >
                            ↓
                          </button>
                          <button
                            className="btn-secondary border-red-200 px-4 py-2 text-red-700 hover:bg-red-50"
                            onClick={() => deleteItem(item)}
                          >
                            Excluir
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
                {day.itens?.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                    Nenhuma atividade adicionada.
                  </p>
                ) : null}
              </div>
              {isOwner && editingRoteiro && itemDay === day.id ? (
                <form
                  className="mt-5 grid gap-4 border-t border-slate-200 pt-5"
                  onSubmit={(e) => saveItem(e, day)}
                >
                  <Field label="Título">
                    <input
                      className="input-field"
                      value={itemForm.titulo}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, titulo: e.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field label="Descrição">
                    <textarea
                      className="input-field"
                      rows={2}
                      value={itemForm.descricao}
                      onChange={(e) =>
                        setItemForm({ ...itemForm, descricao: e.target.value })
                      }
                    />
                  </Field>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Local">
                      <input
                        className="input-field"
                        value={itemForm.localNome}
                        onChange={(e) =>
                          setItemForm({
                            ...itemForm,
                            localNome: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field label="Horário">
                      <input
                        className="input-field"
                        type="time"
                        value={formatTime(itemForm.horarioInicio)}
                        onChange={(e) =>
                          setItemForm({
                            ...itemForm,
                            horarioInicio: e.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field label="Custo (R$)">
                      <input
                        className="input-field"
                        type="number"
                        min="0"
                        step="0.01"
                        value={itemForm.custoEstimado}
                        onChange={(e) =>
                          setItemForm({
                            ...itemForm,
                            custoEstimado: e.target.value,
                          })
                        }
                      />
                    </Field>
                  </div>
                  <div className="flex gap-3">
                    <button className="btn-primary" disabled={saving}>
                      {saving ? "Salvando..." : "Salvar atividade"}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setItemDay(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : isOwner && editingRoteiro ? (
                <button
                  className="btn-accent mt-5"
                  onClick={() => startItem(day.id)}
                >
                  + Adicionar atividade
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
