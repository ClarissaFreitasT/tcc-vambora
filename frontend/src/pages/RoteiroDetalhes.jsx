import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { updateStoredRoteiro } from '../data/storage'
import { useNavigate, useParams } from 'react-router-dom'
import { getMockRoteiroById } from '../data/mockRoteiros'

export default function RoteiroDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [roteiro, setRoteiro] = useState(null)
  const [editedRoteiro, setEditedRoteiro] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [destino, setDestino] = useState('')
  const [descricao, setDescricao] = useState('')
  const [orcamento, setOrcamento] = useState('')
  const [publico, setPublico] = useState(true)
  const [status, setStatus] = useState(null)
  const [activeSuggestion, setActiveSuggestion] = useState(null)
  const [replaceModal, setReplaceModal] = useState({ open: false, day: null, actionIndex: null, options: [], selected: null })

  useEffect(() => {
    async function carregarRoteiro() {
      try {
        const response = await fetch(`/roteiros/${id}`)
        const data = await response.json()

        if (response.ok && data) {
          setRoteiro(data)
          const loaded = normalizeRoteiro(data)
          setEditedRoteiro(loaded)
          setTitulo(loaded.titulo)
          setDestino(loaded.destino)
          setDescricao(loaded.descricao)
          setOrcamento(loaded.orcamento)
          setPublico(loaded.publico ?? false)
        } else {
          const localRoteiro = getMockRoteiroById(id)
          setRoteiro(localRoteiro)
          setEditedRoteiro(localRoteiro)
          if (localRoteiro) {
            setTitulo(localRoteiro.titulo)
            setDestino(localRoteiro.destino)
            setDescricao(localRoteiro.descricao || '')
            setOrcamento(localRoteiro.orcamento)
            setPublico(localRoteiro.publico ?? false)
          }
          setStatus('Usando dados de exemplo local para visualização.')
        }
      } catch (error) {
        const localRoteiro = getMockRoteiroById(id)
        setRoteiro(localRoteiro)
        setEditedRoteiro(localRoteiro)
        if (localRoteiro) {
          setTitulo(localRoteiro.titulo)
          setDestino(localRoteiro.destino)
          setDescricao(localRoteiro.descricao || '')
          setOrcamento(localRoteiro.orcamento)
          setPublico(localRoteiro.publico ?? false)
        }
        setStatus('Não foi possível carregar o backend. Exibindo dados de exemplo local.')
      } finally {
        setLoading(false)
      }
    }

    carregarRoteiro()
  }, [id])

  function normalizeRoteiro(data) {
    return {
      ...data,
      dias: Array.isArray(data.dias) ? data.dias : []
    }
  }

  function handleReplaceAction(dayNumber, actionIndex, replacement) {
    setEditedRoteiro((prev) => {
      if (!prev) return prev
      const next = JSON.parse(JSON.stringify(prev))
      const day = next.dias.find((item) => item.numero === dayNumber)
      if (day) {
        day.acoes[actionIndex] = replacement
      }
      try {
        if (next && next.id) {
          updateStoredRoteiro(next.id, next)
          setStatus('Ação substituída e salva em armazenamento local.')
        }
      } catch (err) {
        // ignore local save errors
      }
      return next
    })
    setActiveSuggestion(null)
    
  }

  async function handleUpdate(e) {
    e.preventDefault()
    setStatus('Atualizando roteiro...')

    const response = await fetch(`/roteiros/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, destino, descricao, orcamento, publico })
    })

    const data = await response.json()

    if (response.ok) {
      setRoteiro(data.roteiro)
      const loaded = normalizeRoteiro(data.roteiro)
      setEditedRoteiro(loaded)
      setStatus('Roteiro atualizado com sucesso!')
      setEditMode(false)
    } else {
      setStatus(data.erro || 'Não foi possível atualizar o roteiro.')
    }
  }

  async function handleDelete() {
    if (!window.confirm('Deseja realmente excluir este roteiro?')) return

    const response = await fetch(`/roteiros/${id}`, { method: 'DELETE' })
    const data = await response.json()

    if (response.ok) {
      navigate('/roteiros')
    } else {
      setStatus(data.erro || 'Não foi possível excluir o roteiro.')
    }
  }

  function closeReplaceModal() {
    setReplaceModal({ open: false, day: null, actionIndex: null, options: [], selected: null })
  }

  function confirmReplaceModal() {
    if (!replaceModal.selected) return
    handleReplaceAction(replaceModal.day, replaceModal.actionIndex, replaceModal.selected)
    closeReplaceModal()
  }

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-16 lg:px-8">
        <p className="text-slate-500">Carregando roteiro...</p>
      </main>
    )
  }

  if (!editedRoteiro) {
    return (
      <main className="container mx-auto px-4 py-16 lg:px-8">
        <p className="text-slate-500">Roteiro não encontrado.</p>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-16 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-[#00B4D8]">Detalhes do roteiro</p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">{editedRoteiro.titulo}</h1>
          <p className="mt-3 text-slate-600">{editedRoteiro.destino} · {editedRoteiro.estiloViajante}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn-secondary" onClick={() => setEditMode((prev) => !prev)}>
            {editMode ? 'Cancelar edição' : 'Editar roteiro'}
          </button>
          <button className="btn-primary" onClick={handleDelete}>
            Excluir roteiro
          </button>
        </div>
      </div>

      {status ? <div className="mt-6 rounded-3xl bg-[#E0F4FF] p-4 text-sm text-[#0077B6]">{status}</div> : null}

      {!editMode ? (
        <section className="mt-10 grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="space-y-4">
                <p className="text-sm text-slate-500">Resumo</p>
                <h2 className="text-2xl font-semibold text-slate-900">{editedRoteiro.destino}</h2>
                <p className="text-slate-600">{editedRoteiro.descricao || 'Sem descrição cadastrada.'}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-700">
                  <span className="rounded-2xl bg-slate-100 px-4 py-2">Orçamento: {editedRoteiro.orcamento || 'Não informado'}</span>
                  <span className="rounded-2xl bg-slate-100 px-4 py-2">{editedRoteiro.publico ? 'Público' : 'Privado'}</span>
                  <span className="rounded-2xl bg-slate-100 px-4 py-2">Estilo: {editedRoteiro.estiloViajante || 'Não informado'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {editedRoteiro.dias.map((dia) => (
                <div key={dia.numero} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#0F4C81]">Dia {dia.numero} • {dia.periodo}</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">{dia.lugar}</h3>
                    </div>
                    <p className="text-sm text-slate-500">{dia.horario}</p>
                  </div>

                  <div className="mt-4 space-y-3">
                    {dia.acoes.map((acao, actionIndex) => (
                      <motion.div
                        key={`${dia.numero}-${actionIndex}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="rounded-3xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <p className="text-sm text-slate-700">{acao}</p>
                          <button
                            type="button"
                            className="text-sm font-semibold text-[#0F4C81] transition hover:text-[#005f9e]"
                            onClick={() => {
                              // open modal with day suggestions
                              setReplaceModal({ open: true, day: dia.numero, actionIndex, options: dia.sugestoes || [], selected: (dia.sugestoes && dia.sugestoes[0]) || null })
                            }}
                          >
                            Substituir ação
                          </button>
                        </div>

                        {replaceModal.open && replaceModal.day === dia.numero && replaceModal.actionIndex === actionIndex ? (
                          <div />
                        ) : null}
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="card p-8">
            <h2 className="text-xl font-semibold text-slate-900">Informações rápidas</h2>
            <p className="mt-3 text-slate-600">Esta tela permite ver o roteiro por dia, trocar ações e manter o controle de público/privado.</p>
            <div className="mt-6 space-y-3 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
              <p>ID do roteiro: <strong>{editedRoteiro.id}</strong></p>
              <p>Usuário responsável: <strong>{editedRoteiro.usuario?.nome || 'Indefinido'}</strong></p>
              <p>Perfil: <strong>{editedRoteiro.usuario?.perfil || 'Não informado'}</strong></p>
            </div>
          </aside>
        </section>
      ) : (
        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Editar roteiro</h2>
          <form className="mt-6 grid gap-5" onSubmit={handleUpdate}>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Título
              <input
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#00B4D8]"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Destino
              <input
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#00B4D8]"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                required
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Descrição
              <textarea
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#00B4D8]"
                rows={4}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Orçamento
              <input
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#00B4D8]"
                value={orcamento}
                onChange={(e) => setOrcamento(e.target.value)}
              />
            </label>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={publico}
                  onChange={() => setPublico((prev) => !prev)}
                  className="h-5 w-5 rounded border-slate-300 text-[#00B4D8] focus:ring-[#00B4D8]"
                />
                Compartilhar publicamente
              </label>
              <p className="mt-3 text-sm text-slate-500">{publico ? 'O roteiro ficará público.' : 'O roteiro ficará privado.'}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="btn-primary" type="submit">Salvar alterações</button>
              <button className="btn-secondary" type="button" onClick={() => setEditMode(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}
      {replaceModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeReplaceModal} />
          <div className="relative z-50 w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-900">Substituir atividade</h3>
            <p className="mt-2 text-sm text-slate-600">Sugestões compatíveis com este dia.</p>

            <div className="mt-4 space-y-3 max-h-56 overflow-auto">
              {(replaceModal.options || []).map((opt, idx) => (
                <label
                  key={idx}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition ${
                    replaceModal.selected === opt ? 'bg-slate-100 border border-slate-200' : 'hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="replaceOption"
                    checked={replaceModal.selected === opt}
                    onChange={() => setReplaceModal((prev) => ({ ...prev, selected: opt }))}
                    className="h-4 w-4 text-[#00B4D8]"
                  />
                  <div className="text-sm text-slate-800">{opt}</div>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-secondary" onClick={closeReplaceModal}>Cancelar</button>
              <button className="btn-primary" onClick={confirmReplaceModal}>Confirmar</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
