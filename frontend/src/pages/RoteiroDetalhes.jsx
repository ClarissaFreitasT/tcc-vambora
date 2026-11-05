import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../data/api";
import ObjectUrlImage from "../components/ObjectUrlImage";
import { useAuth } from "../context/useAuth";
import { profilePath } from "../utils/profile";
import "./RoteiroDetalhes.css";

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
  const [activeDayId, setActiveDayId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [editingRoteiro, setEditingRoteiro] = useState(false);
  const [roteiroForm, setRoteiroForm] = useState({});
  const [routeCoverFile, setRouteCoverFile] = useState(null);
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
      setActiveDayId((current) =>
        data.dias?.some((day) => day.id === current)
          ? current
          : data.dias?.[0]?.id || null,
      );
      setRoteiroForm({
        titulo: data.titulo,
        destino: data.destino,
        descricao: data.descricao || "",
        imagemUrl: data.imagemUrl || "",
        orcamento: data.orcamento ?? "",
        publico: data.publico,
      });
      setRouteCoverFile(null);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialRoteiro() {
      try {
        const data = await apiFetch(`/roteiros/${id}`);
        setRoteiro(data);
        setActiveDayId(data.dias?.[0]?.id || null);
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

  function chooseRouteCover(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 8 * 1024 * 1024
    ) {
      setStatus("Use uma imagem JPG, PNG ou WebP de até 8 MB.");
      return;
    }
    setRouteCoverFile(file);
    setStatus(null);
  }

  async function saveRoteiro(event) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const payload = {
        ...roteiroForm,
        orcamento:
          roteiroForm.orcamento === "" ? null : Number(roteiroForm.orcamento),
      };
      let body = JSON.stringify(payload);
      if (routeCoverFile) {
        body = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (key !== "imagemUrl" && value != null)
            body.append(key, String(value));
        });
        body.append("imagem", routeCoverFile);
      }
      await apiFetch(`/roteiros/${id}`, {
        method: "PATCH",
        body,
      });
      setRouteCoverFile(null);
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
    <main className="route-details-page min-h-screen">
      <header className="route-hero">
        {roteiro.imagemUrl ? (
          <img
            className="route-hero-image"
            src={roteiro.imagemUrl}
            alt=""
            onError={(event) => {
              event.currentTarget.hidden = true;
            }}
          />
        ) : null}
        <div className="route-hero-content">
          <div className="route-titlebox">
            <span className="route-badge">
              <span aria-hidden="true">✦</span>
              {isOwner ? "Meu roteiro" : "Roteiro de viagem"}
            </span>
            <h1>{roteiro.titulo}</h1>
            <p className="route-location">
              <span aria-hidden="true">⌖</span> {roteiro.destino}
            </p>
            <p className="route-author">
              <span className="route-author-avatar" aria-hidden="true">
                {(roteiro.usuario?.nome || "V").slice(0, 1).toUpperCase()}
              </span>
              <span>
                Criado por{" "}
                {roteiro.usuario?.id ? (
                  <Link to={profilePath(roteiro.usuario)}>
                    {roteiro.usuario.nome || "Viajante"}
                  </Link>
                ) : (
                  <strong>{roteiro.usuario?.nome || "Viajante"}</strong>
                )}
              </span>
            </p>
          </div>
          <div className="route-hero-bottom">
            <div className="route-facts">
              <span className="route-fact">
                <span aria-hidden="true">▦</span>
                {roteiro.dias?.length || 0} dias
              </span>
              <span className="route-fact">
                <span aria-hidden="true">▣</span>
                {money(roteiro.orcamento)}
              </span>
              <span className="route-fact">
                <span aria-hidden="true">◉</span>
                {roteiro.publico ? "Público" : "Privado"}
              </span>
            </div>
            <div className="route-owner-actions">
              {isOwner ? (
                <>
                  <button
                    className="route-hero-button route-hero-button--light"
                    onClick={() => setEditingRoteiro((value) => !value)}
                  >
                    {editingRoteiro ? "Concluir edição" : "Editar meu roteiro"}
                  </button>
                  <button
                    className="route-hero-button route-hero-button--danger"
                    onClick={deleteRoteiro}
                  >
                    Excluir roteiro
                  </button>
                </>
              ) : roteiro.publico ? (
                <div className="route-copy-action">
                  <button
                    className="route-hero-button route-hero-button--light"
                    onClick={copyRoteiro}
                    disabled={copying}
                  >
                    {copying ? "Copiando…" : "Copiar para editar"}
                  </button>
                  <p>A cópia será privada; o roteiro original continua intacto.</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>
      <div className="route-detail-container">
        {editingRoteiro ? (
            <form
                className="route-edit-form grid gap-5"
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
              <div className="grid gap-2 text-sm font-medium text-slate-700">
                <label htmlFor="route-cover-file">
                  Fotografia do roteiro (opcional)
                </label>
                {routeCoverFile ? (
                  <ObjectUrlImage
                    file={routeCoverFile}
                    alt="Prévia da nova capa do roteiro"
                    className="aspect-[16/7] w-full rounded-2xl bg-slate-100 object-cover"
                  />
                ) : roteiroForm.imagemUrl ? (
                  <img
                    src={roteiroForm.imagemUrl}
                    alt="Capa atual do roteiro"
                    className="aspect-[16/7] w-full rounded-2xl bg-slate-100 object-cover"
                    onError={(event) => {
                      event.currentTarget.hidden = true;
                    }}
                  />
                ) : null}
                <div className="flex flex-wrap items-center gap-3">
                  <label className="btn-secondary cursor-pointer">
                    {routeCoverFile || roteiroForm.imagemUrl
                      ? "Trocar imagem"
                      : "Escolher imagem"}
                    <input
                      id="route-cover-file"
                      className="sr-only"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={chooseRouteCover}
                    />
                  </label>
                  {routeCoverFile || roteiroForm.imagemUrl ? (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setRouteCoverFile(null);
                        setRoteiroForm((current) => ({
                          ...current,
                          imagemUrl: null,
                        }));
                      }}
                      disabled={saving}
                    >
                      Remover capa
                    </button>
                  ) : null}
                  <span className="text-xs font-normal text-slate-500">
                    JPG, PNG ou WebP de até 8 MB. A nova capa será armazenada no
                    Cloudinary.
                  </span>
                </div>
              </div>
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
        <div className="route-detail-layout">
        {status ? (
          <div className="route-feedback" role="status">
            {status}
          </div>
        ) : null}

        {roteiro.publico ? (
          <aside className="route-community-sidebar">
            <section className="route-community-card route-score-card">
              <h2>Comunidade Vambora</h2>
              <div className="route-score">
                <span className="route-score-number">
                  {resumoAvaliacoes.media > 0
                    ? resumoAvaliacoes.media.toFixed(1).replace(".", ",")
                    : "0,0"}
                </span>
                <div>
                  <div
                    className="route-score-stars"
                    aria-label={`${resumoAvaliacoes.media.toFixed(1)} de 5 estrelas`}
                  >
                    {"★".repeat(Math.round(resumoAvaliacoes.media))}
                    {"☆".repeat(5 - Math.round(resumoAvaliacoes.media))}
                  </div>
                  <p>
                    {resumoAvaliacoes.total}{" "}
                    {resumoAvaliacoes.total === 1 ? "avaliação" : "avaliações"}
                    {" · "}
                    {totalCurtidas} curtidas
                  </p>
                </div>
              </div>
              <div className="route-social-buttons">
                <button
                  type="button"
                  onClick={toggleCurtida}
                  disabled={socialBusy}
                  aria-pressed={curtido}
                  className={curtido ? "is-active" : ""}
                >
                  <span aria-hidden="true">♡</span>
                  {curtido ? "Curtido" : "Curtir"}
                </button>
                <button
                  type="button"
                  onClick={toggleSalvo}
                  disabled={socialBusy}
                  aria-pressed={salvo}
                  className={salvo ? "is-active" : ""}
                >
                  <span aria-hidden="true">▱</span>
                  {salvo ? "Salvo" : "Salvar"}
                </button>
              </div>
            </section>

            <section className="route-community-card route-review-form-card">
              <h2>Sua avaliação</h2>
              <p className="route-card-subtitle">Como foi esse roteiro?</p>
              {(() => {
                const ownReview = isAuthenticated
                  ? avaliacoes.find((review) => review.usuarioId === user?.id)
                  : null;
                return ownReview ? (
                    <div className="route-own-review">
                      <p className="route-review-stars" aria-label={`${ownReview.nota} de 5 estrelas`}>
                        {"★".repeat(ownReview.nota)}
                        {"☆".repeat(5 - ownReview.nota)}
                      </p>
                      <p>{ownReview.comentario || "Você não adicionou um comentário."}</p>
                      <button
                        type="button"
                        onClick={deleteReview}
                        disabled={socialBusy}
                        className="route-delete-review"
                      >
                        Excluir avaliação
                      </button>
                    </div>
                ) : (
                    <form onSubmit={submitReview} className="route-review-form">
                      <div
                        className="route-rating-stars"
                        role="radiogroup"
                        aria-label="Nota"
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            role="radio"
                            aria-checked={nota === star}
                            aria-label={`${star} de 5`}
                            onClick={() => setNota(star)}
                            className={star <= nota ? "is-active" : ""}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <label className="sr-only" htmlFor="route-review-comment">
                        Comentário (opcional)
                      </label>
                      <textarea
                        id="route-review-comment"
                        rows={3}
                        maxLength={1000}
                        value={comentarioAvaliacao}
                        onChange={(event) =>
                          setComentarioAvaliacao(event.target.value)
                        }
                        placeholder="O que foi útil? O que outros viajantes deveriam saber?"
                      />
                      <button
                        type="submit"
                        disabled={socialBusy || nota === 0}
                        className="route-review-submit"
                      >
                        {socialBusy ? "Publicando…" : "Publicar avaliação"}
                      </button>
                      <p className="route-review-note">
                        Você pode avaliar uma vez. Para alterar depois, exclua a
                        avaliação e publique outra.
                      </p>
                    </form>
                );
              })()}
            </section>

            <section className="route-community-card route-reviews-card">
              <h2>O que dizem os viajantes</h2>
              {avaliacoes.length ? (
                <div className="route-reviews-list">
                  {avaliacoes.map((review) => (
                    <article key={review.id}>
                      <div>
                        <Link to={profilePath(review.usuario)}>
                          {review.usuario?.nome || "Viajante"}
                        </Link>
                        <span aria-label={`${review.nota} de 5 estrelas`}>
                          {"★".repeat(review.nota)}
                          {"☆".repeat(5 - review.nota)}
                        </span>
                      </div>
                      {review.comentario ? <p>{review.comentario}</p> : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="route-empty-reviews">
                  Ainda não há avaliações. Seja a primeira pessoa a compartilhar
                  uma opinião.
                </p>
              )}
            </section>
          </aside>
        ) : null}

        <div className="route-planning-column">
        <section className="route-planning-heading">
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
          <div className="route-day-tabs" role="tablist" aria-label="Dias do roteiro">
            {roteiro.dias?.map((day) => (
              <button
                key={day.id}
                type="button"
                role="tab"
                aria-selected={activeDayId === day.id}
                onClick={() => setActiveDayId(day.id)}
              >
                Dia {day.numeroDia}
              </button>
            ))}
          </div>
        </section>

        <div className="route-day-content">
          {roteiro.dias?.filter((day) => day.id === activeDayId).map((day) => (
            <article
              key={day.id}
              className="route-day-card"
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
              <div className="route-timeline">
                {day.itens?.map((item, index) => (
                  <div
                    key={item.id}
                    className="route-activity-card"
                  >
                    <div className="route-activity-time">
                      <span>{formatTime(item.horarioInicio) || "—"}</span>
                    </div>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <h4 className="route-activity-title">
                          {item.titulo}
                        </h4>
                        <p className="route-activity-description">
                          {item.descricao || "Sem descrição."}
                        </p>
                        <div className="route-activity-tags">
                          <span>⌖ {item.localNome || "Local não informado"}</span>
                          {item.custoEstimado !== null &&
                          item.custoEstimado !== undefined ? (
                            <span>{money(item.custoEstimado)}</span>
                          ) : null}
                        </div>
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
                        lang="pt-BR"
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
      </div>
      </div>
    </main>
  );
}
