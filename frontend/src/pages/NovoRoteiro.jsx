import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function NovoRoteiro() {
  const navigate = useNavigate()
  const [titulo, setTitulo] = useState('')
  const [destino, setDestino] = useState('')
  const [descricao, setDescricao] = useState('')
  const [orcamento, setOrcamento] = useState('')
  const [usuarioId, setUsuarioId] = useState('u1')
  const [status, setStatus] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('Enviando...')

    const response = await fetch('/roteiros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId, titulo, destino, descricao, orcamento, publico: true })
    })

    if (response.ok) {
      setStatus('Roteiro criado com sucesso!')
      navigate('/roteiros')
    } else {
      const data = await response.json()
      setStatus(data.erro || 'Erro ao enviar roteiro.')
    }
  }

  return (
    <main className="container mx-auto px-4 py-16 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-700">Novo Roteiro</p>
          <h2 className="text-3xl font-semibold text-slate-900">Formulário de criação</h2>
          <p className="max-w-2xl text-slate-600">
            Esta tela envia dados para a rota POST de roteiros do backend. Use um usuário válido no campo usuário para que a criação seja aceita.
          </p>
          {status ? <p className="rounded-3xl bg-slate-100 p-4 text-sm text-slate-700">{status}</p> : null}
        </section>

        <section className="card p-8">
          <form className="grid gap-5" onSubmit={handleSubmit}>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              ID do usuário
              <input
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                value={usuarioId}
                onChange={(e) => setUsuarioId(e.target.value)}
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Título
              <input
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Destino
              <input
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                required
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Descrição
              <textarea
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={4}
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Orçamento
              <input
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-emerald-500"
                value={orcamento}
                onChange={(e) => setOrcamento(e.target.value)}
              />
            </label>
            <button className="btn-primary" type="submit">
              Enviar roteiro
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
