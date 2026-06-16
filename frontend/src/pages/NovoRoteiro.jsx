import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function NovoRoteiro() {
  const navigate = useNavigate()
  const [titulo, setTitulo] = useState('')
  const [destino, setDestino] = useState('')
  const [descricao, setDescricao] = useState('')
  const [orcamento, setOrcamento] = useState('')
  const [publico, setPublico] = useState(true)
  const [usuarioId, setUsuarioId] = useState(null)
  const [status, setStatus] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    async function buscarUsuario() {
      try {
        const response = await fetch('/usuarios')
        const data = await response.json()

        if (Array.isArray(data) && data.length > 0) {
          setUsuarioId(data[0].id)
          setStatus(`Criando como ${data[0].nome}`)
        } else {
          const usuarioPadrao = {
            nome: 'Vambora Usuário',
            email: `vambora${Date.now()}@example.com`,
            senhaHash: 'senha123',
            fotoUrl: 'https://ui-avatars.com/api/?name=Vambora',
            bio: 'Usuário gerado automaticamente para teste.',
            personalidade: 'Aventureiro',
            orcamentoPerfil: 'R$ 1.500'
          }
          const createResponse = await fetch('/usuarios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usuarioPadrao)
          })

          if (createResponse.ok) {
            const created = await createResponse.json()
            setUsuarioId(created.usuario.id)
            setStatus(`Usuário automático criado: ${created.usuario.nome}`)
          } else {
            setStatus('Erro ao criar usuário automático. Verifique o backend.')
          }
        }
      } catch (error) {
        setStatus('Erro de conexão com o backend. Verifique se o servidor está ativo.')
      } finally {
        setLoadingUser(false)
      }
    }

    buscarUsuario()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()

    if (!usuarioId) {
      setStatus('Aguardando usuário disponível para criar o roteiro.')
      return
    }

    setStatus('Enviando roteiro...')

    const response = await fetch('/roteiros', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId, titulo, destino, descricao, orcamento, publico })
    })

    const data = await response.json()

    if (response.ok) {
      navigate('/roteiros')
    } else {
      setStatus(data.erro || 'Erro ao enviar roteiro.')
    }
  }

  return (
    <main className="container mx-auto px-4 py-16 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] text-[#00B4D8]">Novo Roteiro</p>
          <h2 className="text-3xl font-semibold text-slate-900">Formulário de criação</h2>
          <p className="max-w-2xl text-slate-600">
            Esta tela cria roteiros automaticamente para um usuário existente. Você não precisa informar o ID manualmente.
          </p>
          {status ? <p className={`rounded-3xl p-4 text-sm font-medium ${status.includes('✓') ? 'bg-[#E0F4FF] text-[#0077B6]' : 'bg-red-50 text-red-900'}`}>{status}</p> : null}
        </section>

        <section className="card p-8">
          <form className="grid gap-5" onSubmit={handleSubmit}>
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
              <p className="mt-3 text-sm text-slate-500">
                {publico ? 'O roteiro será público.' : 'O roteiro ficará privado.'}
              </p>
            </div>
            <button className="btn-primary" type="submit" disabled={loadingUser}>
              Criar roteiro
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
