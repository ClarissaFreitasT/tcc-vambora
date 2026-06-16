import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

export default function RoteiroDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [roteiro, setRoteiro] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [destino, setDestino] = useState('')
  const [descricao, setDescricao] = useState('')
  const [orcamento, setOrcamento] = useState('')
  const [publico, setPublico] = useState(true)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    async function carregarRoteiro() {
      try {
        const response = await fetch(`/roteiros/${id}`)
        const data = await response.json()

        if (response.ok) {
          setRoteiro(data)
          setTitulo(data.titulo || '')
          setDestino(data.destino || '')
          setDescricao(data.descricao || '')
          setOrcamento(data.orcamento || '')
          setPublico(data.publico ?? false)
        } else {
          setRoteiro(null)
        }
      } catch (error) {
        setRoteiro(null)
      } finally {
        setLoading(false)
      }
    }

    carregarRoteiro()
  }, [id])

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

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-16 lg:px-8">
        <p className="text-slate-500">Carregando roteiro...</p>
      </main>
    )
  }

  if (!roteiro) {
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
          <h1 className="mt-3 text-4xl font-bold text-slate-900">{roteiro.titulo}</h1>
          <p className="mt-3 text-slate-600">A rota foi carregada do backend via GET /roteiros/{id}.</p>
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
        <section className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="space-y-4">
              <p className="text-sm text-slate-500">Destino</p>
              <h2 className="text-2xl font-semibold text-slate-900">{roteiro.destino}</h2>
              <p className="text-slate-600">{roteiro.descricao || 'Sem descrição cadastrada.'}</p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-700">
                <span className="rounded-2xl bg-slate-100 px-4 py-2">Orçamento: {roteiro.orcamento || 'Não informado'}</span>
                <span className="rounded-2xl bg-slate-100 px-4 py-2">{roteiro.publico ? 'Público' : 'Privado'}</span>
              </div>
            </div>
          </div>

          <aside className="card p-8">
            <h2 className="text-xl font-semibold text-slate-900">Integração com backend</h2>
            <p className="mt-3 text-slate-600">Esta tela permite editar e apagar o roteiro usando PATCH e DELETE do backend.</p>
            <div className="mt-6 space-y-3 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
              <p>ID do roteiro: <strong>{roteiro.id}</strong></p>
              <p>Usuário responsável: <strong>{roteiro.usuarioId || 'Indefinido'}</strong></p>
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
    </main>
  )
}
