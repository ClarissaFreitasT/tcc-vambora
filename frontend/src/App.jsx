import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from './components/Navbar'

const destinationsDemo = [
  {
    title: 'Lisboa',
    country: 'Portugal',
    category: 'City Escape',
    rating: '4.9',
    price: 'R$ 2.999',
    image: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Ilhas Maldivas',
    country: 'Maldives',
    category: 'Luxury Retreat',
    rating: '4.8',
    price: 'R$ 5.999',
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Patagônia',
    country: 'Argentina',
    category: 'Nature & Trek',
    rating: '4.9',
    price: 'R$ 3.499',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80'
  },
  {
    title: 'Kyoto',
    country: 'Japão',
    category: 'Culture Journey',
    rating: '4.8',
    price: 'R$ 4.299',
    image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'
  }
]

const features = [
  {
    icon: '🗺️',
    title: 'Expertise Local',
    description: 'Roteiros criados por viajantes experientes com conhecimento profundo dos destinos.'
  },
  {
    icon: '📅',
    title: 'Planejamento Flexível',
    description: 'Customize cada roteiro de acordo com seu tempo, orçamento e preferências pessoais.'
  },
  {
    icon: '🎧',
    title: 'Suporte 24/7',
    description: 'Estamos sempre disponíveis para ajudar durante sua jornada de viagem.'
  }
]

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

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-[#E0F4FF] to-white py-0">
        <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-8 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            {/* Left Content */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-8">
              <div>
                <span className="inline-flex rounded-full border border-[#00B4D8]/20 bg-[#00B4D8]/5 px-4 py-2 text-sm font-semibold uppercase tracking-[0.4em] text-[#00B4D8]">
                  Descubra · Planeje · Viaje
                </span>
              </div>

              <div>
                <h1 className="text-5xl font-black leading-[1.1] text-[#0F172A] sm:text-6xl">
                  Planeje suas viagens dos <span className="text-[#00B4D8]">sonhos</span>
                </h1>
              </div>

              <p className="max-w-xl text-lg leading-8 text-[#64748B]">
                Descubra roteiros curados por viajantes apaixonados. De praias paradisíacas a trilhas épicas, encontre a aventura perfeita para você.
              </p>

              <div className="flex flex-wrap gap-4">
                <button className="btn-accent" onClick={() => navigate('/roteiros')}>
                  Explorar Roteiros
                </button>
                <button className="btn-secondary" onClick={() => navigate('/roteiros/novo')}>
                  Criar Meu Roteiro
                </button>
              </div>

              {/* Stats */}
              <div className="grid gap-6 pt-4 sm:grid-cols-3">
                <div>
                  <p className="text-2xl font-black text-[#0F172A]">{roteiros.length}+</p>
                  <p className="text-sm text-[#64748B]">Roteiros ativos</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#0F172A]">{usuarios.length}+</p>
                  <p className="text-sm text-[#64748B]">Viajantes</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-[#0F172A]">4.9★</p>
                  <p className="text-sm text-[#64748B]">Avaliação média</p>
                </div>
              </div>
            </motion.div>

            {/* Right Hero Image */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }} className="relative">
              <div className="relative rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,180,216,0.15)]">
                <img
                  className="h-[500px] w-full object-cover"
                  src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80"
                  alt="Praia tropical inspiradora"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-b border-[#E2E8F0] bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <div className="mb-16 space-y-4">
            <p className="text-sm uppercase tracking-[0.24em] text-[#00B4D8] font-semibold">Por que escolher o VAMBORA</p>
            <h2 className="text-3xl font-black text-[#0F172A] sm:text-4xl">Tudo que você precisa para viagens incríveis</h2>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.2, duration: 0.5 }}
                className="card p-8"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-[#0F172A]">{feature.title}</h3>
                <p className="mt-3 text-[#64748B]">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Destinations */}
      <section className="border-b border-[#E2E8F0] bg-[#F8FAFC] py-16 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.24em] text-[#00B4D8] font-semibold">Destinos populares</p>
              <h2 className="text-3xl font-black text-[#0F172A] sm:text-4xl">Explore os melhores roteiros</h2>
            </div>
            <button className="btn-secondary w-fit" onClick={() => navigate('/roteiros')}>
              Ver todos os roteiros →
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-[#64748B]">Carregando roteiros...</p>
            </div>
          ) : roteiros.length > 0 ? (
            <div className="grid gap-8 lg:grid-cols-2">
              {roteiros.slice(0, 4).map((roteiro, idx) => (
                <motion.article
                  key={roteiro.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  onClick={() => navigate(`/roteiros/${roteiro.id}`)}
                  className="card group cursor-pointer overflow-hidden"
                >
                  <div className="aspect-video overflow-hidden bg-slate-200">
                    <img
                      src={destinationsDemo[idx]?.image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'}
                      alt={roteiro.titulo}
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-[#0F172A]">{roteiro.titulo}</h3>
                        <p className="mt-1 text-sm text-[#64748B]">📍 {roteiro.destino}</p>
                      </div>
                      <span className="rounded-full bg-[#FFB703]/10 px-3 py-1 text-sm font-semibold text-[#FFB703]">
                        {destinationsDemo[idx]?.price || 'Sob consulta'}
                      </span>
                    </div>
                    <p className="mt-4 text-[#64748B] line-clamp-2">{roteiro.descricao || 'Roteiro de viagem completo'}</p>
                    <div className="mt-6 flex items-center justify-between pt-6 border-t border-[#E2E8F0]">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#FFB703]">★ {destinationsDemo[idx]?.rating || '4.8'}</span>
                      </span>
                      <span className="text-xs font-semibold text-[#00B4D8]">Ver detalhes →</span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="rounded-[20px] border border-[#E2E8F0] bg-white p-12 text-center">
              <p className="text-[#64748B]">Nenhum roteiro encontrado. Crie o seu primeiro roteiro!</p>
            </div>
          )}
        </div>
      </section>

      {/* Community Section */}
      <section className="border-b border-[#E2E8F0] bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <div className="mb-12 space-y-4">
            <p className="text-sm uppercase tracking-[0.24em] text-[#00B4D8] font-semibold">Nossa comunidade</p>
            <h2 className="text-3xl font-black text-[#0F172A] sm:text-4xl">Viajantes apaixonados em todo o mundo</h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-[#64748B]">Carregando comunidade...</p>
            </div>
          ) : usuarios.length > 0 ? (
            <div className="grid gap-8 lg:grid-cols-4">
              {usuarios.slice(0, 4).map((user, idx) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className="card overflow-hidden"
                >
                  <div className="aspect-square overflow-hidden bg-slate-200">
                    <img
                      className="h-full w-full object-cover"
                      src={user.fotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nome || 'Usuário')}`}
                      alt={user.nome}
                    />
                  </div>
                  <div className="p-6">
                    <p className="font-semibold text-[#0F172A]">{user.nome}</p>
                    <p className="mt-2 text-sm text-[#64748B] line-clamp-2">{user.bio || 'Viajante apaixonado'}</p>
                    <button className="btn-primary mt-4 w-full text-sm" onClick={() => navigate('/comunidade')}>
                      Ver perfil
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-[20px] border border-[#E2E8F0] bg-[#F8FAFC] p-12 text-center">
              <p className="text-[#64748B]">Seja o primeiro a se juntar à nossa comunidade!</p>
              <button className="btn-primary mt-6" onClick={() => navigate('/perfil')}>
                Criar meu perfil
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0077B6] to-[#00B4D8] py-20 text-white lg:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,#fff,transparent),radial-gradient(circle_at_80%_80%,#fff,transparent)]" />
        </div>

        <div className="relative mx-auto max-w-[1280px] px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl font-black leading-[1.2] sm:text-5xl">
              Pronto para sua próxima aventura?
            </h2>
            <p className="mt-6 text-lg text-white/90">
              Junte-se a milhares de viajantes que já estão descobrindo roteiros incríveis com o VAMBORA.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                className="inline-flex items-center justify-center rounded-full bg-[#FFB703] px-8 py-3 text-sm font-semibold text-[#0F172A] shadow-lg shadow-[#FFB703]/30 transition hover:bg-[#E5A500]"
                onClick={() => navigate('/perfil')}
              >
                Começar agora
              </button>
              <button className="btn-secondary" onClick={() => navigate('/roteiros')}>
                Explorar roteiros
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-16 lg:py-24">
        <div className="mx-auto max-w-[1280px] px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-4">
            <div>
              <p className="text-xl font-black text-[#0F172A]">✈️ VAMBORA</p>
              <p className="mt-4 text-[#64748B]">Planeje suas viagens dos sonhos com roteiros curados pela comunidade.</p>
            </div>
            <div>
              <p className="font-semibold text-[#0F172A]">Produto</p>
              <ul className="mt-4 space-y-3">
                <li><a href="#" className="text-[#64748B] transition hover:text-[#00B4D8]">Roteiros</a></li>
                <li><a href="#" className="text-[#64748B] transition hover:text-[#00B4D8]">Comunidade</a></li>
                <li><a href="#" className="text-[#64748B] transition hover:text-[#00B4D8]">Sobre</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#0F172A]">Recursos</p>
              <ul className="mt-4 space-y-3">
                <li><a href="#" className="text-[#64748B] transition hover:text-[#00B4D8]">Blog</a></li>
                <li><a href="#" className="text-[#64748B] transition hover:text-[#00B4D8]">Suporte</a></li>
                <li><a href="#" className="text-[#64748B] transition hover:text-[#00B4D8]">Contato</a></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-[#0F172A]">Legal</p>
              <ul className="mt-4 space-y-3">
                <li><a href="#" className="text-[#64748B] transition hover:text-[#00B4D8]">Privacidade</a></li>
                <li><a href="#" className="text-[#64748B] transition hover:text-[#00B4D8]">Termos</a></li>
                <li><a href="#" className="text-[#64748B] transition hover:text-[#00B4D8]">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-[#E2E8F0] pt-8 text-center">
            <p className="text-[#64748B]">© 2026 VAMBORA. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </main>
  )
}

export default App
