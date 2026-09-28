import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, requireAuth } from "../data/api";
import {
  buildRoteiroPayload,
  serializeDiaPayload,
  serializeItemPayload,
} from "../utils/roteiroSave";

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
  const [form, setForm] = useState({
    titulo: "",
    destino: "",
    descricao: "",
    orcamento: "",
    publico: false,
  });
  const [dias, setDias] = useState([createDay(1)]);
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dayEditor, setDayEditor] = useState(null);
  const [itemEditor, setItemEditor] = useState(null);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
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
      const roteiroPayload = buildRoteiroPayload(form);
      const roteiroResponse = await apiFetch("/roteiros", {
        method: "POST",
        body: JSON.stringify(roteiroPayload),
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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_42%)] px-4 py-16 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2563EB]">
            Novo roteiro
          </p>
          <h1 className="mt-4 text-4xl font-black text-slate-900">
            Monte o roteiro completo
          </h1>
          <p className="mt-3 text-slate-600">
            Preencha as informações principais, adicione dias e atividades e só
            então salve.
          </p>
        </div>

        {status ? (
          <div className="mb-6 rounded-3xl bg-blue-50 p-4 text-sm text-blue-800">
            {status}
          </div>
        ) : null}

        <div className="card p-8">
          <div className="grid gap-6">
            <div className="grid gap-5 lg:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Título do roteiro
                <input
                  className="input-field"
                  name="titulo"
                  value={form.titulo}
                  onChange={updateField}
                  placeholder="Ex.: Fim de semana em Lisboa"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Destino
                <input
                  className="input-field"
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
                className="input-field"
                name="descricao"
                rows={3}
                value={form.descricao}
                onChange={updateField}
                placeholder="Descreva a experiência que você quer viver"
              />
            </label>

            <div className="grid gap-5 lg:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Orçamento geral (R$)
                <input
                  className="input-field"
                  name="orcamento"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.orcamento}
                  onChange={updateField}
                  placeholder="Opcional"
                />
              </label>

              <label className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <input
                  name="publico"
                  type="checkbox"
                  checked={form.publico}
                  onChange={updateField}
                  className="h-5 w-5 rounded border-slate-300 text-[#2563EB]"
                />
                Tornar este roteiro público
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#2563EB]">
                Dias
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                Organize o percurso
              </h2>
            </div>
            <button type="button" className="btn-primary" onClick={addDay}>
              + Adicionar dia
            </button>
          </div>

          <div className="mt-8 space-y-6">
            {dias.map((day) => (
              <div
                key={day.id}
                className="rounded-[28px] border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    {dayEditor?.id === day.id ? (
                      <div className="flex flex-wrap gap-3">
                        <input
                          className="input-field max-w-md"
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
                          className="btn-primary"
                          onClick={() => saveDayEdit(day.id)}
                        >
                          Salvar dia
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setDayEditor(null)}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#2563EB]">
                          Dia {day.numeroDia}
                        </p>
                        <h3 className="mt-2 text-xl font-bold text-slate-900">
                          {day.titulo}
                        </h3>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => openDayEditor(day)}
                    >
                      Editar dia
                    </button>
                    <button
                      type="button"
                      className="btn-secondary border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => removeDay(day.id)}
                    >
                      Remover dia
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {day.itens.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                      Nenhuma atividade neste dia ainda.
                    </div>
                  ) : (
                    day.itens.map((item, index) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">
                              {item.titulo}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {item.descricao || "Sem descrição."}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                              <span className="rounded-full bg-slate-100 px-3 py-1">
                                {item.localNome || "Local não informado"}
                              </span>
                              <span className="rounded-full bg-slate-100 px-3 py-1">
                                {item.horarioInicio || "Sem horário"}
                              </span>
                              <span className="rounded-full bg-slate-100 px-3 py-1">
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
                              className="btn-secondary px-3 py-2"
                              onClick={() => openItemEditor(day.id, item)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="btn-secondary px-3 py-2"
                              onClick={() => moveItem(day.id, item.id, -1)}
                              disabled={index === 0}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="btn-secondary px-3 py-2"
                              onClick={() => moveItem(day.id, item.id, 1)}
                              disabled={index === day.itens.length - 1}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              className="btn-secondary border-red-200 px-3 py-2 text-red-700 hover:bg-red-50"
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
                    className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4"
                    onSubmit={saveItem}
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2 text-sm font-medium text-slate-700">
                        Título da atividade
                        <input
                          className="input-field"
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
                          className="input-field"
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
                        className="input-field"
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
                          className="input-field"
                          type="time"
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
                          className="input-field"
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
                      <button type="submit" className="btn-primary">
                        Salvar atividade
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setItemEditor(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    className="btn-accent mt-5"
                    onClick={() => openItemEditor(day.id)}
                  >
                    + Adicionar atividade
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/roteiros")}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving}
            onClick={handleSaveRoteiro}
          >
            {saving ? "Salvando..." : "Salvar roteiro"}
          </button>
        </div>
      </div>
    </main>
  );
}
