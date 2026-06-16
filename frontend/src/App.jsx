const destinations = [
  {
    title: 'Lisboa',
    country: 'Portugal',
    category: 'City Escape',
    rating: '4.9',
    description: 'Passeios a pé, gastronomia local e rooftop views no coração de Lisboa.',
    image:
      'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Ilhas Maldivas',
    country: 'Maldives',
    category: 'Luxury Retreat',
    rating: '4.8',
    description: 'Resorts sobre a água, mergulho privativo e praias com areia branca.',
    image:
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Patagônia',
    country: 'Argentina',
    category: 'Nature & Trek',
    rating: '4.9',
    description: 'Trilhas glaciares, mirantes épicos e contacto profundo com a natureza.',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Kyoto',
    country: 'Japão',
    category: 'Culture Journey',
    rating: '4.8',
    description: 'Templos ancestrais, cerimônias de chá e bairros com charme histórico.',
    image:
      'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'
  }
]

const communityStories = [
  {
    name: 'Sofia',
    headline: 'Um roteiro de experiência local em Lisboa',
    image:
      'https://images.unsplash.com/photo-1519817650390-64a93db5112b?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'João',
    headline: 'Trilha exclusiva na Patagônia com guia especializado',
    image:
      'https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1200&q=80'
  },
  {
    name: 'Mariana',
    headline: 'Fotografia, gastronomia e descobertas em Kyoto',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
  }
]

const profileHighlights = [
  {
    label: 'Viagens concluídas',
    value: '24'
  },
  {
    label: 'Roteiros ativos',
    value: '6'
  },
  {
    label: 'Destinos favoritos',
    value: '12'
  }
]

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from './components/Navbar'

function App() {
  const navigate = useNavigate()
  const [roteiros, setRoteiros] = useState([])
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/roteiros').then((r) => r.json()),
      fetch('/usuarios').then((r) => r.json())
    ])
      .then(([roteirosData, usuariosData]) => {
        setRoteiros(roteirosData)
        setUsuarios(usuariosData)
      })
      .catch(() => {
        setRoteiros([])
        setUsuarios([])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="site-shell">
      <Navbar />
      <section className="relative overflow-hidden bg-emerald-600 py-20 text-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <span className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-white/90">
                Planeje · Conecte · Compartilhe
              </span>
              <h1 className="max-w-2xl text-4xl font-black sm:text-5xl">
                Um frontend React com conexão real ao backend.
              </h1>
              <p className="max-w-xl text-slate-100/90 text-lg leading-8">
                Já há consumo de API local para roteiros e usuários. O layout usa React em JavaScript e Tailwind para acelerar o desenvolvimento.
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="btn-primary" onClick={() => navigate('/roteiros')}>Ver roteiros</button>
                <button className="btn-secondary" onClick={() => navigate('/comunidade')}>Comunidade</button>
                <button className="btn-secondary" onClick={() => navigate('/roteiros/novo')}>Novo roteiro</button>
              </div>
            </div>
            <div className="rounded-[2rem] bg-white/10 p-6 shadow-2xl shadow-slate-950/10 backdrop-blur-xl">
              <img
                className="h-96 w-full rounded-[1.75rem] object-cover shadow-xl shadow-slate-950/20"
                src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80"
                alt="Casal em viagem na praia"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 lg:px-8 py-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">Conexão com backend</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-900">Dados reais carregados</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800">{roteiros.length} roteiros</span>
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800">{usuarios.length} usuários</span>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-slate-900">Roteiros recentes</h3>
            <div className="mt-6 space-y-4">
              {loading ? (
                <p className="text-slate-500">Carregando roteiros...</p>
              ) : roteiros.length > 0 ? (
                roteiros.slice(0, 4).map((roteiro) => (
                  <article key={roteiro.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <h4 className="text-lg font-semibold text-slate-900">{roteiro.titulo}</h4>
                    <p className="mt-1 text-sm text-slate-600">Destino: {roteiro.destino}</p>
                    <p className="mt-2 text-sm text-slate-500">{roteiro.descricao || 'Sem descrição disponível'}</p>
                  </article>
                ))
              ) : (
                <p className="text-slate-500">Nenhum roteiro encontrado no backend.</p>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-xl font-semibold text-slate-900">Comunidade ativa</h3>
            <div className="mt-6 space-y-4">
              {loading ? (
                <p className="text-slate-500">Carregando usuários...</p>
              ) : usuarios.length > 0 ? (
                usuarios.slice(0, 4).map((user) => (
                  <article key={user.id} className="flex flex-col gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                    <div className="h-16 w-16 overflow-hidden rounded-3xl bg-slate-200">
                      <img
                        className="h-full w-full object-cover"
                        src={user.fotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome || 'Usuário')}`}
                        alt={user.nome}
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{user.nome}</p>
                      <p className="text-sm text-slate-600">{user.bio || 'Bio não disponível'}</p>
                    </div>
                  </article>
                ))
              ) : (
                <p className="text-slate-500">Nenhum usuário encontrado no backend.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-16 text-white">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="rounded-3xl bg-slate-800/80 p-8 shadow-xl shadow-slate-950/20">
              <h3 className="text-xl font-semibold">Roteiros públicos</h3>
              <p className="mt-3 text-slate-300">Navegue entre roteiros públicos carregados diretamente do backend.</p>
            </div>
            <div className="rounded-3xl bg-slate-800/80 p-8 shadow-xl shadow-slate-950/20">
              <h3 className="text-xl font-semibold">Tela de criação</h3>
              <p className="mt-3 text-slate-300">Formulário simples com envio de dados para a rota POST de roteiros.</p>
            </div>
            <div className="rounded-3xl bg-slate-800/80 p-8 shadow-xl shadow-slate-950/20">
              <h3 className="text-xl font-semibold">Navegação React</h3>
              <p className="mt-3 text-slate-300">Rotas implementadas para home, roteiros, comunidade e perfil.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
