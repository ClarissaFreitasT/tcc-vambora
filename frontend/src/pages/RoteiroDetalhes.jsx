import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

export default function RoteiroDetalhes() {
  const { id } = useParams()
  const [roteiro, setRoteiro] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/roteiros/${id}`)
      .then((r) => r.json())
      .then((data) => setRoteiro(data))
      .catch(() => setRoteiro(null))
      .finally(() => setLoading(false))
  }, [id])

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
      <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="space-y-6">
          <span className="text-sm uppercase tracking-[0.3em] text-emerald-700">Detalhes do roteiro</span>
          <h1 className="text-4xl font-bold text-slate-900">{roteiro.titulo}</h1>
          <p className="text-lg font-medium text-slate-600">Destino: {roteiro.destino || 'Não informado'}</p>
          <p className="text-slate-600">{roteiro.descricao || 'Sem descrição cadastrada para este roteiro.'}</p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-700">
            <span className="rounded-2xl bg-slate-100 px-4 py-2">Orçamento: {roteiro.orcamento || '---'}</span>
            <span className="rounded-2xl bg-slate-100 px-4 py-2">Visibilidade: {roteiro.publico ? 'Público' : 'Privado'}</span>
          </div>
        </section>

        <aside className="card p-6">
          <h2 className="text-xl font-semibold text-slate-900">Integração backend</h2>
          <p className="mt-4 text-sm text-slate-600">
            Esta página ilustra a leitura do backend usando a rota GET por id.
          </p>
          <div className="mt-6 space-y-3 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
            <p>ID requisitado: <strong>{id}</strong></p>
            <p>Usuário dono do roteiro: <strong>{roteiro.usuarioId || 'Indefinido'}</strong></p>
          </div>
        </aside>
      </div>

      <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-semibold text-slate-900">Dias e atividades</h2>
        <p className="mt-3 text-slate-600">
          A rota de dias ainda não está ligada diretamente nesta tela, mas o backend já disponibiliza /dias e /itens para expansão futura.
        </p>
      </section>
    </main>
  )
}
