import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, requireAuth } from "../data/api";
import ObjectUrlImage from "../components/ObjectUrlImage";
import { useAuth } from "../context/useAuth";
import {
  buildRoteiroPayload,
  serializeDiaPayload,
  serializeItemPayload,
} from "../utils/roteiroSave";
import "./NovoRoteiro.css";

const emptyItem = {
  titulo: "",
  descricao: "",
  localNome: "",
  horarioInicio: "",
  custoEstimado: "",
};

function makeLocalId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createDay(numeroDia) {
  return {
    id: makeLocalId("day"),
    numeroDia,
    titulo: `Dia ${numeroDia}`,
    itens: [],
  };
}

export default function NovoRoteiro() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    titulo: "",
    destino: "",
    descricao: "",
    imagemUrl: "",
    orcamento: "",
    publico: false,
  });
  const [dias, setDias] = useState([createDay(1)]);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [dayEditor, setDayEditor] = useState(null);
  const [itemEditor, setItemEditor] = useState(null);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function chooseCover(event) {
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
    setCoverFile(file);
    setStatus(null);
  }

  function addDay() {
    const nextNumber = dias.length
      ? Math.max(...dias.map((day) => day.numeroDia)) + 1
      : 1;
    setDias((current) => [...current, createDay(nextNumber)]);
    setStatus(null);
  }

  function removeDay(dayId) {
    if (dias.length === 1) {
      setStatus("O roteiro precisa ter pelo menos 1 dia.");
      return;
    }

    const nextDays = dias
      .filter((day) => day.id !== dayId)
      .map((day, index) => ({
        ...day,
        numeroDia: index + 1,
        titulo: day.titulo || `Dia ${index + 1}`,
      }));

    setDias(nextDays);
    setDayEditor(null);
    setStatus(null);
  }

  function openDayEditor(day) {
    setDayEditor({ id: day.id, titulo: day.titulo || `Dia ${day.numeroDia}` });
  }

  function saveDayEdit(dayId) {
    if (!dayEditor || dayEditor.id !== dayId) return;

    const titulo =
      dayEditor.titulo.trim() ||
      `Dia ${dias.find((day) => day.id === dayId)?.numeroDia || 1}`;

    setDias((current) =>
      current.map((day) => (day.id === dayId ? { ...day, titulo } : day)),
    );
    setDayEditor(null);
    setStatus(null);
  }

  function openItemEditor(dayId, item = null) {
    setItemEditor({
      dayId,
      itemId: item?.id ?? null,
      form: item
        ? {
            titulo: item.titulo || "",
            descricao: item.descricao || "",
            localNome: item.localNome || "",
            horarioInicio: item.horarioInicio || "",
            custoEstimado: item.custoEstimado ?? "",
          }
        : { ...emptyItem },
    });
  }

  function saveItem(event) {
    event.preventDefault();
    if (!itemEditor) return;

    const itemTitulo = itemEditor.form.titulo.trim();
    if (!itemTitulo) {
      setStatus("O título da atividade é obrigatório.");
      return;
    }

    setDias((current) =>
      current.map((day) => {
        if (day.id !== itemEditor.dayId) return day;

        if (itemEditor.itemId) {
          return {
            ...day,
            itens: day.itens.map((item) =>
              item.id === itemEditor.itemId
                ? {
                    ...item,
                    titulo: itemTitulo,
                    descricao: itemEditor.form.descricao.trim(),
                    localNome: itemEditor.form.localNome.trim(),
                    horarioInicio: itemEditor.form.horarioInicio,
                    custoEstimado:
                      itemEditor.form.custoEstimado === ""
                        ? null
                        : Number(itemEditor.form.custoEstimado),
                  }
                : item,
            ),
          };
        }

        const newItem = {
          id: makeLocalId("item"),
          titulo: itemTitulo,
          descricao: itemEditor.form.descricao.trim(),
          localNome: itemEditor.form.localNome.trim(),
          horarioInicio: itemEditor.form.horarioInicio,
          custoEstimado:
            itemEditor.form.custoEstimado === ""
              ? null
              : Number(itemEditor.form.custoEstimado),
          ordem: day.itens.length,
        };

        return {
          ...day,
          itens: [...day.itens, newItem],
        };
      }),
    );

    setItemEditor(null);
    setStatus(null);
  }

  function deleteItem(dayId, itemId) {
    setDias((current) =>
      current.map((day) => {
        if (day.id !== dayId) return day;

        const nextItens = day.itens
          .filter((item) => item.id !== itemId)
          .map((item, index) => ({ ...item, ordem: index }));

        return { ...day, itens: nextItens };
      }),
    );
    setStatus(null);
  }

  function moveItem(dayId, itemId, direction) {
    setDias((current) =>
      current.map((day) => {
        if (day.id !== dayId) return day;

        const index = day.itens.findIndex((item) => item.id === itemId);
        const targetIndex = index + direction;
        if (index < 0 || targetIndex < 0 || targetIndex >= day.itens.length)
          return day;

        const updatedItems = [...day.itens];
        const [movedItem] = updatedItems.splice(index, 1);
        updatedItems.splice(targetIndex, 0, movedItem);

        return {
          ...day,
          itens: updatedItems.map((item, orderIndex) => ({
            ...item,
            ordem: orderIndex,
          })),
        };
      }),
    );
  }

  async function handleSaveRoteiro() {
    if (!requireAuth(navigate)) return;

    if (!form.titulo.trim() || !form.destino.trim()) {
      setStatus("Título e destino são obrigatórios antes de salvar.");
      return;
    }

    if (!dias.length || dias.some((day) => !day.itens.length)) {
      setStatus(
        "Cada dia do roteiro precisa ter pelo menos uma atividade antes do salvamento.",
      );
      return;
    }

    setSaving(true);
    setStatus(null);

    try {
      if (!user?.id)
        throw new Error(
          "Não foi possível identificar sua conta. Entre novamente.",
        );
      const roteiroPayload = {
        ...buildRoteiroPayload(form),
        usuarioId: user.id,
      };
      let requestBody = JSON.stringify(roteiroPayload);
      if (coverFile) {
        requestBody = new FormData();
        Object.entries(roteiroPayload).forEach(([key, value]) => {
          if (key !== "imagemUrl" && value != null)
            requestBody.append(key, String(value));
        });
        requestBody.append("imagem", coverFile);
      }
      const roteiroResponse = await apiFetch("/roteiros", {
        method: "POST",
        body: requestBody,
      });

      const roteiroId = roteiroResponse?.roteiro?.id ?? roteiroResponse?.id;
      if (!roteiroId) {
        throw new Error("Não foi possível criar o roteiro.");
      }

      const diasCriados = [];
      for (const day of dias) {
        const diaPayload = serializeDiaPayload({
          numeroDia: day.numeroDia,
          titulo: day.titulo || `Dia ${day.numeroDia}`,
        });

        const diaResponse = await apiFetch("/dias", {
          method: "POST",
          body: JSON.stringify({ roteiroId, ...diaPayload }),
        });

        if (!diaResponse?.id) {
          throw new Error(`Não foi possível criar o dia ${day.numeroDia}.`);
        }

        diasCriados.push({ ...day, serverId: diaResponse.id });
      }

      for (const day of diasCriados) {
        for (let index = 0; index < day.itens.length; index += 1) {
          const item = day.itens[index];
          const itemPayload = serializeItemPayload(item, index);

          const itemResponse = await apiFetch("/itens", {
            method: "POST",
            body: JSON.stringify({
              diaId: day.serverId,
              ...itemPayload,
            }),
          });

          if (!itemResponse?.id) {
            throw new Error(
              `Não foi possível salvar a atividade "${item.titulo}".`,
            );
          }
        }
      }

      navigate(`/roteiros/${roteiroId}`);
    } catch (error) {
      setStatus(error.message || "Não foi possível salvar o roteiro.");
    } finally {
      setSaving(false);
    }
  }

  const totalAtividades = dias.reduce(
    (total, day) => total + day.itens.length,
    0,
  );

  return (
    <main className="new-route-page min-h-screen">
      <header className="new-route-header">
        <div className="new-route-header-inner">
          <p className="new-route-kicker">Novo roteiro</p>
          <h1>Monte o roteiro completo</h1>
          <p>
            Preencha as informações principais, adicione dias e atividades e só
            então salve.
          </p>
        </div>
        <svg
          className="new-route-wave"
          viewBox="0 0 1440 90"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 50Q180 0 360 50T720 50T1080 50T1440 50V90H0Z"
            fill="#9CCBF5"
            opacity=".55"
          />
          <path
            d="M0 68Q180 28 360 68T720 68T1080 68T1440 68V90H0Z"
            fill="var(--new-route-bg)"
          />
        </svg>
      </header>

      <div className="new-route-layout">
        <div className="new-route-main">
          {status ? (
            <div
              className="new-route-status mb-6 rounded-3xl p-4 text-sm"
              role="status"
            >
              {status}
            </div>
          ) : null}

          <section className="new-route-card">
            <h2>Sobre a viagem</h2>
            <p> </p>

            <div className="grid gap-6">
              <div className="grid gap-5 lg:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Título do roteiro
                  <input
                    className="new-route-input"
                    name="titulo"
                    value={form.titulo}
                    onChange={updateField}
                    placeholder="Ex.: Fim de semana em Lisboa"
                  />
                </label>

                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Destino
                  <input
                    className="new-route-input"
                    name="destino"
                    value={form.destino}
                    onChange={updateField}
                    placeholder="Ex.: Lisboa, Portugal"
                  />
                </label>
              </div>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Descrição
                <textarea
                  className="new-route-input"
                  name="descricao"
                  rows={3}
                  value={form.descricao}
                  onChange={updateField}
                  placeholder="Descreva a experiência que você quer viver"
                />
              </label>

              <div className="grid gap-2 text-sm font-medium text-slate-700">
                <label htmlFor="route-cover-file">
                  Fotografia do roteiro (opcional)
                </label>
                {coverFile ? (
                  <ObjectUrlImage
                    file={coverFile}
                    alt="Prévia da capa do roteiro"
                    className="new-route-cover-preview aspect-[16/7] w-full rounded-2xl object-cover"
                  />
                ) : null}
                <div className="flex flex-wrap items-center gap-3">
                  <label className="new-route-button new-route-button--soft cursor-pointer">
                    {coverFile ? "Trocar imagem" : "Escolher imagem"}
                    <input
                      id="route-cover-file"
                      className="sr-only"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={chooseCover}
                    />
                  </label>
                  {coverFile ? (
                    <button
                      type="button"
                      className="new-route-button new-route-button--outline"
                      onClick={() => setCoverFile(null)}
                    >
                      Remover imagem
                    </button>
                  ) : null}
                  <span className="text-xs font-normal text-slate-500">
                    JPG, PNG ou WebP, até 8 MB.
                  </span>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Orçamento geral (R$)
                  <input
                    className="new-route-input"
                    name="orcamento"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.orcamento}
                    onChange={updateField}
                    placeholder="Informe seu orçamento"
                  />
                </label>

                <label className="new-route-visibility flex items-center gap-3 rounded-3xl p-4 text-sm">
                  <input
                    name="publico"
                    type="checkbox"
                    checked={form.publico}
                    onChange={updateField}
                    className="h-5 w-5 rounded border-slate-300 text-[#3B82E0]"
                  />
                  Tornar este roteiro público
                </label>
              </div>
            </div>
          </section>

          <section className="new-route-card mt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="new-route-kicker text-sm font-semibold uppercase tracking-[0.25em]">
                  Dias
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  Organize o percurso
                </h2>
              </div>
              <button
                type="button"
                className="new-route-button new-route-button--blue"
                onClick={addDay}
              >
                + Adicionar dia
              </button>
            </div>

            <div className="mt-8 space-y-6">
              {dias.map((day) => (
                <div key={day.id} className="new-route-day rounded-[28px] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      {dayEditor?.id === day.id ? (
                        <div className="flex flex-wrap gap-3">
                          <input
                            className="new-route-input max-w-md"
                            value={dayEditor.titulo}
                            onChange={(event) =>
                              setDayEditor((current) => ({
                                ...current,
                                titulo: event.target.value,
                              }))
                            }
                            placeholder={`Dia ${day.numeroDia}`}
                          />
                          <button
                            type="button"
                            className="new-route-button new-route-button--blue"
                            onClick={() => saveDayEdit(day.id)}
                          >
                            Salvar dia
                          </button>
                          <button
                            type="button"
                            className="new-route-button new-route-button--outline"
                            onClick={() => setDayEditor(null)}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="new-route-kicker text-sm font-semibold uppercase tracking-[0.22em]">
                            Dia {day.numeroDia}
                          </p>
                          <h3 className="mt-2 text-xl font-bold">
                            {day.titulo}
                          </h3>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="new-route-button new-route-button--outline"
                        onClick={() => openDayEditor(day)}
                      >
                        Editar dia
                      </button>
                      <button
                        type="button"
                        className="new-route-button new-route-button--outline new-route-button--danger"
                        onClick={() => removeDay(day.id)}
                      >
                        Remover dia
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {day.itens.length === 0 ? (
                      <div className="new-route-empty rounded-2xl border border-dashed p-4 text-sm">
                        Nenhuma atividade neste dia ainda.
                      </div>
                    ) : (
                      day.itens.map((item, index) => (
                        <div
                          key={item.id}
                          className="new-route-activity rounded-2xl p-4"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex-1">
                              <p className="font-semibold">{item.titulo}</p>
                              <p className="new-route-muted mt-1 text-sm">
                                {item.descricao || "Sem descrição."}
                              </p>
                              <div className="new-route-muted mt-3 flex flex-wrap gap-2 text-xs">
                                <span className="new-route-chip rounded-full px-3 py-1">
                                  {item.localNome || "Local não informado"}
                                </span>
                                <span className="new-route-chip rounded-full px-3 py-1">
                                  {item.horarioInicio || "Sem horário"}
                                </span>
                                <span className="new-route-chip rounded-full px-3 py-1">
                                  {item.custoEstimado === null ||
                                  item.custoEstimado === undefined ||
                                  item.custoEstimado === ""
                                    ? "Sem custo"
                                    : `R$ ${Number(item.custoEstimado).toFixed(2)}`}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                className="new-route-button new-route-button--outline px-3 py-2"
                                onClick={() => openItemEditor(day.id, item)}
                              >
                                Editar
                              </button>
                              <button
                                type="button"
                                className="new-route-button new-route-button--outline px-3 py-2"
                                onClick={() => moveItem(day.id, item.id, -1)}
                                disabled={index === 0}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                className="new-route-button new-route-button--outline px-3 py-2"
                                onClick={() => moveItem(day.id, item.id, 1)}
                                disabled={index === day.itens.length - 1}
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                className="new-route-button new-route-button--outline new-route-button--danger px-3 py-2"
                                onClick={() => deleteItem(day.id, item.id)}
                              >
                                Excluir
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {itemEditor?.dayId === day.id ? (
                    <form
                      className="new-route-activity-editor mt-5 grid gap-4 rounded-2xl p-4"
                      onSubmit={saveItem}
                    >
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2 text-sm font-medium text-slate-700">
                          Título da atividade
                          <input
                            className="new-route-input"
                            value={itemEditor.form.titulo}
                            onChange={(event) =>
                              setItemEditor((current) => ({
                                ...current,
                                form: {
                                  ...current.form,
                                  titulo: event.target.value,
                                },
                              }))
                            }
                            required
                          />
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-slate-700">
                          Local
                          <input
                            className="new-route-input"
                            value={itemEditor.form.localNome}
                            onChange={(event) =>
                              setItemEditor((current) => ({
                                ...current,
                                form: {
                                  ...current.form,
                                  localNome: event.target.value,
                                },
                              }))
                            }
                          />
                        </label>
                      </div>

                      <label className="grid gap-2 text-sm font-medium text-slate-700">
                        Descrição
                        <textarea
                          className="new-route-input"
                          rows={2}
                          value={itemEditor.form.descricao}
                          onChange={(event) =>
                            setItemEditor((current) => ({
                              ...current,
                              form: {
                                ...current.form,
                                descricao: event.target.value,
                              },
                            }))
                          }
                        />
                      </label>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="grid gap-2 text-sm font-medium text-slate-700">
                          Horário
                          <input
                            className="new-route-input"
                            type="time"
                            lang="pt-BR"
                            value={itemEditor.form.horarioInicio}
                            onChange={(event) =>
                              setItemEditor((current) => ({
                                ...current,
                                form: {
                                  ...current.form,
                                  horarioInicio: event.target.value,
                                },
                              }))
                            }
                          />
                        </label>

                        <label className="grid gap-2 text-sm font-medium text-slate-700">
                          Custo estimado (R$)
                          <input
                            className="new-route-input"
                            type="number"
                            min="0"
                            step="0.01"
                            value={itemEditor.form.custoEstimado}
                            onChange={(event) =>
                              setItemEditor((current) => ({
                                ...current,
                                form: {
                                  ...current.form,
                                  custoEstimado: event.target.value,
                                },
                              }))
                            }
                          />
                        </label>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          className="new-route-button new-route-button--blue"
                        >
                          Salvar atividade
                        </button>
                        <button
                          type="button"
                          className="new-route-button new-route-button--outline"
                          onClick={() => setItemEditor(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      className="new-route-button new-route-button--soft mt-5"
                      onClick={() => openItemEditor(day.id)}
                    >
                      + Adicionar atividade
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div className="new-route-actions mt-8 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              className="new-route-button new-route-button--outline"
              onClick={() => navigate("/roteiros")}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="new-route-button new-route-button--blue disabled:cursor-not-allowed disabled:opacity-60"
              disabled={saving}
              onClick={handleSaveRoteiro}
            >
              {saving ? "Salvando..." : "Salvar roteiro"}
            </button>
          </div>
        </div>

        <aside className="new-route-preview-aside">
          <article className="new-route-card new-route-preview">
            <div className="new-route-preview-cover">
              {coverFile ? (
                <ObjectUrlImage
                  file={coverFile}
                  alt="Prévia da capa do roteiro"
                  className="new-route-preview-image"
                />
              ) : (
                <span>Prévia da capa do roteiro</span>
              )}
            </div>
            <div className="new-route-preview-body">
              <h2>{form.titulo.trim() || "Seu roteiro sem título"}</h2>
              <p className="new-route-preview-destination">
                {form.destino.trim() || "Destino a definir"}
              </p>
              <div className="new-route-preview-stats">
                <span>
                  {dias.length} {dias.length === 1 ? "dia" : "dias"}
                </span>
                <span>
                  {totalAtividades}{" "}
                  {totalAtividades === 1 ? "atividade" : "atividades"}
                </span>
                <span>
                  {form.orcamento
                    ? `R$ ${Number(form.orcamento).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    : "Orçamento opcional"}
                </span>
              </div>
              <p className="new-route-preview-visibility">
                {form.publico
                  ? "Público, outros viajantes poderão ver."
                  : "Privado, só você vê."}
              </p>
            </div>
          </article>
          <div className="new-route-aside-actions">
            <button
              type="button"
              className="new-route-button new-route-button--blue"
              disabled={saving}
              onClick={handleSaveRoteiro}
            >
              {saving ? "Salvando..." : "Salvar roteiro"}
            </button>
            <button
              type="button"
              className="new-route-button new-route-button--outline"
              onClick={() => navigate("/roteiros")}
            >
              Cancelar
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
