import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { updateStoredRoteiro } from '../data/storage'
import { useNavigate, useParams } from 'react-router-dom'
import { getMockRoteiroById } from '../data/mockRoteiros'
import { getActivitySuggestions, replaceActivityInRoteiro } from '../utils/roteiroUtils'

const activityIcons = ['☕', '🏛', '🍽', '🏖', '🌅', '✨']

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
    if (!editedRoteiro) return

    const next = replaceActivityInRoteiro(editedRoteiro, dayNumber, actionIndex, replacement)
    setEditedRoteiro(next)
    try {
      updateStoredRoteiro(next.id, next)
      setStatus('Atividade substituída com sucesso e salva localmente.')
    } catch (err) {
      setStatus('Atividade substituída, mas houve um problema ao salvar localmente.')
    }
  }

  function openReplaceModal(dayNumber, actionIndex, day) {
    const suggestions = getActivitySuggestions({
      destino: editedRoteiro?.destino || '',
      estiloViajante: editedRoteiro?.estiloViajante || '',
      orcamento: editedRoteiro?.orcamento || '',
      periodo: day?.periodo || ''
    })

    setReplaceModal({ open: true, day: dayNumber, actionIndex, options: suggestions, selected: suggestions[0] || null })
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_40%)] px-4 py-16 lg:px-8">
      <div className="container mx-auto rounded-[36px] border border-slate-200 bg-white/90 p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)] lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2563EB]">Detalhes do roteiro</p>
            <h1 className="mt-3 text-4xl font-black text-slate-900">{editedRoteiro.titulo}</h1>
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
      </div>

      {status ? <div className="container mx-auto mt-6 rounded-[24px] border border-blue-100 bg-blue-50 p-4 text-sm text-[#2563EB]">{status}</div> : null}

      {!editMode ? (
        <section className="container mx-auto mt-8 grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#2563EB]">Resumo</p>
                <h2 className="text-2xl font-semibold text-slate-900">{editedRoteiro.destino}</h2>
                <p className="text-slate-600">{editedRoteiro.descricao || 'Sem descrição cadastrada.'}</p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-700">
                  <span className="rounded-2xl bg-slate-100 px-4 py-2">Orçamento: {editedRoteiro.orcamento || 'Não informado'}</span>
                  <span className="rounded-2xl bg-slate-100 px-4 py-2">{editedRoteiro.publico ? 'Público' : 'Privado'}</span>
                  <span className="rounded-2xl bg-slate-100 px-4 py-2">Estilo: {editedRoteiro.estiloViajante || 'Não informado'}</span>
                </div>
              </div>
            </motion.div>

            <div className="space-y-5">
              {editedRoteiro.dias.map((dia, dayIndex) => (
                <motion.div key={dia.numero} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: dayIndex * 0.05 }} className="rounded-[32px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#2563EB]">Dia {dia.numero} • {dia.periodo}</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">{dia.lugar}</h3>
                    </div>
                    <p className="text-sm text-slate-500">{dia.horario}</p>
                  </div>

                  <div className="mt-4 space-y-3">
                    {dia.acoes.map((acao, actionIndex) => (
                      <motion.div key={`${dia.numero}-${actionIndex}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="rounded-[24px] border border-slate-200 bg-white p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-lg">{activityIcons[actionIndex % activityIcons.length]}</div>
                          <div className="flex-1">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Atividade {actionIndex + 1}</p>
                                <h4 className="mt-1 text-base font-semibold text-slate-900">{acao}</h4>
                              </div>
                              <button type="button" className="btn-secondary px-4 py-2" onClick={() => openReplaceModal(dia.numero, actionIndex, dia)}>
                                Trocar
                              </button>
                            </div>
                            <p className="mt-3 text-sm text-slate-600">Sugestões compatíveis com {editedRoteiro.destino} e o contexto do dia.</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <aside className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-[0_20px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-xl font-semibold text-slate-900">Fluxo inteligente</h2>
            <p className="mt-3 text-slate-600">Cada atividade pode ser substituída por um novo conceito relevante ao destino, estilo e período do dia.</p>
            <div className="mt-6 space-y-3 rounded-[24px] bg-slate-50 p-4 text-sm text-slate-700">
              <p>ID do roteiro: <strong>{editedRoteiro.id}</strong></p>
              <p>Usuário responsável: <strong>{editedRoteiro.usuario?.nome || 'Indefinido'}</strong></p>
              <p>Perfil: <strong>{editedRoteiro.usuario?.perfil || 'Não informado'}</strong></p>
            </div>
            <div className="mt-6 rounded-[24px] border border-blue-100 bg-blue-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-[#2563EB]">Experiência premium</p>
              <p className="mt-2">A alteração é aplicada apenas no bloco selecionado, sem recarregar a página e sem interferir nas demais atividades.</p>
            </div>
          </aside>
        </section>
      ) : (
        <section className="container mx-auto mt-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Editar roteiro</h2>
          <form className="mt-6 grid gap-5" onSubmit={handleUpdate}>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Título
              <input className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB]" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Destino
              <input className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB]" value={destino} onChange={(e) => setDestino(e.target.value)} required />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Descrição
              <textarea className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB]" rows={4} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Orçamento
              <input className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#2563EB]" value={orcamento} onChange={(e) => setOrcamento(e.target.value)} />
            </label>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" checked={publico} onChange={() => setPublico((prev) => !prev)} className="h-5 w-5 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]" />
                Compartilhar publicamente
              </label>
              <p className="mt-3 text-sm text-slate-500">{publico ? 'O roteiro ficará público.' : 'O roteiro ficará privado.'}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="btn-primary" type="submit">Salvar alterações</button>
              <button className="btn-secondary" type="button" onClick={() => setEditMode(false)}>Cancelar</button>
            </div>
          </form>
        </section>
      )}

      {replaceModal.open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/45" onClick={closeReplaceModal} />
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative z-50 w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.2)]">
            <h3 className="text-lg font-bold text-slate-900">Substituir atividade</h3>
            <p className="mt-2 text-sm text-slate-600">Sugestões compatíveis com o destino, estilo e período do dia.</p>

            <div className="mt-4 max-h-60 space-y-3 overflow-auto">
              {(replaceModal.options || []).map((opt, idx) => (
                <label key={idx} className={`flex cursor-pointer items-center gap-3 rounded-[16px] border px-3 py-2 transition ${replaceModal.selected === opt ? 'border-[#2563EB] bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name="replaceOption" checked={replaceModal.selected === opt} onChange={() => setReplaceModal((prev) => ({ ...prev, selected: opt }))} className="h-4 w-4 text-[#2563EB]" />
                  <div className="text-sm text-slate-800">{opt}</div>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button className="btn-secondary" onClick={closeReplaceModal}>Cancelar</button>
              <button className="btn-primary" onClick={confirmReplaceModal}>Confirmar</button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </main>
  )
}
