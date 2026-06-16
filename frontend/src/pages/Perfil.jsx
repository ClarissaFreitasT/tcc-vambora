import { useEffect, useState } from 'react'

export default function Perfil() {
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/usuarios')
      .then((r) => r.json())
      .then((list) => setUsuario(list && list[0] ? list[0] : null))
      .catch(() => setUsuario(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-16 lg:px-8">
        <p className="text-slate-500">Carregando perfil...</p>
      </main>
    )
  }

  if (!usuario) {
    return (
      <main className="container mx-auto px-4 py-16 lg:px-8">
        <p className="text-slate-500">Nenhum usuário encontrado.</p>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-16 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_0.8fr] lg:items-start">
        <section className="space-y-5">
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">Perfil</p>
          <h1 className="text-4xl font-bold text-slate-900">{usuario.nome}</h1>
          <p className="max-w-2xl text-slate-600">Dados do primeiro usuário carregado do backend. Esta página mostra a conexão entre o frontend React e a rota /usuarios.</p>

          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="h-28 w-28 overflow-hidden rounded-full bg-slate-100">
                <img
                  className="h-full w-full object-cover"
                  src={usuario.fotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.nome)}`}
                  alt={usuario.nome}
                />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">{usuario.nome}</p>
                <p className="text-sm text-slate-600">{usuario.bio || 'Bio não cadastrada.'}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Personalidade</p>
                <p className="mt-2 font-semibold text-slate-900">{usuario.personalidade || 'N/A'}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-4">
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Orçamento</p>
                <p className="mt-2 font-semibold text-slate-900">{usuario.orcamentoPerfil || 'N/D'}</p>
              </div>
            </div>
          </div>
        </section>

        <aside className="card p-6">
          <h2 className="text-xl font-semibold text-slate-900">Resumo de conexão</h2>
          <p className="mt-3 text-slate-600">A rota do backend /usuarios é consumida diretamente aqui para montar um perfil inicial. A aplicação demonstra navegação e integração entre frontend e backend.</p>
        </aside>
      </div>
    </main>
  )
}
